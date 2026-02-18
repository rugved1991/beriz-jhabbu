/**
 * Security Logger
 * Logs security-related events for monitoring and auditing
 */

export interface SecurityLogEntry {
  timestamp: Date;
  event: string;
  roomId?: string;
  playerId?: string;
  socketId?: string;
  details?: string;
  severity: 'info' | 'warning' | 'error';
}

class SecurityLogger {
  private logs: SecurityLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  /**
   * Logs a security event
   */
  log(entry: Omit<SecurityLogEntry, 'timestamp'>): void {
    const logEntry: SecurityLogEntry = {
      ...entry,
      timestamp: new Date()
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    
    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console log for monitoring
    const logMessage = `[SECURITY ${entry.severity.toUpperCase()}] ${entry.event}${
      entry.roomId ? ` | Room: ${entry.roomId}` : ''
    }${entry.playerId ? ` | Player: ${entry.playerId}` : ''}${
      entry.socketId ? ` | Socket: ${entry.socketId}` : ''
    }${entry.details ? ` | ${entry.details}` : ''}`;

    if (entry.severity === 'error') {
      console.error(logMessage);
    } else if (entry.severity === 'warning') {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * Gets recent security logs
   */
  getRecentLogs(count: number = 100): SecurityLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Gets logs for a specific room
   */
  getLogsForRoom(roomId: string): SecurityLogEntry[] {
    return this.logs.filter(log => log.roomId === roomId);
  }

  /**
   * Gets logs for a specific player
   */
  getLogsForPlayer(playerId: string): SecurityLogEntry[] {
    return this.logs.filter(log => log.playerId === playerId);
  }
}

export const securityLogger = new SecurityLogger();
