const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Notificações
 *   description: Endpoints para gerenciamento de notificações e cobranças via WhatsApp
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notificacao:
 *       type: object
 *       required:
 *         - clienteId
 *         - dividaId
 *       properties:
 *         clienteId:
 *           type: string
 *           description: ID do cliente
 *         dividaId:
 *           type: string
 *           description: ID da dívida
 *     RelatorioNotificacoes:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total de notificações
 *         sucessos:
 *           type: integer
 *           description: Notificações enviadas com sucesso
 *         falhas:
 *           type: integer
 *           description: Notificações com falha
 *         valorTotal:
 *           type: number
 *           description: Valor total das cobranças
 */

/**
 * @swagger
 * /notificacoes/cobranca:
 *   post:
 *     summary: Enviar cobrança individual
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notificacao'
 *     responses:
 *       200:
 *         description: Cobrança adicionada à fila de processamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/notificacoes/cobranca', auth, notificacaoController.enviarCobranca);

/**
 * @swagger
 * /notificacoes/cobranca/lote:
 *   post:
 *     summary: Enviar cobranças em lote
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: diasAtraso
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Dias de atraso para filtrar dívidas
 *     responses:
 *       200:
 *         description: Cobranças em lote adicionadas à fila
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 resultados:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     processados:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 */
router.post('/notificacoes/cobranca/lote', auth, notificacaoController.enviarCobrancasLote);

/**
 * @swagger
 * /notificacoes/relatorio:
 *   post:
 *     summary: Enviar relatório gerencial
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numeroGerente
 *             properties:
 *               numeroGerente:
 *                 type: string
 *                 description: Número do telefone do gerente
 *     responses:
 *       200:
 *         description: Relatório enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 relatorio:
 *                   $ref: '#/components/schemas/RelatorioNotificacoes'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/notificacoes/relatorio', auth, notificacaoController.enviarRelatorioGerencial);

/**
 * @swagger
 * /notificacoes/status:
 *   get:
 *     summary: Verificar status do serviço WhatsApp
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status do serviço
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [CONECTADO, DESCONECTADO]
 *                 tentativasReconexao:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 */
router.get('/notificacoes/status', auth, notificacaoController.statusWhatsApp);

module.exports = router; 