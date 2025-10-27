/**
 * Simple logger utility with different log levels
 * In production, consider using a more robust solution like Winston or Pino
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    // Set log level based on environment
    this.level =
      process.env.NODE_ENV === 'production'
        ? LogLevel.INFO
        : process.env.NODE_ENV === 'test'
        ? LogLevel.ERROR
        : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? '\n' + JSON.stringify(args, null, 2) : '';
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('DEBUG', message, ...args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('INFO', message, ...args));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, ...args));
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, ...args));
    }
  }

  /**
   * Log HTTP request information
   */
  http(method: string, url: string, statusCode: number, duration: number): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const message = `${method} ${url} ${statusCode} - ${duration}ms`;
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('HTTP', message));
    }
  }
}

export const logger = new Logger();
