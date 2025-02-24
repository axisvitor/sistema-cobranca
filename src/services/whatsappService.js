const wppconnect = require('@wppconnect-team/wppconnect');
const logger = require('winston');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async inicializar() {
    try {
      logger.info('Iniciando serviço do WhatsApp...');
      
      this.client = await wppconnect.create({
        session: 'sistema-cobranca',
        catchQR: (base64Qr, asciiQR) => {
          logger.info('QR Code gerado. Por favor, escaneie para autenticar.');
        },
        statusFind: (statusSession, session) => {
          logger.info(`Status da sessão: ${statusSession}`);
        },
        folderNameToken: 'tokens',
        headless: true,
        logQR: true
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Serviço do WhatsApp iniciado com sucesso');

      // Configurar listeners de eventos
      this.client.onStateChange((state) => {
        logger.info(`Estado do WhatsApp alterado: ${state}`);
        if (state === 'DISCONNECTED') {
          this.isConnected = false;
          this.tentarReconectar();
        }
      });

      return true;
    } catch (erro) {
      logger.error(`Erro ao inicializar WhatsApp: ${erro.message}`);
      this.isConnected = false;
      throw erro;
    }
  }

  async tentarReconectar() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Número máximo de tentativas de reconexão atingido');
      return false;
    }

    try {
      this.reconnectAttempts++;
      logger.info(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      await this.inicializar();
      return true;
    } catch (erro) {
      logger.error(`Erro na tentativa de reconexão: ${erro.message}`);
      return false;
    }
  }

  async enviarMensagem(numero, mensagem) {
    try {
      if (!this.isConnected || !this.client) {
        throw new Error('Cliente WhatsApp não está conectado');
      }

      // Formatar número (remover caracteres especiais e adicionar código do país se necessário)
      const numeroFormatado = this.formatarNumero(numero);

      // Enviar mensagem
      const resultado = await this.client.sendText(`${numeroFormatado}@c.us`, mensagem);
      
      return {
        sucesso: true,
        mensagem: 'Mensagem enviada com sucesso',
        detalhes: resultado
      };
    } catch (erro) {
      logger.error(`Erro ao enviar mensagem WhatsApp: ${erro.message}`);
      return {
        sucesso: false,
        erro: erro.message
      };
    }
  }

  formatarNumero(numero) {
    // Remover caracteres não numéricos
    let numeroLimpo = numero.replace(/\D/g, '');
    
    // Adicionar código do país (Brasil) se não existir
    if (numeroLimpo.length <= 11) {
      numeroLimpo = '55' + numeroLimpo;
    }
    
    return numeroLimpo;
  }

  async enviarMensagemCobranca(cliente, divida) {
    const mensagem = this.gerarMensagemCobranca(cliente, divida);
    return await this.enviarMensagem(cliente.telefone, mensagem);
  }

  gerarMensagemCobranca(cliente, divida) {
    const dataFormatada = new Date(divida.dataVencimento).toLocaleDateString('pt-BR');
    const valorFormatado = divida.valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    return `Olá ${cliente.nome},\n\n` +
           `Gostaríamos de lembrá-lo(a) sobre um pagamento pendente:\n\n` +
           `Valor: ${valorFormatado}\n` +
           `Vencimento: ${dataFormatada}\n` +
           `Descrição: ${divida.descricao || 'Não especificada'}\n\n` +
           `Por favor, entre em contato conosco para regularizar sua situação.\n\n` +
           `Esta é uma mensagem automática. Não responda por este canal.`;
  }

  async enviarRelatorioGerencial(numeroGerente, relatorio) {
    const mensagem = this.gerarMensagemRelatorio(relatorio);
    return await this.enviarMensagem(numeroGerente, mensagem);
  }

  gerarMensagemRelatorio(relatorio) {
    return `📊 Relatório Diário de Cobranças\n\n` +
           `Total de Cobranças: ${relatorio.total}\n` +
           `Enviadas com Sucesso: ${relatorio.sucessos}\n` +
           `Falhas no Envio: ${relatorio.falhas}\n\n` +
           `💰 Valor Total: ${relatorio.valorTotal.toLocaleString('pt-BR', {
             style: 'currency',
             currency: 'BRL'
           })}\n\n` +
           `Esta é uma mensagem automática do sistema.`;
  }
}

module.exports = new WhatsAppService(); 