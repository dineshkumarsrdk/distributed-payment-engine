/**
 * Context-aware logger for distributed tracing
 */
const logger = {
  info: (correlationId, message, meta = '') => {
    console.log(`[${new Date().toISOString()}] [INFO] [Corr-ID: ${correlationId || 'N/A'}] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (correlationId, message, meta = '') => {
    console.warn(`[${new Date().toISOString()}] [WARN] [Corr-ID: ${correlationId || 'N/A'}] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (correlationId, message, meta = '') => {
    console.error(`[${new Date().toISOString()}] [ERROR] [Corr-ID: ${correlationId || 'N/A'}] ${message}`, meta ? JSON.stringify(meta) : '');
  }
};

module.exports = logger;