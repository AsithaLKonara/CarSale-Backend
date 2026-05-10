export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class ObservabilityLogger {
  private formatLog(level: LogLevel, message: string, context?: Record<string, any>) {
    const logObject = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      environment: process.env.NODE_ENV || 'development',
      ...context,
    };
    
    // Output structured JSON strings directly to stdout/stderr
    if (level === 'error') {
      console.error(JSON.stringify(logObject));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logObject));
    } else {
      console.log(JSON.stringify(logObject));
    }
  }

  public info(message: string, context?: Record<string, any>) {
    this.formatLog('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>) {
    this.formatLog('warn', message, context);
  }

  public error(message: string, errorObj?: Error | any, context?: Record<string, any>) {
    const errorDetails = errorObj instanceof Error 
      ? { errorName: errorObj.name, errorMessage: errorObj.message, stack: errorObj.stack }
      : { rawError: errorObj };
    
    this.formatLog('error', message, { ...errorDetails, ...context });
  }

  public debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      this.formatLog('debug', message, context);
    }
  }

  /**
   * Performance Telemetry Profiler helper.
   * Usage: const end = logger.startTimer(); ... end('Request finished', { path: '/' });
   */
  public startTimer() {
    const start = process.hrtime();
    return (message: string, context?: Record<string, any>) => {
      const diff = process.hrtime(start);
      const durationMs = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert nanoseconds to milliseconds
      this.info(message, {
        ...context,
        durationMs: parseFloat(durationMs.toFixed(3)),
      });
    };
  }
}

export const logger = new ObservabilityLogger();
export default logger;
