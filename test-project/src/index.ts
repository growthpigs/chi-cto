/**
 * Test project utilities for Chi CTO Warp validation
 */

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export interface WorkerResult {
  workerId: string;
  status: 'success' | 'failed';
  message: string;
}

export function createWorkerResult(
  workerId: string,
  status: 'success' | 'failed',
  message: string
): WorkerResult {
  return { workerId, status, message };
}
