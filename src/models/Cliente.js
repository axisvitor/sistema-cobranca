const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  telefone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  cpfCnpj: {
    type: String,
    required: [true, 'CPF/CNPJ é obrigatório'],
    unique: true,
    trim: true
  },
  dividas: [{
    valor: {
      type: Number,
      required: true
    },
    dataVencimento: {
      type: Date,
      required: true
    },
    descricao: String,
    status: {
      type: String,
      enum: ['PENDENTE', 'PAGO', 'VENCIDO'],
      default: 'PENDENTE'
    }
  }],
  notificacoes: [{
    tipo: {
      type: String,
      enum: ['WHATSAPP', 'EMAIL'],
      required: true
    },
    dataEnvio: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['ENVIADO', 'ERRO', 'PENDENTE'],
      default: 'PENDENTE'
    },
    mensagem: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Cliente', clienteSchema); 