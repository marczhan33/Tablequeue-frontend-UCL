interface LogContext {
  [key: string]: any;
}

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(context && { context }),
    };

    if (this.isDevelopment) {
      return JSON.stringify(logEntry, null, 2);
    }
    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatMessage("error", message, context));
  }

  // Specific logging methods for common scenarios
  apiRequest(method: string, url: string, statusCode: number, duration?: number) {
    this.info("API Request", {
      method,
      url,
      statusCode,
      ...(duration && { duration: `${duration}ms` }),
    });
  }

  authEvent(event: string, userId?: number, details?: LogContext) {
    this.info("Auth Event", {
      event,
      ...(userId && { userId }),
      ...details,
    });
  }

  businessEvent(event: string, details: LogContext) {
    this.info("Business Event", {
      event,
      ...details,
    });
  }

  dbQuery(query: string, duration?: number, error?: Error) {
    if (error) {
      this.error("Database Query Failed", {
        query,
        error: error.message,
        ...(duration && { duration: `${duration}ms` }),
      });
    } else {
      this.debug("Database Query", {
        query,
        ...(duration && { duration: `${duration}ms` }),
      });
    }
  }
}

export const logger = new Logger();