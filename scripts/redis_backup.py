#!/usr/bin/env python3
import redis
import json
import argparse
from datetime import datetime
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

class RedisBackup:
    def __init__(self):
        # Configurações do Redis do arquivo .env
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.redis_username = os.getenv('REDIS_USERNAME', '')
        self.redis_password = os.getenv('REDIS_PASSWORD', '')
        self.redis_db = int(os.getenv('REDIS_DB', '0'))
        
        # Diretório para backups
        self.backup_dir = os.getenv('BACKUP_DIR', './backups/redis')
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)

    def conectar_redis(self):
        """Estabelece conexão com o Redis"""
        try:
            print("\n🔄 Conectando ao Redis...")
            print(f"📍 URL: {self.redis_url}")
            print(f"👤 Usuário: {self.redis_username}")
            print(f"🗄️ Database: {self.redis_db}")
            
            # Criar cliente Redis
            self.redis_client = redis.from_url(
                self.redis_url,
                username=self.redis_username if self.redis_username else None,
                password=self.redis_password if self.redis_password else None,
                db=self.redis_db,
                decode_responses=True  # Já decodifica as respostas
            )
            
            # Testar conexão
            self.redis_client.ping()
            
            info = self.redis_client.info()
            print("\n📊 Informações do Redis:")
            print(f"🔸 Versão: {info.get('redis_version')}")
            print(f"🔸 Modo: {info.get('redis_mode', 'standalone')}")
            print(f"🔸 Sistema Operacional: {info.get('os')}")
            print(f"🔸 Memória Usada: {info.get('used_memory_human')}")
            print(f"🔸 Clientes Conectados: {info.get('connected_clients')}")
            print(f"🔸 Total de Chaves: {info.get('db' + str(self.redis_db), {}).get('keys', 0)}")
            
            return True
        except Exception as e:
            print(f"\n❌ Erro ao conectar ao Redis: {str(e)}")
            return False

    def listar_chaves(self, padrao="*"):
        """Lista todas as chaves que correspondem ao padrão"""
        try:
            print(f"\n🔍 Buscando chaves com padrão: {padrao}")
            chaves = self.redis_client.keys(padrao)
            print(f"📝 Total de chaves encontradas: {len(chaves)}")
            return chaves
        except Exception as e:
            print(f"❌ Erro ao listar chaves: {str(e)}")
            return []

    def obter_tipo_valor(self, chave):
        """Obtém o tipo e valor de uma chave"""
        try:
            tipo = self.redis_client.type(chave)
            valor = None

            if tipo == 'string':
                valor = self.redis_client.get(chave)
                try:
                    # Tentar decodificar JSON
                    valor = json.loads(valor)
                except:
                    pass
            elif tipo == 'hash':
                valor = self.redis_client.hgetall(chave)
            elif tipo == 'list':
                valor = self.redis_client.lrange(chave, 0, -1)
            elif tipo == 'set':
                valor = list(self.redis_client.smembers(chave))
            elif tipo == 'zset':
                valor = self.redis_client.zrange(chave, 0, -1, withscores=True)

            return tipo, valor
        except Exception as e:
            print(f"❌ Erro ao obter valor da chave {chave}: {str(e)}")
            return None, None

    def realizar_backup(self, padrao="*"):
        """Realiza backup de todas as chaves que correspondem ao padrão"""
        try:
            backup_data = {}
            chaves = self.listar_chaves(padrao)

            for chave in chaves:
                tipo, valor = self.obter_tipo_valor(chave)
                if tipo and valor:
                    backup_data[chave] = {
                        'tipo': tipo,
                        'valor': valor,
                        'ttl': self.redis_client.ttl(chave)
                    }

            # Gerar nome do arquivo de backup
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            arquivo_backup = os.path.join(self.backup_dir, f'redis_backup_{timestamp}.json')

            # Salvar backup
            with open(arquivo_backup, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)

            print(f"✅ Backup realizado com sucesso: {arquivo_backup}")
            print(f"📊 Total de chaves: {len(backup_data)}")
            return arquivo_backup
        except Exception as e:
            print(f"❌ Erro ao realizar backup: {str(e)}")
            return None

    def restaurar_backup(self, arquivo):
        """Restaura dados de um arquivo de backup"""
        try:
            with open(arquivo, 'r', encoding='utf-8') as f:
                backup_data = json.load(f)

            for chave, dados in backup_data.items():
                tipo = dados['tipo']
                valor = dados['valor']
                ttl = dados['ttl']

                # Deletar chave se já existir
                self.redis_client.delete(chave)

                # Restaurar valor baseado no tipo
                if tipo == 'string':
                    self.redis_client.set(chave, valor)
                elif tipo == 'hash':
                    self.redis_client.hset(chave, mapping=valor)
                elif tipo == 'list':
                    if valor:
                        self.redis_client.rpush(chave, *valor)
                elif tipo == 'set':
                    if valor:
                        self.redis_client.sadd(chave, *valor)
                elif tipo == 'zset':
                    for membro, score in valor:
                        self.redis_client.zadd(chave, {membro: score})

                # Restaurar TTL se existir
                if ttl > 0:
                    self.redis_client.expire(chave, ttl)

            print(f"✅ Backup restaurado com sucesso: {arquivo}")
            print(f"📊 Total de chaves restauradas: {len(backup_data)}")
            return True
        except Exception as e:
            print(f"❌ Erro ao restaurar backup: {str(e)}")
            return False

    def visualizar_dados(self, padrao="*"):
        """Visualiza todos os dados que correspondem ao padrão"""
        try:
            chaves = self.listar_chaves(padrao)
            dados = {}
            
            if not chaves:
                print("\n⚠️ Nenhuma chave encontrada!")
                return None

            print("\n📋 Analisando dados...")
            for chave in chaves:
                tipo, valor = self.obter_tipo_valor(chave)
                if tipo and valor is not None:
                    ttl = self.redis_client.ttl(chave)
                    dados[chave] = {
                        'tipo': tipo,
                        'valor': valor,
                        'ttl': ttl
                    }
                    print(f"\n✨ Chave encontrada: {chave}")
                    print(f"   └─ Tipo: {tipo}")
                    print(f"   └─ TTL: {ttl if ttl > -1 else 'sem expiração'}")

            return dados
        except Exception as e:
            print(f"❌ Erro ao visualizar dados: {str(e)}")
            return None

def main():
    parser = argparse.ArgumentParser(description='Utilitário de Backup do Redis')
    parser.add_argument('acao', choices=['backup', 'restore', 'view'], 
                      help='Ação a ser executada')
    parser.add_argument('--padrao', default="*", 
                      help='Padrão para filtrar chaves (default: *)')
    parser.add_argument('--arquivo', 
                      help='Arquivo de backup para restauração')
    
    args = parser.parse_args()
    
    redis_backup = RedisBackup()
    if not redis_backup.conectar_redis():
        return

    if args.acao == 'backup':
        redis_backup.realizar_backup(args.padrao)
    
    elif args.acao == 'restore':
        if not args.arquivo:
            print("❌ Arquivo de backup não especificado")
            return
        redis_backup.restaurar_backup(args.arquivo)
    
    elif args.acao == 'view':
        dados = redis_backup.visualizar_dados(args.padrao)
        if dados:
            print("\n📋 Detalhes dos Dados:")
            for chave, info in dados.items():
                print(f"\n🔑 Chave: {chave}")
                print(f"📝 Tipo: {info['tipo']}")
                print(f"⏳ TTL: {info['ttl'] if info['ttl'] > -1 else 'sem expiração'}")
                print(f"📄 Valor: {json.dumps(info['valor'], indent=2, ensure_ascii=False)}")

if __name__ == "__main__":
    main() 