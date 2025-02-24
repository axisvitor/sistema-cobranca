const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const yup = require('yup');

// Schema de validação para registro
const registroSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  senha: yup.string().min(6, 'Senha deve ter no mínimo 6 caracteres').required('Senha é obrigatória'),
  telefone: yup.string().required('Telefone é obrigatório'),
  cargo: yup.string().oneOf(['ADMIN', 'OPERADOR'], 'Cargo inválido')
});

// Schema de validação para login
const loginSchema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  senha: yup.string().required('Senha é obrigatória')
});

// Gerar token JWT
const gerarToken = (usuario) => {
  return jwt.sign(
    { 
      id: usuario._id,
      email: usuario.email,
      cargo: usuario.cargo
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );
};

// Registrar novo usuário
const registrar = async (req, res) => {
  try {
    // Validar dados de entrada
    await registroSchema.validate(req.body);
    
    // Verificar se email já existe
    const usuarioExistente = await Usuario.findOne({ email: req.body.email });
    if (usuarioExistente) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    
    // Criar novo usuário
    const usuario = new Usuario(req.body);
    await usuario.save();
    
    // Gerar token
    const token = gerarToken(usuario);
    
    res.status(201).json({
      mensagem: 'Usuário registrado com sucesso',
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        telefone: usuario.telefone
      },
      token
    });
  } catch (erro) {
    if (erro.name === 'ValidationError') {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(500).json({ erro: 'Erro ao registrar usuário' });
  }
};

// Login
const login = async (req, res) => {
  try {
    // Validar dados de entrada
    await loginSchema.validate(req.body);
    
    // Buscar usuário
    const usuario = await Usuario.findOne({ email: req.body.email });
    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }
    
    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      return res.status(401).json({ erro: 'Usuário desativado' });
    }
    
    // Verificar senha
    const senhaCorreta = await usuario.verificarSenha(req.body.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }
    
    // Gerar token
    const token = gerarToken(usuario);
    
    res.json({
      mensagem: 'Login realizado com sucesso',
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        telefone: usuario.telefone
      },
      token
    });
  } catch (erro) {
    if (erro.name === 'ValidationError') {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(500).json({ erro: 'Erro ao realizar login' });
  }
};

// Obter perfil do usuário
const perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-senha');
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    res.json(usuario);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar perfil' });
  }
};

// Atualizar perfil
const atualizarPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Atualizar campos permitidos
    const camposPermitidos = ['nome', 'telefone'];
    for (let campo of camposPermitidos) {
      if (req.body[campo]) {
        usuario[campo] = req.body[campo];
      }
    }

    // Se houver nova senha
    if (req.body.senha) {
      usuario.senha = req.body.senha;
    }

    await usuario.save();
    
    res.json({
      mensagem: 'Perfil atualizado com sucesso',
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        telefone: usuario.telefone
      }
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar perfil' });
  }
};

module.exports = {
  registrar,
  login,
  perfil,
  atualizarPerfil
}; 