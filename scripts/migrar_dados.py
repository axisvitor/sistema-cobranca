#!/usr/bin/env python3
import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv
import redis
from pymongo import MongoClient
from bson import ObjectId

# Carregar variáveis de ambiente
load_dotenv()

class MigradorDados:
    def __init__(self):
        # Configurações Redis
        self.redis_url = os.getenv('REDIS_URL')
        self.redis_username = os.getenv('REDIS_USERNAME')
        self.redis_password = os.getenv('REDIS_PASSWORD')
        self.redis_db = int(os.getenv('REDIS_DB', '0'))

        # Configurações MongoDB
        self.mongodb_uri = os.getenv('MONGODB_URI')
        
        # Prefixos do Redis
        self.prefixos = {
            'cobranca': 'cobranca:*',           # Hash - Dados da cobrança
            'notificacao': 'notificacao:*',      # String - Status da notificação
            'fila': 'fila:*',                   # List - Filas de processamento
            'cliente': 'cliente:*',             # Hash - Cache de clientes
            'sessao': 'sessao:*',              # Hash - Dados de sessão
            'token': 'token:*',                # String - Tokens temporários
            'contador': 'contador:*',           # String - Contadores
            'lock': 'lock:*'                    # String - Locks distribuídos
        }
        
        self.clientes_processados = {}
        self.notificacoes_processadas = {}

    def conectar_redis(self):
        """Conecta ao Redis"""
        try:
            print("\n🔄 Conectando ao Redis...")
            self.redis_client = redis.from_url(
                self.redis_url,
                username=self.redis_username if self.redis_username else None,
                password=self.redis_password if self.redis_password else None,
                db=self.redis_db,
                decode_responses=True
            )
            self.redis_client.ping()
            print("✅ Conectado ao Redis com sucesso")
            return True
        except Exception as e:
            print(f"❌ Erro ao conectar ao Redis: {str(e)}")
            return False

    def conectar_mongodb(self):
        """Conecta ao MongoDB"""
        try:
            print("\n🔄 Conectando ao MongoDB...")
            self.mongo_client = MongoClient(self.mongodb_uri)
            self.db = self.mongo_client.get_database()
            print("✅ Conectado ao MongoDB com sucesso")
            return True
        except Exception as e:
            print(f"❌ Erro ao conectar ao MongoDB: {str(e)}")
            return False

    def processar_cliente(self, dados_cobranca):
        """Processa dados do cliente"""
        cliente = {
            'nome': dados_cobranca['nome'],
            'telefone': dados_cobranca['telefone'].replace('55', '', 1) if dados_cobranca['telefone'].startswith('55') else dados_cobranca['telefone'],
            'cpfCnpj': dados_cobranca.get('historico', '').split(' - ')[0] if dados_cobranca.get('historico') else dados_cobranca['documento'],
            'dividas': [],
            'notificacoes': []
        }
        
        # Verificar se cliente já existe
        cliente_existente = self.db.clientes.find_one({'cpfCnpj': cliente['cpfCnpj']})
        if cliente_existente:
            return cliente_existente['_id']
        
        # Inserir novo cliente
        resultado = self.db.clientes.insert_one(cliente)
        return resultado.inserted_id

    def processar_divida(self, dados_cobranca):
        """Processa dados da dívida"""
        try:
            data_vencimento = datetime.strptime(dados_cobranca['data_vencimento'], '%d/%m/%Y')
        except:
            data_vencimento = datetime.now()

        valor = dados_cobranca['valor']
        if isinstance(valor, str):
            valor = float(valor.replace('R$', '').replace('.', '').replace(',', '.').strip())

        return {
            'valor': valor,
            'dataVencimento': data_vencimento,
            'descricao': dados_cobranca.get('historico', ''),
            'status': 'VENCIDO' if dados_cobranca.get('status', '').upper() == 'VENCIDO' else 'PENDENTE',
            'documento': dados_cobranca['documento']
        }

    def processar_notificacao(self, chave, valor, cliente_id):
        """Processa dados de notificação"""
        partes = chave.split(':')
        if len(partes) != 2:
            return None

        try:
            dados = json.loads(valor) if isinstance(valor, str) else valor
        except:
            dados = {'status': valor}

        return {
            'tipo': 'WHATSAPP',
            'dataEnvio': datetime.now(),
            'status': 'ENVIADO' if dados.get('status', '').upper() == 'ENVIADO' else 'PENDENTE',
            'mensagem': dados.get('mensagem', f"Notificação automática para documento {partes[1]}")
        }

    def processar_fila(self, chave, items):
        """Processa items da fila"""
        print(f"\n📋 Processando fila: {chave}")
        for item in items:
            try:
                dados = json.loads(item)
                print(f"  └─ Item: {dados}")
                
                # Processar item baseado no tipo de fila
                if chave == 'fila:cobrancas':
                    cliente = self.db.clientes.find_one({'_id': ObjectId(dados['clienteId'])})
                    if cliente:
                        print(f"    └─ Cliente encontrado: {cliente['nome']}")
                        
                        # Adicionar à fila do MongoDB
                        self.db.filas.update_one(
                            {'tipo': 'cobrancas'},
                            {'$push': {'items': dados}},
                            upsert=True
                        )
            except Exception as e:
                print(f"❌ Erro ao processar item da fila: {str(e)}")

    def migrar_dados(self):
        """Realiza a migração dos dados"""
        try:
            print("\n🔄 Iniciando migração de dados...")
            
            # Estatísticas
            stats = {
                'cobrancas': 0,
                'notificacoes': 0,
                'filas': 0,
                'clientes': 0,
                'sessoes': 0,
                'tokens': 0
            }
            
            # Processar cada tipo de dado
            for tipo, padrao in self.prefixos.items():
                print(f"\n📦 Processando {tipo}...")
                chaves = self.redis_client.keys(padrao)
                
                for chave in chaves:
                    tipo_dado = self.redis_client.type(chave)
                    print(f"\n🔑 Chave: {chave} (Tipo: {tipo_dado})")
                    
                    if tipo_dado == 'hash':
                        if chave.startswith('cobranca:'):
                            dados = self.redis_client.hgetall(chave)
                            if dados:
                                cliente_id = self.processar_cliente(dados)
                                divida = self.processar_divida(dados)
                                self.db.clientes.update_one(
                                    {'_id': cliente_id},
                                    {'$addToSet': {'dividas': divida}}
                                )
                                stats['cobrancas'] += 1
                                print(f"✅ Cobrança processada: {divida['documento']}")
                        
                        elif chave.startswith('cliente:'):
                            dados = self.redis_client.hgetall(chave)
                            if dados:
                                stats['clientes'] += 1
                                print(f"ℹ️ Cache de cliente encontrado: {chave}")
                        
                        elif chave.startswith('sessao:'):
                            dados = self.redis_client.hgetall(chave)
                            if dados:
                                stats['sessoes'] += 1
                                print(f"ℹ️ Dados de sessão encontrados: {chave}")
                    
                    elif tipo_dado == 'string':
                        if chave.startswith('notificacao:'):
                            valor = self.redis_client.get(chave)
                            documento = chave.split(':')[1]
                            cliente = self.db.clientes.find_one({'dividas.documento': documento})
                            
                            if cliente and valor:
                                notificacao = self.processar_notificacao(chave, valor, cliente['_id'])
                                if notificacao:
                                    self.db.clientes.update_one(
                                        {'_id': cliente['_id']},
                                        {'$addToSet': {'notificacoes': notificacao}}
                                    )
                                    stats['notificacoes'] += 1
                                    print(f"✅ Notificação processada: {documento}")
                        
                        elif chave.startswith('token:'):
                            valor = self.redis_client.get(chave)
                            if valor:
                                stats['tokens'] += 1
                                print(f"ℹ️ Token encontrado: {chave}")
                    
                    elif tipo_dado == 'list':
                        if chave.startswith('fila:'):
                            items = self.redis_client.lrange(chave, 0, -1)
                            if items:
                                self.processar_fila(chave, items)
                                stats['filas'] += 1
                                print(f"✅ Fila processada: {chave}")

            print("\n✅ Migração concluída com sucesso!")
            
            # Exibir estatísticas
            print("\n📊 Estatísticas da migração:")
            for tipo, quantidade in stats.items():
                print(f"🔸 {tipo.capitalize()}: {quantidade}")

            # Estatísticas do MongoDB
            total_clientes = self.db.clientes.count_documents({})
            total_dividas = self.db.clientes.aggregate([
                {'$unwind': '$dividas'},
                {'$count': 'total'}
            ]).next()['total']
            
            print(f"\n📊 Dados no MongoDB:")
            print(f"🔸 Total de clientes: {total_clientes}")
            print(f"🔸 Total de dívidas: {total_dividas}")

        except Exception as e:
            print(f"\n❌ Erro durante a migração: {str(e)}")
            raise e

def main():
    migrador = MigradorDados()
    
    # Conectar aos bancos
    if not migrador.conectar_redis():
        sys.exit(1)
    if not migrador.conectar_mongodb():
        sys.exit(1)
    
    # Realizar migração
    migrador.migrar_dados()

if __name__ == "__main__":
    main() 