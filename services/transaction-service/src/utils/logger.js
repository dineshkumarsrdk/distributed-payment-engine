const winston = require('winston');

const formatContext = winston.format((info) => {
  if (info.meta && info.meta.correlationId) {
    info.correlationId = info.meta.correlationId;
    delete info.meta.correlationId;
  }
  return info;
});

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    formatContext(),
    winston.format.json() // Outputs rigid JSON for Logstash/Fluentd parsing
  ),
  defaultMeta: { service: 'transaction-service' },
  transports: [new winston.transports.Console()]
});

module.exports = {
  info: (correlationId, message, meta = {}) => {
    winstonLogger.info(message, { meta: { correlationId, ...meta } });
  },
  warn: (correlationId, message, meta = {}) => {
    winstonLogger.warn(message, { meta: { correlationId, ...meta } });
  },
  error: (correlationId, message, error = {}) => {
    winstonLogger.error(message, { meta: { correlationId, error: error.message || error, stack: error.stack } });
  }
};

// const logger = {
//   info: (correlationId, message, meta = '') => {
//     console.log(`[${new Date().toISOString()}] [INFO] [Corr-ID: ${correlationId || 'N/A'}] ${message}`, meta ? JSON.stringify(meta) : '');
//   },
//   warn: (correlationId, message, meta = '') => {
//     console.warn(`[${new Date().toISOString()}] [WARN] [Corr-ID: ${correlationId || 'N/A'}] ${message}`, meta ? JSON.stringify(meta) : '');
//   },
//   error: (correlationId, message, meta = '') => {
//     console.error(`[${new Date().toISOString()}] [ERROR] [Corr-ID: ${correlationId || 'N/A'}] ${message}`, meta ? JSON.stringify(meta) : '');
//   }
// };

// module.exports = logger;