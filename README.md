# Sistema de Cobrança Automática via WhatsApp

Sistema web desenvolvido em Node.js para automatização de cobranças via WhatsApp, com integração MongoDB e Redis.

## 🚀 Funcionalidades

- ✅ **Gerenciamento de Clientes**
  - Cadastro e atualização de clientes
  - Histórico de cobranças e notificações
  - Importação em massa via Excel

- 💰 **Gestão de Cobranças**
  - Controle de dívidas e vencimentos
  - Status de pagamentos
  - Relatórios gerenciais

- 📱 **Notificações WhatsApp**
  - Envio automático de cobranças
  - Templates personalizáveis
  - Fila de processamento com Redis
  - Confirmação de entrega

- 🔒 **Segurança**
  - Autenticação JWT
  - Controle de acesso por perfil
  - Logs de atividades
  - Backup automático

## 🛠️ Tecnologias

- **Backend:**
  - Node.js + Express
  - MongoDB (persistência)
  - Redis (cache e filas)
  - JWT (autenticação)
  
- **Integrações:**
  - WPPConnect (WhatsApp)
  - Excel (importação/exportação)
  
- **DevOps:**
  - PM2 (gestão de processos)
  - Winston (logs)
  - Swagger (documentação)

## 📋 Pré-requisitos

- Node.js 18+
- MongoDB
- Redis
- Python 3.8+ (scripts auxiliares)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/sistema-cobranca.git
cd sistema-cobranca
```

2. Instale as dependências:
```bash
# Node.js
npm install

# Python (scripts auxiliares)
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
pip install -r scripts/requirements.txt
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Configure o arquivo `.env` com suas credenciais:
```env
# Servidor
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=sua_uri_mongodb

# Redis
REDIS_URL=sua_url_redis
REDIS_USERNAME=seu_usuario
REDIS_PASSWORD=sua_senha

# JWT
JWT_SECRET=seu_jwt_secret
JWT_EXPIRATION=24h

# Admin Padrão
ADMIN_EMAIL=admin@exemplo.com
ADMIN_SENHA=senha_segura
ADMIN_TELEFONE=5511999999999
```

5. Inicialize o banco de dados:
```bash
npm run init-db
```

## 🚀 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run prod
```

## 📚 Documentação

A documentação da API está disponível em:
- Swagger UI: `http://localhost:3000/api-docs`
- Especificação OpenAPI: `http://localhost:3000/swagger.json`

## 🔄 Scripts Disponíveis

- `npm start`: Inicia o servidor
- `npm run dev`: Modo desenvolvimento
- `npm test`: Executa testes
- `npm run backup`: Backup MongoDB
- `npm run lint`: Verifica código
- `npm run format`: Formata código

## 📦 Estrutura do Projeto

```
.
├── src/
│   ├── config/         # Configurações
│   ├── controllers/    # Controladores
│   ├── models/        # Modelos
│   ├── routes/        # Rotas
│   ├── services/      # Serviços
│   └── scripts/       # Scripts
├── scripts/           # Scripts Python
├── docs/             # Documentação
└── tests/            # Testes
```

## 🔒 Segurança

- Autenticação via JWT
- Senhas criptografadas (bcrypt)
- Validação de dados (Yup)
- CORS configurado
- Rate limiting
- Proteção contra ataques comuns

## 📊 Monitoramento

- Logs em `logs/`
  - `error.log`: Erros
  - `combined.log`: Todos os logs
- PM2 para monitoramento:
  ```bash
  npm run prod:monitor
  ```

## 🔄 Backup

Backup automático diário do MongoDB:
```bash
npm run backup
```

Os backups são armazenados em `backups/`.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Agradecimentos

- [WPPConnect](https://github.com/wppconnect-team/wppconnect) pela biblioteca de integração com WhatsApp
- Todos os contribuidores que ajudaram a tornar este projeto melhor 