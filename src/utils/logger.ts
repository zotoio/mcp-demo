import pino from 'pino';

// Create a logger instance with more detailed configuration
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l o',
      ignore: 'pid,hostname',
      messageFormat: '{msg} {context}',
      errorLikeObjectKeys: ['err', 'error'],
      levelFirst: true,
      // Remove customPrettifiers as functions can't be cloned for worker threads
    },
  },
  level: process.env.LOG_LEVEL || 'info',
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  base: undefined, // Remove base log data like pid and hostname
  timestamp: pino.stdTimeFunctions.isoTime, // Use built-in time function instead of custom one
  redact: {
    paths: ['req.headers.authorization', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
});

// Add helper methods for common logging patterns
const enhancedLogger = {
  ...logger,
  // Log startup information
  startup: (component: string, version: string) => {
    logger.info({ component, version }, `${component} v${version} starting up`);
  },
  // Log shutdown information
  shutdown: (component: string, reason?: string) => {
    logger.info({ component, reason }, `${component} shutting down${reason ? ': ' + reason : ''}`);
  },
  // Log connection attempts
  connection: (details: Record<string, unknown>, message: string) => {
    logger.info(details, message);
  },
  // Log performance metrics
  performance: (operation: string, durationMs: number, metadata?: Record<string, unknown>) => {
    logger.debug(
      { operation, durationMs, ...metadata },
      `${operation} completed in ${durationMs}ms`
    );
  },
};

export default enhancedLogger;
