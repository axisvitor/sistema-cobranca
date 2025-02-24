require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('winston');

// Configurar diretório de backup
const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Função para gerar nome do arquivo de backup
const getBackupFileName = () => {
  const date = new Date();
  return `backup-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.gz`;
};

// Função para remover backups antigos (manter apenas os últimos 7 dias)
const limparBackupsAntigos = () => {
  const files = fs.readdirSync(BACKUP_DIR);
  const backupFiles = files.filter(f => f.startsWith('backup-')).sort();
  
  while (backupFiles.length > 7) {
    const oldestFile = backupFiles.shift();
    fs.unlinkSync(path.join(BACKUP_DIR, oldestFile));
    logger.info(`Backup antigo removido: ${oldestFile}`);
  }
};

// Função principal de backup
const realizarBackup = () => {
  const dbName = process.env.MONGODB_URI.split('/').pop();
  const backupFile = path.join(BACKUP_DIR, getBackupFileName());
  
  const cmd = `mongodump --uri="${process.env.MONGODB_URI}" --archive="${backupFile}" --gzip`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Erro ao realizar backup: ${error.message}`);
      return;
    }
    
    logger.info(`Backup realizado com sucesso: ${backupFile}`);
    limparBackupsAntigos();
  });
};

// Executar backup
realizarBackup(); 