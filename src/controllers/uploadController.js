const excelService = require('../services/excelService');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (excelService.validarTipoArquivo(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use apenas arquivos Excel (.xlsx, .xls)'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB padrão
  }
});

// Controller para upload de arquivo
const processarUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        erro: 'Nenhum arquivo foi enviado'
      });
    }

    const buffer = req.file.buffer;
    const resultado = await excelService.processarArquivo(buffer);
    const relatorio = excelService.gerarRelatorio(resultado);

    res.json({
      mensagem: 'Arquivo processado com sucesso',
      relatorio
    });
  } catch (erro) {
    res.status(500).json({
      erro: erro.message
    });
  }
};

module.exports = {
  upload: upload.single('arquivo'),
  processarUpload
}; 