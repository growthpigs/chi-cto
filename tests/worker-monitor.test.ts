import * as fs from 'fs';
import * as path from 'path';
import {
  initWorkersDirectory,
  createWorkerDirectory,
  readWorkerStatus,
  readWorkerHandover,
  createWorkerTrackers,
  pollWorkers,
  allWorkersComplete,
  consolidateResults,
  generateConsolidatedSitrep,
  cleanupWorkers,
  WorkerStatus,
  WorkerTracker
} from '../src/worker-monitor';

describe('worker-monitor', () => {
  const testDir = '/tmp/chi-worker-monitor-test';

  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up after all tests
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('initWorkersDirectory', () => {
    it('creates the workers directory structure', () => {
      const result = initWorkersDirectory(testDir);

      expect(result).toBe(path.join(testDir, '.chi-cto', 'workers'));
      expect(fs.existsSync(result)).toBe(true);
    });

    it('is idempotent - can be called multiple times', () => {
      initWorkersDirectory(testDir);
      const result = initWorkersDirectory(testDir);

      expect(fs.existsSync(result)).toBe(true);
    });
  });

  describe('createWorkerDirectory', () => {
    it('creates a worker directory and returns paths', () => {
      initWorkersDirectory(testDir);

      const result = createWorkerDirectory(testDir, 'worker-123');

      expect(result.statusPath).toContain('worker-123');
      expect(result.statusPath).toContain('status.json');
      expect(result.handoverPath).toContain('worker-123');
      expect(result.handoverPath).toContain('handover.md');

      // Directory should exist
      expect(fs.existsSync(path.dirname(result.statusPath))).toBe(true);
    });
  });

  describe('readWorkerStatus', () => {
    it('reads valid JSON status file', () => {
      initWorkersDirectory(testDir);
      const paths = createWorkerDirectory(testDir, 'worker-valid');

      const status: WorkerStatus = {
        workerId: 'worker-valid',
        feature: 'Test Feature',
        status: 'complete',
        result: 'success',
        summary: 'All done'
      };

      fs.writeFileSync(paths.statusPath, JSON.stringify(status), 'utf-8');

      const result = readWorkerStatus(paths.statusPath);

      expect(result).toEqual(status);
    });

    it('returns null for malformed JSON', () => {
      initWorkersDirectory(testDir);
      const paths = createWorkerDirectory(testDir, 'worker-malformed');

      fs.writeFileSync(paths.statusPath, '{broken json', 'utf-8');

      const result = readWorkerStatus(paths.statusPath);

      expect(result).toBeNull();
    });

    it('returns null for empty file', () => {
      initWorkersDirectory(testDir);
      const paths = createWorkerDirectory(testDir, 'worker-empty');

      fs.writeFileSync(paths.statusPath, '', 'utf-8');

      const result = readWorkerStatus(paths.statusPath);

      expect(result).toBeNull();
    });

    it('returns null for non-existent file', () => {
      const result = readWorkerStatus('/nonexistent/path/status.json');

      expect(result).toBeNull();
    });
  });

  describe('readWorkerHandover', () => {
    it('reads handover file content', () => {
      initWorkersDirectory(testDir);
      const paths = createWorkerDirectory(testDir, 'worker-handover');

      const handoverContent = '# Handover\n\nThis is the handover content.';
      fs.writeFileSync(paths.handoverPath, handoverContent, 'utf-8');

      const result = readWorkerHandover(paths.handoverPath);

      expect(result).toBe(handoverContent);
    });

    it('returns null for non-existent file', () => {
      const result = readWorkerHandover('/nonexistent/path/handover.md');

      expect(result).toBeNull();
    });
  });

  describe('createWorkerTrackers', () => {
    it('creates trackers for multiple workers', () => {
      initWorkersDirectory(testDir);

      const workers = [
        { workerId: 'w1', feature: 'Feature 1' },
        { workerId: 'w2', feature: 'Feature 2' }
      ];

      const result = createWorkerTrackers(testDir, workers);

      expect(result).toHaveLength(2);
      expect(result[0].workerId).toBe('w1');
      expect(result[0].feature).toBe('Feature 1');
      expect(result[0].status).toBe('pending');
      expect(result[1].workerId).toBe('w2');
      expect(result[1].feature).toBe('Feature 2');
    });
  });

  describe('pollWorkers', () => {
    it('updates tracker status from status files', () => {
      initWorkersDirectory(testDir);

      // Create worker 1 with complete status
      const paths1 = createWorkerDirectory(testDir, 'poll-w1');
      fs.writeFileSync(paths1.statusPath, JSON.stringify({
        workerId: 'poll-w1',
        feature: 'Feature 1',
        status: 'complete',
        result: 'success'
      }), 'utf-8');

      // Create worker 2 with no status file (in progress)
      createWorkerDirectory(testDir, 'poll-w2');

      const trackers: WorkerTracker[] = [
        { workerId: 'poll-w1', feature: 'Feature 1', status: 'pending', statusPath: paths1.statusPath, handoverPath: paths1.handoverPath },
        { workerId: 'poll-w2', feature: 'Feature 2', status: 'pending', statusPath: path.join(testDir, '.chi-cto/workers/poll-w2/status.json'), handoverPath: '' }
      ];

      const result = pollWorkers(trackers);

      expect(result[0].status).toBe('complete');
      expect(result[0].result).toBeDefined();
      expect(result[1].status).toBe('in_progress'); // No status file = in_progress
    });

    it('handles blocked status', () => {
      initWorkersDirectory(testDir);
      const paths = createWorkerDirectory(testDir, 'poll-blocked');

      fs.writeFileSync(paths.statusPath, JSON.stringify({
        workerId: 'poll-blocked',
        feature: 'Blocked Feature',
        status: 'blocked',
        result: 'failed'
      }), 'utf-8');

      const trackers: WorkerTracker[] = [
        { workerId: 'poll-blocked', feature: 'Blocked Feature', status: 'pending', statusPath: paths.statusPath, handoverPath: paths.handoverPath }
      ];

      const result = pollWorkers(trackers);

      expect(result[0].status).toBe('blocked');
    });
  });

  describe('allWorkersComplete', () => {
    it('returns true when all workers are complete or blocked', () => {
      const trackers: WorkerTracker[] = [
        { workerId: 'w1', feature: 'F1', status: 'complete', statusPath: '', handoverPath: '' },
        { workerId: 'w2', feature: 'F2', status: 'blocked', statusPath: '', handoverPath: '' }
      ];

      expect(allWorkersComplete(trackers)).toBe(true);
    });

    it('returns false when some workers are in progress', () => {
      const trackers: WorkerTracker[] = [
        { workerId: 'w1', feature: 'F1', status: 'complete', statusPath: '', handoverPath: '' },
        { workerId: 'w2', feature: 'F2', status: 'in_progress', statusPath: '', handoverPath: '' }
      ];

      expect(allWorkersComplete(trackers)).toBe(false);
    });

    it('returns false when some workers are pending', () => {
      const trackers: WorkerTracker[] = [
        { workerId: 'w1', feature: 'F1', status: 'complete', statusPath: '', handoverPath: '' },
        { workerId: 'w2', feature: 'F2', status: 'pending', statusPath: '', handoverPath: '' }
      ];

      expect(allWorkersComplete(trackers)).toBe(false);
    });
  });

  describe('consolidateResults', () => {
    it('aggregates results from multiple workers', () => {
      const trackers: WorkerTracker[] = [
        {
          workerId: 'w1',
          feature: 'Feature 1',
          status: 'complete',
          statusPath: '',
          handoverPath: '',
          result: {
            workerId: 'w1',
            feature: 'Feature 1',
            status: 'complete',
            result: 'success',
            filesChanged: ['file1.ts', 'file2.ts'],
            testsPass: true,
            summary: 'Built feature 1'
          }
        },
        {
          workerId: 'w2',
          feature: 'Feature 2',
          status: 'blocked',
          statusPath: '',
          handoverPath: '',
          result: {
            workerId: 'w2',
            feature: 'Feature 2',
            status: 'blocked',
            result: 'failed',
            filesChanged: ['file3.ts'],
            testsPass: false,
            summary: 'Failed to build feature 2'
          }
        }
      ];

      const result = consolidateResults(trackers);

      expect(result.totalWorkers).toBe(2);
      expect(result.completed).toBe(1);
      expect(result.blocked).toBe(1);
      expect(result.allFilesChanged).toContain('file1.ts');
      expect(result.allFilesChanged).toContain('file2.ts');
      expect(result.allFilesChanged).toContain('file3.ts');
      expect(result.allTestsPass).toBe(false); // One failed
      expect(result.summaries).toHaveLength(2);
    });

    it('removes duplicate files', () => {
      const trackers: WorkerTracker[] = [
        {
          workerId: 'w1',
          feature: 'F1',
          status: 'complete',
          statusPath: '',
          handoverPath: '',
          result: {
            workerId: 'w1',
            feature: 'F1',
            status: 'complete',
            filesChanged: ['shared.ts', 'unique1.ts']
          }
        },
        {
          workerId: 'w2',
          feature: 'F2',
          status: 'complete',
          statusPath: '',
          handoverPath: '',
          result: {
            workerId: 'w2',
            feature: 'F2',
            status: 'complete',
            filesChanged: ['shared.ts', 'unique2.ts']
          }
        }
      ];

      const result = consolidateResults(trackers);

      // shared.ts should only appear once
      expect(result.allFilesChanged.filter(f => f === 'shared.ts')).toHaveLength(1);
      expect(result.allFilesChanged).toHaveLength(3);
    });
  });

  describe('generateConsolidatedSitrep', () => {
    it('generates markdown report', () => {
      const trackers: WorkerTracker[] = [
        {
          workerId: 'w1',
          feature: 'Feature 1',
          status: 'complete',
          statusPath: '',
          handoverPath: '',
          result: {
            workerId: 'w1',
            feature: 'Feature 1',
            status: 'complete',
            result: 'success',
            summary: 'Done'
          }
        }
      ];

      const consolidated = consolidateResults(trackers);
      const sitrep = generateConsolidatedSitrep(consolidated, trackers);

      expect(sitrep).toContain('Chi CTO Worker Consolidation Report');
      expect(sitrep).toContain('Total Workers:');
      expect(sitrep).toContain('Feature 1');
      expect(sitrep).toContain('w1');
    });
  });

  describe('cleanupWorkers', () => {
    it('removes status files but keeps handovers when keepHandovers is true', () => {
      initWorkersDirectory(testDir);
      const paths = createWorkerDirectory(testDir, 'cleanup-test');

      fs.writeFileSync(paths.statusPath, '{"status":"complete"}', 'utf-8');
      fs.writeFileSync(paths.handoverPath, '# Handover', 'utf-8');

      const trackers: WorkerTracker[] = [
        { workerId: 'cleanup-test', feature: 'F', status: 'complete', statusPath: paths.statusPath, handoverPath: paths.handoverPath }
      ];

      cleanupWorkers(testDir, trackers, true);

      expect(fs.existsSync(paths.statusPath)).toBe(false);
      expect(fs.existsSync(paths.handoverPath)).toBe(true);
    });

    it('removes entire worker directory when keepHandovers is false', () => {
      initWorkersDirectory(testDir);
      const paths = createWorkerDirectory(testDir, 'cleanup-all');

      fs.writeFileSync(paths.statusPath, '{"status":"complete"}', 'utf-8');
      fs.writeFileSync(paths.handoverPath, '# Handover', 'utf-8');

      const trackers: WorkerTracker[] = [
        { workerId: 'cleanup-all', feature: 'F', status: 'complete', statusPath: paths.statusPath, handoverPath: paths.handoverPath }
      ];

      cleanupWorkers(testDir, trackers, false);

      expect(fs.existsSync(path.dirname(paths.statusPath))).toBe(false);
    });
  });
});
