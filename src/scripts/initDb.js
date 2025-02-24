require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const logger = require('winston');

const initDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Conectado ao MongoDB');

    // Verificar se já existe um admin
    const adminExistente = await Usuario.findOne({ cargo: 'ADMIN' });
    
    if (!adminExistente) {
      // Criar usuário admin padrão
      const admin = new Usuario({
        nome: 'Administrador',
        email: process.env.ADMIN_EMAIL || 'admin@sistema.com',
        senha: process.env.ADMIN_SENHA || 'admin123',
        telefone: process.env.ADMIN_TELEFONE || '5511999999999',
        cargo: 'ADMIN'
      });

      await admin.save();
      logger.info('Usuário admin criado com sucesso');
    } else {
      logger.info('Usuário admin já existe');
    }

    // Criar índices necessários
    await Usuario.collection.createIndex({ email: 1 }, { unique: true });
    await Usuario.collection.createIndex({ telefone: 1 });
    
    logger.info('Índices criados com sucesso');
    
    process.exit(0);
  } catch (erro) {
    logger.error(`Erro ao inicializar banco de dados: ${erro.message}`);
    process.exit(1);
  }
};

initDb(); 