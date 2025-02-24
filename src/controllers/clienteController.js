const Cliente = require('../models/Cliente');
const yup = require('yup');

// Schema de validação
const clienteSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório'),
  telefone: yup.string().required('Telefone é obrigatório'),
  email: yup.string().email('Email inválido'),
  cpfCnpj: yup.string().required('CPF/CNPJ é obrigatório')
});

// Criar novo cliente
const criar = async (req, res) => {
  try {
    // Validar dados de entrada
    await clienteSchema.validate(req.body);
    
    const cliente = new Cliente(req.body);
    await cliente.save();
    
    res.status(201).json({
      mensagem: 'Cliente criado com sucesso',
      cliente
    });
  } catch (erro) {
    if (erro.name === 'ValidationError') {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(500).json({ erro: 'Erro ao criar cliente' });
  }
};

// Listar todos os clientes
const listar = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const clientes = await Cliente
      .find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Cliente.countDocuments();
    
    res.json({
      clientes,
      totalPaginas: Math.ceil(total / limit),
      paginaAtual: page
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar clientes' });
  }
};

// Buscar cliente por ID
const buscarPorId = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar cliente' });
  }
};

// Atualizar cliente
const atualizar = async (req, res) => {
  try {
    // Validar dados de entrada
    await clienteSchema.validate(req.body);
    
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    res.json({
      mensagem: 'Cliente atualizado com sucesso',
      cliente
    });
  } catch (erro) {
    if (erro.name === 'ValidationError') {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(500).json({ erro: 'Erro ao atualizar cliente' });
  }
};

// Excluir cliente
const excluir = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    res.json({
      mensagem: 'Cliente excluído com sucesso',
      cliente
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir cliente' });
  }
};

// Adicionar dívida ao cliente
const adicionarDivida = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    cliente.dividas.push(req.body);
    await cliente.save();

    res.json({
      mensagem: 'Dívida adicionada com sucesso',
      cliente
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao adicionar dívida' });
  }
};

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  excluir,
  adicionarDivida
}; 