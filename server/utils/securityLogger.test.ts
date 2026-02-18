/**
 * Tests for Security Logger
 * Validates security event logging functionality
 */

import { securityLogger, SecurityLogEntry } from './securityLogger';

describe('Security Logger', () => {
  beforeEach(() => {
    // Clear logs before each test by creating a new instance
    // Since we're using a singleton, we'll just test with existing logs
  });

  describe('Basic Logging', () => {
    it('should log security events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      securityLogger.log({
        event: 'Test event',
        severity: 'info'
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY INFO] Test event')
      );
      
      consoleSpy.mockRestore();
    });

    it('should log with all fields', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      securityLogger.log({
        event: 'Player action',
        roomId: 'ROOM123',
        playerId: 'player1',
        socketId: 'socket-abc',
        details: 'Additional info',
        severity: 'info'
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Player action')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Room: ROOM123')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Player: player1')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Severity Levels', () => {
    it('should use console.log for info', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      securityLogger.log({
        event: 'Info event',
        severity: 'info'
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should use console.warn for warnings', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      securityLogger.log({
        event: 'Warning event',
        severity: 'warning'
      });
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY WARNING]')
      );
      warnSpy.mockRestore();
    });

    it('should use console.error for errors', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      securityLogger.log({
        event: 'Error event',
        severity: 'error'
      });
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY ERROR]')
      );
      errorSpy.mockRestore();
    });
  });

  describe('Log Retrieval', () => {
    it('should retrieve recent logs', () => {
      // Log some events
      securityLogger.log({ event: 'Event 1', severity: 'info' });
      securityLogger.log({ event: 'Event 2', severity: 'info' });
      securityLogger.log({ event: 'Event 3', severity: 'info' });
      
      const logs = securityLogger.getRecentLogs(10);
      
      expect(logs.length).toBeGreaterThanOrEqual(3);
      expect(logs.some(log => log.event === 'Event 1')).toBe(true);
      expect(logs.some(log => log.event === 'Event 2')).toBe(true);
      expect(logs.some(log => log.event === 'Event 3')).toBe(true);
    });

    it('should filter logs by room', () => {
      securityLogger.log({ event: 'Room A event', roomId: 'ROOMA', severity: 'info' });
      securityLogger.log({ event: 'Room B event', roomId: 'ROOMB', severity: 'info' });
      securityLogger.log({ event: 'Room A event 2', roomId: 'ROOMA', severity: 'info' });
      
      const roomALogs = securityLogger.getLogsForRoom('ROOMA');
      
      expect(roomALogs.every(log => log.roomId === 'ROOMA')).toBe(true);
      expect(roomALogs.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter logs by player', () => {
      securityLogger.log({ event: 'Player 1 action', playerId: 'player1', severity: 'info' });
      securityLogger.log({ event: 'Player 2 action', playerId: 'player2', severity: 'info' });
      securityLogger.log({ event: 'Player 1 action 2', playerId: 'player1', severity: 'info' });
      
      const player1Logs = securityLogger.getLogsForPlayer('player1');
      
      expect(player1Logs.every(log => log.playerId === 'player1')).toBe(true);
      expect(player1Logs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Log Entry Structure', () => {
    it('should add timestamp to log entries', () => {
      const beforeTime = new Date();
      
      securityLogger.log({
        event: 'Timestamped event',
        severity: 'info'
      });
      
      const logs = securityLogger.getRecentLogs(1);
      const lastLog = logs[logs.length - 1];
      
      expect(lastLog.timestamp).toBeInstanceOf(Date);
      expect(lastLog.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('should preserve all log entry fields', () => {
      const entry = {
        event: 'Complete event',
        roomId: 'ROOM123',
        playerId: 'player1',
        socketId: 'socket-abc',
        details: 'Test details',
        severity: 'warning' as const
      };
      
      securityLogger.log(entry);
      
      const logs = securityLogger.getRecentLogs(1);
      const lastLog = logs[logs.length - 1];
      
      expect(lastLog.event).toBe(entry.event);
      expect(lastLog.roomId).toBe(entry.roomId);
      expect(lastLog.playerId).toBe(entry.playerId);
      expect(lastLog.socketId).toBe(entry.socketId);
      expect(lastLog.details).toBe(entry.details);
      expect(lastLog.severity).toBe(entry.severity);
    });
  });
});
