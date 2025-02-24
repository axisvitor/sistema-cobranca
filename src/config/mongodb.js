const mongoose = require('mongoose');
const logger = require('winston');

const conectarMongoDB = async () => {
  try {
    const opcoesConexao = {
      // Configurações de pool de conexões
      maxPoolSize: 10,
      minPoolSize: 2,
      
      // Tempo limite de conexão (30 segundos)
      connectTimeoutMS: 30000,
      
      // Tempo limite de operações (30 segundos)
      socketTimeoutMS: 30000,
      
      // Configurações de retry
      retryWrites: true,
      retryReads: true,
      
      // Configurações de heartbeat
      heartbeatFrequencyMS: 10000,
      
      // Configurações de timeout
      serverSelectionTimeoutMS: 30000,
      
      // Configurações de keep-alive
      keepAlive: true,
      keepAliveInitialDelay: 300000,
      
      // Configurações adicionais
      autoIndex: true,
      compressors: ['zlib']
    };

    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, opcoesConexao);
    
    logger.info('Conectado ao MongoDB com sucesso');

    // Listeners de eventos de conexão
    mongoose.connection.on('error', (erro) => {
      logger.error(`Erro na conexão MongoDB: ${erro.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado. Tentando reconectar...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconectado com sucesso');
    });

    mongoose.connection.on('reconnectFailed', () => {
      logger.error('Falha na reconexão com MongoDB após várias tentativas');
    });

    // Manipular sinais de término do processo
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('Conexão MongoDB fechada devido ao encerramento do aplicativo');
        process.exit(0);
      } catch (erro) {
        logger.error(`Erro ao fechar conexão MongoDB: ${erro.message}`);
        process.exit(1);
      }
    });

    return true;
  } catch (erro) {
    logger.error(`Erro ao conectar ao MongoDB: ${erro.message}`);
    throw erro;
  }
};

module.exports = conectarMongoDB; 