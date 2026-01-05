// src/worker-monitor.ts
// Worker Status Monitoring and Result Consolidation

import * as fs from 'fs';
import * as path from 'path';

export interface WorkerStatus {
  workerId: string;
  feature: string;
  status: 'in_progress' | 'complete' | 'blocked';
  result?: 'success' | 'failed';
  startTime?: string;
  endTime?: string;
  filesChanged?: string[];
  testsPass?: boolean;
  summary?: string;
}

export interface WorkerTracker {
  workerId: string;
  feature: string;
  status: 'pending' | 'in_progress' | 'complete' | 'blocked';
  statusPath: string;
  handoverPath: string;
  lastChecked?: Date;
  result?: WorkerStatus;
}

export interface ConsolidatedResult {
  totalWorkers: number;
  completed: number;
  blocked: number;
  inProgress: number;
  allFilesChanged: string[];
  allTestsPass: boolean;
  summaries: string[];
  workers: WorkerStatus[];
}

/**
 * Initialize the workers directory structure
 */
export function initWorkersDirectory(projectPath: string): string {
  const workersDir = path.join(projectPath, '.chi-cto', 'workers');

  if (!fs.existsSync(workersDir)) {
    fs.mkdirSync(workersDir, { recursive: true });
  }

  return workersDir;
}

/**
 * Create a worker directory and return paths
 */
export function createWorkerDirectory(
  projectPath: string,
  workerId: string
): { statusPath: string; handoverPath: string } {
  const workerDir = path.join(projectPath, '.chi-cto', 'workers', workerId);

  if (!fs.existsSync(workerDir)) {
    fs.mkdirSync(workerDir, { recursive: true });
  }

  return {
    statusPath: path.join(workerDir, 'status.json'),
    handoverPath: path.join(workerDir, 'handover.md')
  };
}

/**
 * Read a worker's status from their status.json file
 */
export function readWorkerStatus(statusPath: string): WorkerStatus | null {
  try {
    if (!fs.existsSync(statusPath)) {
      return null;
    }

    const content = fs.readFileSync(statusPath, 'utf-8');
    return JSON.parse(content) as WorkerStatus;
  } catch {
    return null;
  }
}

/**
 * Read a worker's handover/SITREP
 */
export function readWorkerHandover(handoverPath: string): string | null {
  try {
    if (!fs.existsSync(handoverPath)) {
      return null;
    }

    return fs.readFileSync(handoverPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Create worker trackers for a batch of workers
 */
export function createWorkerTrackers(
  projectPath: string,
  workers: Array<{ workerId: string; feature: string }>
): WorkerTracker[] {
  return workers.map(w => {
    const paths = createWorkerDirectory(projectPath, w.workerId);
    return {
      workerId: w.workerId,
      feature: w.feature,
      status: 'pending' as const,
      statusPath: paths.statusPath,
      handoverPath: paths.handoverPath
    };
  });
}

/**
 * Poll all workers and update their status
 */
export function pollWorkers(trackers: WorkerTracker[]): WorkerTracker[] {
  return trackers.map(tracker => {
    const status = readWorkerStatus(tracker.statusPath);

    if (status) {
      return {
        ...tracker,
        status: status.status === 'complete' ? 'complete' :
                status.status === 'blocked' ? 'blocked' : 'in_progress',
        result: status,
        lastChecked: new Date()
      };
    }

    // No status file yet - worker still initializing or in progress
    return {
      ...tracker,
      status: tracker.status === 'pending' ? 'in_progress' : tracker.status,
      lastChecked: new Date()
    };
  });
}

/**
 * Check if all workers have completed (success or blocked)
 */
export function allWorkersComplete(trackers: WorkerTracker[]): boolean {
  return trackers.every(t => t.status === 'complete' || t.status === 'blocked');
}

/**
 * Monitor workers with polling until all complete
 */
export async function monitorWorkers(
  trackers: WorkerTracker[],
  pollIntervalMs: number = 30000,
  onProgress?: (trackers: WorkerTracker[]) => void
): Promise<WorkerTracker[]> {
  let current = [...trackers];

  while (!allWorkersComplete(current)) {
    // Poll all workers
    current = pollWorkers(current);

    // Report progress if callback provided
    if (onProgress) {
      onProgress(current);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  // Final poll to ensure latest status
  current = pollWorkers(current);

  return current;
}

/**
 * Consolidate results from all completed workers
 */
export function consolidateResults(trackers: WorkerTracker[]): ConsolidatedResult {
  const workers = trackers
    .filter(t => t.result)
    .map(t => t.result!);

  const completed = workers.filter(w => w.status === 'complete' && w.result === 'success').length;
  const blocked = workers.filter(w => w.status === 'blocked' || w.result === 'failed').length;
  const inProgress = trackers.filter(t => t.status === 'in_progress').length;

  const allFilesChanged = workers
    .flatMap(w => w.filesChanged || [])
    .filter((v, i, a) => a.indexOf(v) === i); // Unique files

  const allTestsPass = workers.every(w => w.testsPass !== false);

  const summaries = workers
    .filter(w => w.summary)
    .map(w => `[${w.workerId}] ${w.feature}: ${w.summary}`);

  return {
    totalWorkers: trackers.length,
    completed,
    blocked,
    inProgress,
    allFilesChanged,
    allTestsPass,
    summaries,
    workers
  };
}

/**
 * Generate a consolidated SITREP from all workers
 */
export function generateConsolidatedSitrep(
  result: ConsolidatedResult,
  trackers: WorkerTracker[]
): string {
  const now = new Date().toISOString();

  let sitrep = `# Chi CTO Worker Consolidation Report

**Generated:** ${now}
**Total Workers:** ${result.totalWorkers}
**Completed:** ${result.completed}
**Blocked:** ${result.blocked}
**In Progress:** ${result.inProgress}

## Summary

${result.allTestsPass ? '✅ All tests passing' : '❌ Some tests failed'}

### Files Changed (${result.allFilesChanged.length})
${result.allFilesChanged.map(f => `- ${f}`).join('\n') || '(none)'}

## Worker Summaries

${result.summaries.map(s => `- ${s}`).join('\n') || '(no summaries available)'}

## Detailed Worker Status

`;

  for (const tracker of trackers) {
    sitrep += `### ${tracker.workerId}
- **Feature:** ${tracker.feature}
- **Status:** ${tracker.status}
`;

    if (tracker.result) {
      sitrep += `- **Result:** ${tracker.result.result || 'unknown'}
- **Tests Pass:** ${tracker.result.testsPass ?? 'unknown'}
- **Summary:** ${tracker.result.summary || '(none)'}
`;
    }

    // Include handover if available
    const handover = readWorkerHandover(tracker.handoverPath);
    if (handover) {
      sitrep += `
<details>
<summary>Full Handover</summary>

${handover}

</details>

`;
    }

    sitrep += '\n';
  }

  return sitrep;
}

/**
 * Clean up worker directories after consolidation
 */
export function cleanupWorkers(
  projectPath: string,
  trackers: WorkerTracker[],
  keepHandovers: boolean = true
): void {
  const workersDir = path.join(projectPath, '.chi-cto', 'workers');

  for (const tracker of trackers) {
    const workerDir = path.join(workersDir, tracker.workerId);

    if (fs.existsSync(workerDir)) {
      if (keepHandovers) {
        // Only remove status.json, keep handover.md
        const statusPath = path.join(workerDir, 'status.json');
        if (fs.existsSync(statusPath)) {
          fs.unlinkSync(statusPath);
        }
      } else {
        // Remove entire worker directory
        fs.rmSync(workerDir, { recursive: true, force: true });
      }
    }
  }
}
