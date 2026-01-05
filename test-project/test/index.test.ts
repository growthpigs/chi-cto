import {
  greet,
  add,
  multiply,
  createWorkerResult,
  WorkerResult
} from '../src/index';

describe('Greeting Utility', () => {
  it('should greet with provided name', () => {
    expect(greet('World')).toBe('Hello, World!');
  });

  it('should greet with different names', () => {
    expect(greet('Chi')).toBe('Hello, Chi!');
    expect(greet('CTO')).toBe('Hello, CTO!');
  });

  it('should handle empty strings', () => {
    expect(greet('')).toBe('Hello, !');
  });
});

describe('Math Operations', () => {
  describe('add function', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should add positive and negative numbers', () => {
      expect(add(10, -5)).toBe(5);
    });

    it('should handle zero', () => {
      expect(add(0, 5)).toBe(5);
      expect(add(5, 0)).toBe(5);
    });

    it('should add two negative numbers', () => {
      expect(add(-3, -2)).toBe(-5);
    });

    it('should handle floats', () => {
      expect(add(1.5, 2.5)).toBe(4);
    });
  });

  describe('multiply function', () => {
    it('should multiply two positive numbers', () => {
      expect(multiply(3, 4)).toBe(12);
    });

    it('should handle multiplication by zero', () => {
      expect(multiply(5, 0)).toBe(0);
      expect(multiply(0, 10)).toBe(0);
    });

    it('should multiply positive and negative', () => {
      expect(multiply(3, -4)).toBe(-12);
    });

    it('should multiply two negative numbers', () => {
      expect(multiply(-3, -4)).toBe(12);
    });

    it('should multiply floats', () => {
      expect(multiply(2.5, 4)).toBe(10);
    });
  });
});

describe('Worker Result Creation', () => {
  it('should create successful worker result', () => {
    const result = createWorkerResult('worker-123', 'success', 'Task completed');

    expect(result).toEqual({
      workerId: 'worker-123',
      status: 'success',
      message: 'Task completed'
    });
  });

  it('should create failed worker result', () => {
    const result = createWorkerResult('worker-456', 'failed', 'Task failed');

    expect(result.status).toBe('failed');
    expect(result.message).toBe('Task failed');
  });

  it('should preserve worker ID', () => {
    const workerId = 'worker-789-abc';
    const result = createWorkerResult(workerId, 'success', 'OK');

    expect(result.workerId).toBe(workerId);
  });

  it('should handle long messages', () => {
    const longMessage = 'A'.repeat(500);
    const result = createWorkerResult('worker-long', 'success', longMessage);

    expect(result.message).toBe(longMessage);
    expect(result.message.length).toBe(500);
  });
});

describe('WorkerResult Interface', () => {
  it('should satisfy the WorkerResult type', () => {
    const result: WorkerResult = {
      workerId: 'test-worker',
      status: 'success',
      message: 'Test message'
    };

    expect(result.workerId).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.message).toBeDefined();
  });
});
