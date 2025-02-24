const notificacaoService = require('../services/notificacaoService');
const whatsappService = require('../services/whatsappService');
const Cliente = require('../models/Cliente');
const yup = require('yup');

// Schema de validação para envio de cobrança
const cobrancaSchema = yup.object().shape({
  clienteId: yup.string().required('ID do cliente é obrigatório'),
  dividaId: yup.string().required('ID da dívida é obrigatório')
});

// Schema de validação para relatório gerencial
const relatorioSchema = yup.object().shape({
  numeroGerente: yup.string().required('Número do gerente é obrigatório')
});

// Enviar cobrança individual
const enviarCobranca = async (req, res) => {
  try {
    await cobrancaSchema.validate(req.body);
    
    const { clienteId, dividaId } = req.body;
    
    // Adicionar à fila de processamento
    await notificacaoService.adicionarCobrancaFila(clienteId, dividaId);
    
    res.json({
      mensagem: 'Cobrança adicionada à fila de processamento'
    });
  } catch (erro) {
    if (erro.name === 'ValidationError') {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(500).json({ erro: 'Erro ao enviar cobrança' });
  }
};

// Enviar cobranças em lote
const enviarCobrancasLote = async (req, res) => {
  try {
    const { diasAtraso = 0 } = req.query;
    
    // Calcular data limite
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - parseInt(diasAtraso));
    
    // Buscar clientes com dívidas vencidas
    const clientes = await Cliente.find({
      'dividas.dataVencimento': { $lte: dataLimite },
      'dividas.status': 'PENDENTE'
    });

    const resultados = {
      total: 0,
      processados: 0
    };

    // Adicionar cada cobrança à fila
    for (const cliente of clientes) {
      const dividasVencidas = cliente.dividas.filter(divida => 
        divida.status === 'PENDENTE' && 
        divida.dataVencimento <= dataLimite
      );

      for (const divida of dividasVencidas) {
        await notificacaoService.adicionarCobrancaFila(
          cliente._id.toString(),
          divida._id.toString()
        );
        resultados.processados++;
      }

      resultados.total += dividasVencidas.length;
    }

    res.json({
      mensagem: 'Cobranças em lote adicionadas à fila',
      resultados
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao processar cobranças em lote' });
  }
};

// Gerar e enviar relatório gerencial
const enviarRelatorioGerencial = async (req, res) => {
  try {
    await relatorioSchema.validate(req.body);
    
    const { numeroGerente } = req.body;
    const relatorio = await notificacaoService.enviarRelatorioGerencial(numeroGerente);
    
    res.json({
      mensagem: 'Relatório gerencial enviado com sucesso',
      relatorio
    });
  } catch (erro) {
    if (erro.name === 'ValidationError') {
      return res.status(400).json({ erro: erro.message });
    }
    res.status(500).json({ erro: 'Erro ao enviar relatório gerencial' });
  }
};

// Verificar status do serviço WhatsApp
const statusWhatsApp = async (req, res) => {
  try {
    const conectado = whatsappService.isConnected;
    res.json({
      status: conectado ? 'CONECTADO' : 'DESCONECTADO',
      tentativasReconexao: whatsappService.reconnectAttempts
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao verificar status do WhatsApp' });
  }
};

module.exports = {
  enviarCobranca,
  enviarCobrancasLote,
  enviarRelatorioGerencial,
  statusWhatsApp
}; 