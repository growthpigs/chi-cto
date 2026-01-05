// tests/error-recovery.test.ts

import { ErrorRecoveryHandler } from '../src/error-recovery';

describe('Error Recovery', () => {
  const handler = new ErrorRecoveryHandler();

  describe('Error Classification', () => {
    test('classifies TOKEN_LIMIT errors', () => {
      expect(handler.classifyError('token budget exceeded')).toBe('TOKEN_LIMIT');
    });

    test('classifies CORRUPTED_FILE errors', () => {
      expect(handler.classifyError('Error: EACCES: permission denied')).toBe('CORRUPTED_FILE');
    });

    test('classifies GIT_CONFLICT errors', () => {
      expect(handler.classifyError('CONFLICT in file.ts')).toBe('GIT_CONFLICT');
    });

    test('classifies STALE_MEMORY errors', () => {
      expect(handler.classifyError('mem0 stale data detected')).toBe('STALE_MEMORY');
    });

    test('classifies RATE_LIMIT errors', () => {
      expect(handler.classifyError('HTTP 429: Too many requests')).toBe('RATE_LIMIT');
    });

    test('classifies MISSING_INFRASTRUCTURE errors', () => {
      expect(handler.classifyError('npm not found')).toBe('MISSING_INFRASTRUCTURE');
    });

    test('classifies TOOL_INFRASTRUCTURE errors', () => {
      expect(handler.classifyError('eslint not found')).toBe('TOOL_INFRASTRUCTURE');
    });
  });

  describe('Class 1: Token Limit', () => {
    test('detects token at 70% (boundary)', async () => {
      const result = await handler.handleTokenLimit(140000, 200000);
      expect(result.detected).toBe(true);
      expect(result.action).toBe('ask');
      expect(result.recovered).toBe(true);
    });

    test('does not trigger below 70%', async () => {
      const result = await handler.handleTokenLimit(130000, 200000);
      expect(result.detected).toBe(false);
    });

    test('handles division-by-zero: tokensBudget=0', async () => {
      const result = await handler.handleTokenLimit(50, 0);
      expect(result.detected).toBe(false);
      expect(result.message).toContain('0%');
      expect(result.action).toBe('ask');
      expect(result.recovered).toBe(true);
    });
  });

  describe('Class 2: Corrupted File', () => {
    test('handles permission denied', async () => {
      const error = new Error('EACCES: permission denied');
      const result = await handler.handleCorruptedFile('/path/file.ts', error);
      expect(result.action).toBe('block');
      expect(result.recovered).toBe(false);
    });

    test('logs other file issues', async () => {
      const error = new Error('ENOENT: file not found');
      const result = await handler.handleCorruptedFile('/path/file.ts', error);
      expect(result.action).toBe('log');
    });
  });

  describe('Class 3: Git Conflict', () => {
    test('blocks on merge conflicts', async () => {
      const result = await handler.handleGitConflict(['src/index.ts', 'src/utils.ts']);
      expect(result.action).toBe('block');
      expect(result.recovered).toBe(false);
      expect(result.details?.length).toBeGreaterThan(0);
    });
  });

  describe('Class 4: Stale Memory', () => {
    test('logs stale memory, trusts session', async () => {
      const result = await handler.handleStaleMemory('Old priority score');
      expect(result.action).toBe('log');
      expect(result.recovered).toBe(true);
    });
  });

  describe('Class 5: Rate Limit', () => {
    test('handles rate limit with backoff', async () => {
      const result = await handler.handleRateLimit('npm install', 1);
      expect(result.action).toBe('log');
      expect(result.recovered).toBe(true);
      expect(result.details?.some(d => d.includes('Backing off'))).toBe(true);
    });

    test('fails after 3 retries', async () => {
      const result = await handler.handleRateLimit('npm install', 3);
      expect(result.recovered).toBe(false);
    });
  });

  describe('Class 6: Missing Infrastructure', () => {
    test('blocks on missing git', async () => {
      const result = await handler.handleMissingInfrastructure('git');
      expect(result.action).toBe('block');
      expect(result.recovered).toBe(false);
    });
  });

  describe('Class 7: Tool Infrastructure', () => {
    test('blocks on critical tool missing (eslint)', async () => {
      const result = await handler.handleToolInfrastructure('eslint', true);
      expect(result.action).toBe('block');
    });

    test('logs optional tool missing (coverage)', async () => {
      const result = await handler.handleToolInfrastructure('coverage', false);
      expect(result.action).toBe('log');
      expect(result.recovered).toBe(true);
    });
  });
});
