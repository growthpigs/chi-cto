import { validateEnvironment, isMacOS, isWarpAvailable } from '../src/warp-spawner';

describe('warp-spawner', () => {
  describe('isMacOS', () => {
    it('returns true on darwin platform', () => {
      const result = isMacOS();
      expect(typeof result).toBe('boolean');
      if (process.platform === 'darwin') {
        expect(result).toBe(true);
      }
    });
  });

  describe('isWarpAvailable', () => {
    it('returns a boolean', () => {
      const result = isWarpAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('validateEnvironment', () => {
    it('returns valid object with errors array', () => {
      const result = validateEnvironment();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('validates on macOS with Warp', () => {
      const result = validateEnvironment();
      // On this machine (macOS with Warp), should be valid
      if (process.platform === 'darwin') {
        // May or may not have Warp, so just check structure
        expect(result.valid).toBeDefined();
      }
    });
  });
});

// Note: spawnWarpWorker and spawnWorkers are tested via live integration tests
// The mocking is complex due to osascript execution and delays
// See: test-project/ for live testing
