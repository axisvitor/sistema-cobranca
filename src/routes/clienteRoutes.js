const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Endpoints para gerenciamento de clientes e dívidas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Divida:
 *       type: object
 *       properties:
 *         valor:
 *           type: number
 *           description: Valor da dívida
 *         dataVencimento:
 *           type: string
 *           format: date
 *           description: Data de vencimento
 *         descricao:
 *           type: string
 *           description: Descrição da dívida
 *         status:
 *           type: string
 *           enum: [PENDENTE, PAGO, VENCIDO]
 *           default: PENDENTE
 *           description: Status da dívida
 *     Cliente:
 *       type: object
 *       required:
 *         - nome
 *         - telefone
 *         - cpfCnpj
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome do cliente
 *         telefone:
 *           type: string
 *           description: Telefone do cliente
 *         email:
 *           type: string
 *           format: email
 *           description: Email do cliente
 *         cpfCnpj:
 *           type: string
 *           description: CPF ou CNPJ do cliente
 *         dividas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Divida'
 */

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Criar novo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 cliente:
 *                   $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/clientes', auth, clienteController.criar);

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Listar todos os clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de itens por página
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cliente'
 *                 totalPaginas:
 *                   type: integer
 *                 paginaAtual:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 */
router.get('/clientes', auth, clienteController.listar);

/**
 * @swagger
 * /clientes/{id}:
 *   get:
 *     summary: Buscar cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Cliente não encontrado
 */
router.get('/clientes/:id', auth, clienteController.buscarPorId);

/**
 * @swagger
 * /clientes/{id}:
 *   put:
 *     summary: Atualizar cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 cliente:
 *                   $ref: '#/components/schemas/Cliente'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Cliente não encontrado
 */
router.put('/clientes/:id', auth, clienteController.atualizar);

/**
 * @swagger
 * /clientes/{id}:
 *   delete:
 *     summary: Excluir cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 cliente:
 *                   $ref: '#/components/schemas/Cliente'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Cliente não encontrado
 */
router.delete('/clientes/:id', auth, clienteController.excluir);

/**
 * @swagger
 * /clientes/{id}/dividas:
 *   post:
 *     summary: Adicionar dívida ao cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Divida'
 *     responses:
 *       200:
 *         description: Dívida adicionada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                 cliente:
 *                   $ref: '#/components/schemas/Cliente'
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Cliente não encontrado
 */
router.post('/clientes/:id/dividas', auth, clienteController.adicionarDivida);

module.exports = router; 