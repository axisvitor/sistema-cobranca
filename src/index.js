require('dotenv').config();
const express = require('express');
const cors = require('cors');
const winston = require('winston');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Importar configurações de banco de dados
const conectarMongoDB = require('./config/mongodb');
const redisClient = require('./config/redis');

// Importar serviços
const whatsappService = require('./services/whatsappService');
const notificacaoService = require('./services/notificacaoService');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');

// Configuração do Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar diretório de uploads
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Configurar Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Sistema de Cobrança',
  customfavIcon: '/favicon.ico'
}));

// Rota para download da especificação OpenAPI
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Inicializar conexões e serviços
const inicializarAplicacao = async () => {
  try {
    // Conectar ao MongoDB
    await conectarMongoDB();
    
    // Conectar ao Redis
    await redisClient.conectar();
    
    // Inicializar WhatsApp
    await whatsappService.inicializar();
    
    // Inicializar serviço de notificações
    await notificacaoService.inicializar();
    
    logger.info('Todos os serviços foram inicializados com sucesso');
    return true;
  } catch (erro) {
    logger.error(`Erro ao inicializar aplicação: ${erro.message}`);
    throw erro;
  }
};

// Rotas
app.get('/', (req, res) => {
  res.json({ 
    message: 'API do Sistema de Cobrança Automática',
    docs: '/api-docs',
    spec: '/swagger.json'
  });
});

// Adicionar rotas da aplicação
app.use('/api', authRoutes);
app.use('/api', clienteRoutes);
app.use('/api', uploadRoutes);
app.use('/api', notificacaoRoutes);

// Tratamento de Erros
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    erro: 'Algo deu errado!',
    detalhes: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

// Iniciar servidor apenas após inicializar todos os serviços
inicializarAplicacao()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Documentação disponível em http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((erro) => {
    logger.error(`Falha ao iniciar aplicação: ${erro.message}`);
    process.exit(1);
  }); 