import pino from 'pino';

// Create a basic logger instance with direct console output
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    }
  }
});

// Create a simplified logger to avoid worker thread issues
const logger = {
  info: (obj: Record<string, unknown> | string, msg?: string) => {
    if (typeof obj === 'string') {
      pinoLogger.info(obj);
    } else {
      pinoLogger.info(obj, msg);
    }
  },
  warn: (obj: Record<string, unknown> | string, msg?: string) => {
    if (typeof obj === 'string') {
      pinoLogger.warn(obj);
    } else {
      pinoLogger.warn(obj, msg);
    }
  },
  error: (obj: Record<string, unknown> | string, msg?: string) => {
    if (typeof obj === 'string') {
      pinoLogger.error(obj);
    } else {
      pinoLogger.error(obj, msg);
    }
  },
  debug: (obj: Record<string, unknown> | string, msg?: string) => {
    if (typeof obj === 'string') {
      pinoLogger.debug(obj);
    } else {
      pinoLogger.debug(obj, msg);
    }
  },
  // Log startup information
  startup: (component: string, version: string) => {
    pinoLogger.info({ component, version }, `${component} v${version} starting up`);
  },
  // Log shutdown information
  shutdown: (component: string, reason?: string) => {
    pinoLogger.info({ component, reason }, `${component} shutting down${reason ? ': ' + reason : ''}`);
  },
  // Log connection attempts
  connection: (details: Record<string, unknown>, message: string) => {
    pinoLogger.info(details, message);
  },
  // Log performance metrics
  performance: (operation: string, durationMs: number, metadata?: Record<string, unknown>) => {
    pinoLogger.info(
      { operation, durationMs, ...metadata },
      `${operation} completed in ${durationMs}ms`
    );
  },
};

export default logger;
