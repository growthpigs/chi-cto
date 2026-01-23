# Fix Warp Parallel Worker Spawning

## Problem

The Warp spawner fails to create workers reliably because:
1. **No verification** - Sends keystrokes to "frontmost window" without confirming it's Warp
2. **No feedback** - Returns success even when spawn fails
3. **Timing issues** - Fixed 3-second delay insufficient for Claude initialization
4. **Workers never receive instructions** - Keystrokes sent to wrong window/app
5. **No status files created** - Workers can't write status because they never started

**Root cause:** osascript runs as separate process and can't identify which Warp window called it. With multiple windows open, it sends keystrokes randomly.

**User solution:** Close all Warp windows except one before spawning.

## Solution: Verified Multi-Step Spawning

Transform blind keystroke approach into verified process with confirmation at each stage.

### 1. Add Import for verifyWarpReady (cli-local.ts)

**File:** `src/cli-local.ts`, lines 19-23

Update import statement:

```typescript
import {
  spawnWorkers,
  validateEnvironment,
  verifyWarpReady,  // ADD THIS
  SpawnResult
} from './warp-spawner';
```

### 2. Pre-Flight Validation (cli-local.ts)

**File:** `src/cli-local.ts`, function `handleSpawn` (after line 151)

Add before spawning loop:

```typescript
// Verify exactly ONE Warp window is open and focused
const warpCheck = await verifyWarpReady();
if (!warpCheck.ready) {
  console.error('❌ Warp validation failed:');
  warpCheck.errors.forEach(e => console.error(`   - ${e}`));
  console.log('\n📋 Instructions:');
  console.log('   1. Close all Warp windows except ONE');
  console.log('   2. Make sure this Warp window is visible and focused');
  console.log('   3. Run chi-cto spawn again\n');
  process.exit(1);
}
console.log('✅ Warp validated (1 window, focused, ready)');
```

**Purpose:** Fail fast if environment isn't ready. Clear instructions on what to fix.

### 3. Add Warp Verification Function (warp-spawner.ts)

**File:** `src/warp-spawner.ts`, add before `spawnWarpWorkerInTab` (before line 178)

```typescript
/**
 * Verify Warp is ready for worker spawning
 */
export async function verifyWarpReady(): Promise<{ ready: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Check 1: Is Warp running?
    const warpRunning = execSync(`osascript -e 'tell application "System Events" to (name of processes) contains "stable"'`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    }).trim();

    if (warpRunning !== 'true') {
      errors.push('Warp is not running');
      return { ready: false, errors };
    }

    // Check 2: How many Warp windows?
    const windowCount = execSync(`osascript -e 'tell application "System Events" to tell process "stable" to count windows'`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    }).trim();

    if (windowCount !== '1') {
      errors.push(`Expected 1 Warp window, found ${windowCount}. Close all but one.`);
      return { ready: false, errors };
    }

    // Check 3: Is Warp frontmost?
    const frontmostApp = execSync(`osascript -e 'tell application "System Events" to name of first application process whose frontmost is true'`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    }).trim();

    if (frontmostApp !== 'stable') {
      errors.push(`Warp is not focused (frontmost: ${frontmostApp}). Click on Warp window.`);
      return { ready: false, errors };
    }

    return { ready: true, errors: [] };

  } catch (error) {
    errors.push(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
    return { ready: false, errors };
  }
}
```

**Purpose:** Three verification checks: Warp running, exactly 1 window, Warp is focused.

### 4. Replace Blind Spawning with Verified Steps (warp-spawner.ts)

**File:** `src/warp-spawner.ts`, function `spawnWarpWorkerInTab` (lines 178-227)

**⚠️ CRITICAL FIX:** Tab counting via AppleScript doesn't work (error -1700). Removed Steps 2-4. Verification now relies on post-spawn status file check only.

**Replace entire function** with verified step-by-step approach:

```typescript
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
    execSync(`osascript -e 'tell application "System Events" to keystroke "${escapedInstructions}"'`, { stdio: 'pipe', timeout: 5000 });
    await sleep(100);
    execSync(`osascript -e 'tell application "System Events" to keystroke return'`, { stdio: 'pipe', timeout: 2000 });

    console.log(`   [${config.workerId}] Instructions sent`);

    return { workerId: config.workerId, success: true };

  } catch (error) {
    return {
      workerId: config.workerId,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Key changes:**
- Verify Warp focused before starting
- ~~Count tabs~~ REMOVED (AppleScript limitation)
- Split each keystroke into separate execSync
- Increase Claude wait to 5 seconds (more reliable than 4)
- Add logging per worker
- Return detailed error on failure
- **Verification happens via status file check in Step 5 below**

### 5. Post-Spawn Verification (cli-local.ts)

**File:** `src/cli-local.ts`, function `handleSpawn` (after spawning loop, around line 216)

**⚠️ UPDATED:** Reduced wait time from 10s to 5s for faster feedback.

Add after results reporting:

```typescript
// Verify workers actually started
if (successful.length > 0) {
  console.log(`\n⏳ Waiting 5 seconds for workers to initialize...`);
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log(`\n🔍 Checking worker status files...`);
  let workersWithStatus = 0;

  for (const result of successful) {
    const statusPath = path.join(projectPath, '.chi-cto', 'workers', result.workerId, 'status.json');
    if (fs.existsSync(statusPath)) {
      workersWithStatus++;
      console.log(`   ✅ ${result.workerId} - status file exists`);
    } else {
      console.log(`   ⚠️  ${result.workerId} - no status file yet`);
    }
  }

  if (workersWithStatus === 0) {
    console.log(`\n⚠️  WARNING: No workers have written status files.`);
    console.log(`   Check Warp tabs to see if workers started correctly.\n`);
  }
}
```

**Purpose:** Immediate feedback if workers actually received instructions.

## Testing Plan

1. **Close all Warp windows except one**
2. **Focus that window**
3. **Create test project:**
   ```bash
   cd /Users/rodericandrews/_PAI/projects/chi-cto/test-project
   ```
4. **Run spawn:**
   ```bash
   npx ts-node src/cli-local.ts spawn /Users/rodericandrews/_PAI/projects/chi-cto/test-project --workers 1
   ```
5. **Observe:**
   - ✅ Warp validation passes
   - ✅ New tab opens in current window
   - ✅ Commands execute: `cd`, `claude`, instructions
   - ✅ Worker initialization message appears
   - ✅ Status file verification shows file created
6. **Check status:**
   ```bash
   npx ts-node src/cli-local.ts workers status /Users/rodericandrews/_PAI/projects/chi-cto/test-project
   ```

## Critical Files to Modify

1. **src/cli-local.ts** (lines 19-23) - Add `verifyWarpReady` to imports
2. **src/cli-local.ts** (after line 151) - Add pre-spawn validation check
3. **src/cli-local.ts** (after line 216) - Add post-spawn status verification
4. **src/warp-spawner.ts** (before line 178) - Add `verifyWarpReady` export function
5. **src/warp-spawner.ts** (lines 178-227) - Replace `spawnWarpWorkerInTab` with verified implementation

## Success Criteria

- ✅ Spawn fails fast if multiple Warp windows open
- ✅ Spawn fails if Warp not focused
- ✅ Tab count increases by 1 per worker
- ✅ Workers write status files within 10 seconds
- ✅ Clear error messages when spawn fails
