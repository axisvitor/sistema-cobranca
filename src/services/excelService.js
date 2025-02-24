const xlsx = require('xlsx');
const Cliente = require('../models/Cliente');

class ExcelService {
  constructor() {
    this.allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
  }

  // Validar tipo do arquivo
  validarTipoArquivo(mimetype) {
    return this.allowedMimeTypes.includes(mimetype);
  }

  // Processar arquivo Excel
  async processarArquivo(buffer) {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const dados = xlsx.utils.sheet_to_json(worksheet);

      const resultado = {
        sucessos: [],
        erros: []
      };

      for (const linha of dados) {
        try {
          // Validar dados obrigatórios
          if (!linha.nome || !linha.cpfCnpj || !linha.telefone) {
            resultado.erros.push({
              linha,
              erro: 'Dados obrigatórios ausentes'
            });
            continue;
          }

          // Verificar se cliente já existe
          const clienteExistente = await Cliente.findOne({ cpfCnpj: linha.cpfCnpj });

          if (clienteExistente) {
            // Atualizar dívidas do cliente existente
            if (linha.valor && linha.dataVencimento) {
              clienteExistente.dividas.push({
                valor: parseFloat(linha.valor),
                dataVencimento: new Date(linha.dataVencimento),
                descricao: linha.descricao || 'Importado via planilha'
              });
              await clienteExistente.save();
              resultado.sucessos.push({
                linha,
                mensagem: 'Dívida adicionada ao cliente existente'
              });
            }
          } else {
            // Criar novo cliente
            const novoCliente = new Cliente({
              nome: linha.nome,
              cpfCnpj: linha.cpfCnpj,
              telefone: linha.telefone,
              email: linha.email
            });

            if (linha.valor && linha.dataVencimento) {
              novoCliente.dividas.push({
                valor: parseFloat(linha.valor),
                dataVencimento: new Date(linha.dataVencimento),
                descricao: linha.descricao || 'Importado via planilha'
              });
            }

            await novoCliente.save();
            resultado.sucessos.push({
              linha,
              mensagem: 'Novo cliente criado com sucesso'
            });
          }
        } catch (erro) {
          resultado.erros.push({
            linha,
            erro: erro.message
          });
        }
      }

      return resultado;
    } catch (erro) {
      throw new Error(`Erro ao processar arquivo: ${erro.message}`);
    }
  }

  // Gerar relatório de importação
  gerarRelatorio(resultado) {
    return {
      totalProcessado: resultado.sucessos.length + resultado.erros.length,
      sucessos: {
        quantidade: resultado.sucessos.length,
        detalhes: resultado.sucessos
      },
      erros: {
        quantidade: resultado.erros.length,
        detalhes: resultado.erros
      }
    };
  }
}

module.exports = new ExcelService(); 