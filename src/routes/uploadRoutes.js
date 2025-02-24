const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Endpoints para upload e processamento de planilhas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ResultadoUpload:
 *       type: object
 *       properties:
 *         mensagem:
 *           type: string
 *           description: Mensagem de sucesso
 *         relatorio:
 *           type: object
 *           properties:
 *             totalProcessado:
 *               type: integer
 *               description: Total de registros processados
 *             sucessos:
 *               type: object
 *               properties:
 *                 quantidade:
 *                   type: integer
 *                   description: Quantidade de registros processados com sucesso
 *                 detalhes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       linha:
 *                         type: object
 *                         description: Dados da linha processada
 *                       mensagem:
 *                         type: string
 *                         description: Mensagem de sucesso
 *             erros:
 *               type: object
 *               properties:
 *                 quantidade:
 *                   type: integer
 *                   description: Quantidade de registros com erro
 *                 detalhes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       linha:
 *                         type: object
 *                         description: Dados da linha com erro
 *                       erro:
 *                         type: string
 *                         description: Descrição do erro
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload de planilha Excel
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               arquivo:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo Excel (.xlsx, .xls)
 *     responses:
 *       200:
 *         description: Arquivo processado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResultadoUpload'
 *       400:
 *         description: Arquivo inválido ou não fornecido
 *       401:
 *         description: Não autorizado
 *       415:
 *         description: Tipo de arquivo não suportado
 */
router.post('/upload', auth, uploadController.upload, uploadController.processarUpload);

module.exports = router; 