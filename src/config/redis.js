const { createClient } = require('redis');
const logger = require('winston');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async conectar() {
    try {
      if (this.client) {
        return this.client;
      }

      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          // Tempo limite de conexão (30 segundos)
          connectTimeout: 30000,
          
          // Tempo limite de reconexão (5 segundos)
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              logger.error('Número máximo de tentativas de reconexão Redis atingido');
              return new Error('Número máximo de tentativas de reconexão atingido');
            }
            
            const delay = Math.min(retries * 1000, 5000);
            logger.warn(`Tentativa ${retries} de reconexão Redis em ${delay}ms`);
            return delay;
          },

          // Keepalive
          keepAlive: 5000,
          noDelay: true,
          timeout: 30000
        },
        
        // Configurações do cliente
        readonly: false,
        legacyMode: false,
        
        // Configurações de performance
        commandsQueueMaxLength: 1000,
        disableOfflineQueue: false,
        
        // Configurações de retry
        retryStrategy: (times) => {
          if (times > this.maxReconnectAttempts) {
            return null;
          }
          return Math.min(times * 1000, 5000);
        },

        // Configurações de segurança
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        
        // Configurações de database
        database: parseInt(process.env.REDIS_DB || '0'),
        
        // Configurações de performance
        enableAutoPipelining: true,
        enableOfflineQueue: true,
        maxRetriesPerRequest: 3,
        
        // Configurações de timeout
        commandTimeout: 5000,
        
        // Configurações de compressão
        enableCompression: true
      });

      // Listeners de eventos
      this.client.on('connect', () => {
        logger.info('Conectando ao Redis...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logger.info('Redis conectado e pronto para uso');
      });

      this.client.on('error', (erro) => {
        logger.error(`Erro na conexão Redis: ${erro.message}`);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('Conexão Redis encerrada');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        logger.warn(`Tentando reconectar ao Redis (tentativa ${this.reconnectAttempts})`);
      });

      // Conectar ao Redis
      await this.client.connect();
      
      // Manipular encerramento gracioso
      process.on('SIGINT', async () => {
        try {
          await this.desconectar();
          logger.info('Conexão Redis fechada devido ao encerramento do aplicativo');
        } catch (erro) {
          logger.error(`Erro ao fechar conexão Redis: ${erro.message}`);
        }
      });

      return this.client;
    } catch (erro) {
      logger.error(`Erro ao conectar ao Redis: ${erro.message}`);
      throw erro;
    }
  }

  async desconectar() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Cliente Redis não está conectado');
    }
    return this.client;
  }
}

module.exports = new RedisClient(); 