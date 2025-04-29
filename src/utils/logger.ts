import pino from 'pino';

// Create a basic logger instance without transport to avoid worker thread issues
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  base: undefined, // Remove base log data like pid and hostname
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: true,
      ignore: 'pid,hostname',
    }
  }
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
    logger.info(
      { operation, durationMs, ...metadata },
      `${operation} completed in ${durationMs}ms`
    );
  },
};

export default enhancedLogger;
