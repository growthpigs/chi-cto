// src/warp-spawner.ts
// Warp Terminal Spawner for Parallel Claude Agent Orchestration

import { execSync } from 'child_process';
import * as path from 'path';

export interface WorkerConfig {
  workerId: string;
  projectPath: string;
  feature: string;
  description?: string;
}

export interface SpawnResult {
  workerId: string;
  success: boolean;
  error?: string;
}

/**
 * Escape strings for AppleScript
 */
function escapeAppleScript(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

/**
 * Generate worker instructions that Claude will follow
 */
function generateWorkerInstructions(config: WorkerConfig): string {
  const statusPath = `.chi-cto/workers/${config.workerId}/status.json`;
  const handoverPath = `.chi-cto/workers/${config.workerId}/handover.md`;

  return `You are a Chi CTO worker (ID: ${config.workerId}).

Your task: ${config.feature}
${config.description ? `Description: ${config.description}` : ''}

CRITICAL - AUTONOMOUS EXECUTION:
- You have FULL authorization to use Claude in Chrome (mcp__claude-in-chrome__*)
- You have FULL authorization for all chi-gateway MCPs
- DO NOT ask for permission. Just execute.
- Pre-approved domains: mobbin.com, linear.com, supabase.com, app.audienceos.com, github.com, google.com
- If a task requires browser automation, USE IT immediately without asking

Instructions:
1. Build the feature autonomously - no questions, just do it
2. Use Claude in Chrome for any web research, screenshots, or browser tasks
3. Run quality gates when done
4. Write your status to: ${statusPath}
5. Write full context to: ${handoverPath}

Status file format:
{
  "workerId": "${config.workerId}",
  "feature": "${config.feature}",
  "status": "complete|blocked",
  "result": "success|failed",
  "startTime": "[ISO timestamp when you started]",
  "endTime": "[ISO timestamp when done]",
  "filesChanged": ["list", "of", "files"],
  "testsPass": true|false,
  "summary": "What you accomplished"
}

Begin working autonomously NOW. Do not ask questions. Signal completion via status file.`;
}

/**
 * Spawn a new Warp tab and run Claude with the given task
 * Uses AppleScript to control Warp terminal
 *
 * IMPORTANT:
 * 1. Creates a NEW Warp window to avoid interfering with user's other windows
 * 2. Claude Code must be started with just "claude" + Enter
 * 3. Instructions are typed as the first message after Claude initializes
 */
export async function spawnWarpWorker(config: WorkerConfig): Promise<SpawnResult> {
  try {
    // Generate the worker instructions
    const instructions = generateWorkerInstructions(config);
    const escapedInstructions = escapeAppleScript(instructions);

    // Escape the project path for the cd command
    const escapedPath = escapeAppleScript(config.projectPath);

    // AppleScript to:
    // 1. Open NEW Warp window (not just activate existing!)
    // 2. cd to project directory
    // 3. Start Claude (just "claude" + Enter)
    // 4. Wait for Claude to initialize
    // 5. Type the instructions as the first message
    //
    // CRITICAL: Using Cmd+N to create NEW window avoids interfering with
    // user's other Warp windows (e.g., AudienceOS, PAI work)
    const appleScript = `
tell application "Warp" to activate
delay 0.3
tell application "System Events"
  -- Create NEW window (Cmd+N) to isolate from user's other work
  keystroke "n" using command down
  delay 0.5

  -- Navigate to project directory
  keystroke "cd ${escapedPath}"
  delay 0.1
  keystroke return
  delay 0.3

  -- Start Claude (IMPORTANT: just "claude" + Enter, no inline args)
  keystroke "claude"
  delay 0.1
  keystroke return

  -- Wait for Claude to initialize (may take a few seconds)
  delay 3.0

  -- Type the worker instructions as the first message
  keystroke "${escapedInstructions}"
  delay 0.1
  keystroke return
end tell
`;

    // Execute the AppleScript
    execSync(`osascript -e '${appleScript.replace(/'/g, "'\"'\"'")}'`, {
      stdio: 'pipe',
      timeout: 15000 // 15 second timeout for full sequence
    });

    return {
      workerId: config.workerId,
      success: true
    };
  } catch (error) {
    return {
      workerId: config.workerId,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Spawn multiple workers in parallel Warp tabs
 *
 * Architecture:
 * - Chi CTO (orchestrator) is ALREADY running in Tab 1
 * - Each worker gets a NEW TAB (Cmd+T) in the SAME window
 * - Never creates new windows - all tabs stay together
 */
export async function spawnWorkers(
  projectPath: string,
  features: Array<{ name: string; description?: string }>
): Promise<SpawnResult[]> {
  const results: SpawnResult[] = [];

  for (const feature of features) {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const result = await spawnWarpWorkerInTab({
      workerId,
      projectPath,
      feature: feature.name,
      description: feature.description
    });

    results.push(result);

    // Delay between spawns to let Warp settle
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Verify Warp is ready for worker spawning
 *
 * NOTE: osascript counts each TAB as a "window", not actual windows.
 * We only verify Warp is running. The actual frontmost check happens
 * right before keystroke delivery in spawnWarpWorkerInTab().
 *
 * User must close other Warp windows manually to avoid keystroke interference.
 */
export async function verifyWarpReady(): Promise<{ ready: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Is Warp running? (process name is "stable")
    const warpRunning = execSync(`osascript -e 'tell application "System Events" to (name of processes) contains "stable"'`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    }).trim();

    if (warpRunning !== 'true') {
      errors.push('Warp is not running. Start Warp first.');
      return { ready: false, errors };
    }

    return { ready: true, errors: [] };

  } catch (error) {
    errors.push(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
    return { ready: false, errors };
  }
}

/**
 * Helper: Sleep for ms milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Spawn a worker in a new Warp tab (Cmd+T)
 *
 * VERIFIED STEP-BY-STEP implementation:
 * 1. Verify Warp is focused before any keystrokes
 * 2. Split keystrokes into separate execSync calls for reliability
 * 3. Increased Claude wait to 5 seconds
 *
 * Chi CTO is already running in this window as Tab 1.
 * Workers are spawned as additional tabs in the SAME window.
 */
async function spawnWarpWorkerInTab(config: WorkerConfig): Promise<SpawnResult> {
  try {
    const instructions = generateWorkerInstructions(config);
    const escapedInstructions = escapeAppleScript(instructions);
    const escapedPath = escapeAppleScript(config.projectPath);

    // Step 1: Verify Warp still frontmost
    const frontmost = execSync(`osascript -e 'tell application "System Events" to name of first application process whose frontmost is true'`, {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 2000
    }).trim();

    if (frontmost !== 'stable') {
      return {
        workerId: config.workerId,
        success: false,
        error: `Warp lost focus (frontmost: ${frontmost})`
      };
    }

    // Step 2: Open new tab (Cmd+T)
    execSync(`osascript -e 'tell application "System Events" to keystroke "t" using command down'`, {
      stdio: 'pipe',
      timeout: 2000
    });
    await sleep(500);

    // Step 3: cd to project
    execSync(`osascript -e 'tell application "System Events" to keystroke "cd ${escapedPath}"'`, { stdio: 'pipe', timeout: 2000 });
    await sleep(100);
    execSync(`osascript -e 'tell application "System Events" to keystroke return'`, { stdio: 'pipe', timeout: 2000 });
    await sleep(300);

    // Step 4: Start Claude
    execSync(`osascript -e 'tell application "System Events" to keystroke "claude"'`, { stdio: 'pipe', timeout: 2000 });
    await sleep(100);
    execSync(`osascript -e 'tell application "System Events" to keystroke return'`, { stdio: 'pipe', timeout: 2000 });

    // Step 5: Wait for Claude to initialize (increased to 5 seconds for reliability)
    console.log(`   [${config.workerId}] Waiting for Claude...`);
    await sleep(5000);

    // Step 6: Send instructions
    execSync(`osascript -e 'tell application "System Events" to keystroke "${escapedInstructions}"'`, { stdio: 'pipe', timeout: 10000 });

    // CRITICAL: Wait for typing to complete before pressing Enter
    // AppleScript keystroke types one character at a time, so long instructions
    // take time. 100ms was NOT enough - Enter was sent before typing finished.
    // 2 seconds gives plenty of buffer for ~500 char instructions.
    await sleep(2000);

    execSync(`osascript -e 'tell application "System Events" to keystroke return'`, { stdio: 'pipe', timeout: 2000 });

    console.log(`   [${config.workerId}] Instructions sent + submitted`);

    return { workerId: config.workerId, success: true };
  } catch (error) {
    return {
      workerId: config.workerId,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check if Warp is available on this system
 */
export function isWarpAvailable(): boolean {
  try {
    // Check if Warp app exists
    execSync('ls /Applications/Warp.app', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if we're on macOS (required for osascript)
 */
export function isMacOS(): boolean {
  return process.platform === 'darwin';
}

/**
 * Validate environment for Warp spawning
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isMacOS()) {
    errors.push('Warp spawning requires macOS (osascript)');
  }

  if (!isWarpAvailable()) {
    errors.push('Warp terminal not found at /Applications/Warp.app');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
