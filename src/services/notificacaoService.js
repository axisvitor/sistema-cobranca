const { createClient } = require('redis');
const logger = require('winston');
const whatsappService = require('./whatsappService');
const Cliente = require('../models/Cliente');

class NotificacaoService {
  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL
    });
    this.filaCobrancas = 'fila:cobrancas';
    this.intervaloProcesamento = 1000 * 60; // 1 minuto
    this.processandoFila = false;
  }

  async inicializar() {
    try {
      await this.redisClient.connect();
      logger.info('Serviço de notificações iniciado');
      
      // Iniciar processamento da fila
      this.iniciarProcessamentoFila();
      
      return true;
    } catch (erro) {
      logger.error(`Erro ao inicializar serviço de notificações: ${erro.message}`);
      throw erro;
    }
  }

  async adicionarCobrancaFila(clienteId, dividaId) {
    try {
      const dados = {
        clienteId,
        dividaId,
        timestamp: Date.now()
      };

      await this.redisClient.lPush(this.filaCobrancas, JSON.stringify(dados));
      logger.info(`Cobrança adicionada à fila: Cliente ${clienteId}, Dívida ${dividaId}`);
      
      return true;
    } catch (erro) {
      logger.error(`Erro ao adicionar cobrança à fila: ${erro.message}`);
      throw erro;
    }
  }

  iniciarProcessamentoFila() {
    setInterval(async () => {
      if (this.processandoFila) return;
      
      try {
        this.processandoFila = true;
        await this.processarFila();
      } catch (erro) {
        logger.error(`Erro no processamento da fila: ${erro.message}`);
      } finally {
        this.processandoFila = false;
      }
    }, this.intervaloProcesamento);
  }

  async processarFila() {
    const item = await this.redisClient.rPop(this.filaCobrancas);
    if (!item) return;

    try {
      const { clienteId, dividaId } = JSON.parse(item);
      
      // Buscar cliente e dívida
      const cliente = await Cliente.findById(clienteId);
      if (!cliente) {
        throw new Error(`Cliente não encontrado: ${clienteId}`);
      }

      const divida = cliente.dividas.id(dividaId);
      if (!divida) {
        throw new Error(`Dívida não encontrada: ${dividaId}`);
      }

      // Enviar notificação
      const resultado = await whatsappService.enviarMensagemCobranca(cliente, divida);

      // Registrar resultado da notificação
      const notificacao = {
        tipo: 'WHATSAPP',
        dataEnvio: new Date(),
        status: resultado.sucesso ? 'ENVIADO' : 'ERRO',
        mensagem: resultado.mensagem || resultado.erro
      };

      cliente.notificacoes.push(notificacao);
      await cliente.save();

      logger.info(`Notificação processada: Cliente ${clienteId}, Dívida ${dividaId}`);
    } catch (erro) {
      logger.error(`Erro ao processar notificação: ${erro.message}`);
      
      // Recolocar na fila em caso de erro (com limite de tentativas)
      const dados = JSON.parse(item);
      if (!dados.tentativas || dados.tentativas < 3) {
        dados.tentativas = (dados.tentativas || 0) + 1;
        await this.redisClient.lPush(this.filaCobrancas, JSON.stringify(dados));
      }
    }
  }

  async enviarRelatorioGerencial(numeroGerente) {
    try {
      // Buscar dados para o relatório
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const clientes = await Cliente.find({
        'notificacoes.dataEnvio': { $gte: hoje }
      });

      const relatorio = {
        total: 0,
        sucessos: 0,
        falhas: 0,
        valorTotal: 0
      };

      clientes.forEach(cliente => {
        cliente.notificacoes
          .filter(n => n.dataEnvio >= hoje)
          .forEach(notificacao => {
            relatorio.total++;
            if (notificacao.status === 'ENVIADO') {
              relatorio.sucessos++;
            } else {
              relatorio.falhas++;
            }
          });

        cliente.dividas
          .filter(d => d.status === 'PENDENTE')
          .forEach(divida => {
            relatorio.valorTotal += divida.valor;
          });
      });

      // Enviar relatório via WhatsApp
      await whatsappService.enviarRelatorioGerencial(numeroGerente, relatorio);
      
      return relatorio;
    } catch (erro) {
      logger.error(`Erro ao enviar relatório gerencial: ${erro.message}`);
      throw erro;
    }
  }
}

module.exports = new NotificacaoService(); 