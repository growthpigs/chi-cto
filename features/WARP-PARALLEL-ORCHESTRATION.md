# Feature: Warp-Based Parallel Orchestration

**Status:** Implemented
**Priority:** IMMEDIATE (Score: 39/40)
**Added:** 2026-01-05
**Implemented:** 2026-01-05

## Summary

Add capability for Chi CTO to spawn multiple Claude Code agents in parallel Warp terminal tabs, monitor their progress, and consolidate results.

## The Capability

Instead of running features sequentially in one process, Chi CTO can:

1. **Spawn** - Open N Warp tabs, each running `claude "Build feature X"`
2. **Monitor** - Poll status files to track worker progress
3. **Consolidate** - When workers complete, read their SITREPs and aggregate results
4. **Iterate** - Close finished tabs, spawn new ones for remaining work

## Technical Implementation

### Critical Constraints

**1. SINGLE WINDOW REQUIREMENT:**
osascript cannot reliably target a specific Warp window when multiple are open. The system REQUIRES exactly 1 Warp window before spawning workers. Close all other Warp windows first.

**2. CLAUDE INVOCATION:**
Claude Code must be started with just `claude` + Enter, then instructions typed as first message. Command-line args (`claude "..."`) do NOT work reliably.

**Verified via stress test:** AppleScript tab counting (error -1700) does not work. Verification relies on post-spawn status file checks.

### Spawning Workers (osascript)

```bash
# Open new Warp tab
osascript -e 'tell application "Warp" to activate'
osascript -e 'tell application "System Events" to keystroke "t" using command down'

# Navigate to project
osascript -e 'tell application "System Events" to keystroke "cd /path/to/project"'
osascript -e 'tell application "System Events" to keystroke return'

# Start Claude (JUST "claude" + Enter!)
osascript -e 'tell application "System Events" to keystroke "claude"'
osascript -e 'tell application "System Events" to keystroke return'

# Wait for Claude to initialize (~3 seconds)
# Then type instructions as first message
osascript -e 'tell application "System Events" to keystroke "Build Feature: Auth"'
osascript -e 'tell application "System Events" to keystroke return'
```

**Key discoveries:**
1. Warp's process name is "stable" for AppleScript targeting
2. Claude Code must be started interactively, then receive instructions as first message

### Worker Status Protocol

Each spawned Claude agent is instructed to write status on completion:

```
.chi-cto/workers/
├── worker-<id>/
│   ├── status.json      # {"status": "complete|in_progress|blocked", ...}
│   └── handover.md      # Full context of work done
```

### Status File Schema

```json
{
  "workerId": "worker-1736070000000",
  "feature": "Add user authentication",
  "status": "complete",
  "startTime": "2026-01-05T10:00:00Z",
  "endTime": "2026-01-05T10:15:00Z",
  "result": "success",
  "filesChanged": ["src/auth.ts", "src/auth.test.ts"],
  "testsPass": true,
  "summary": "Implemented JWT auth with password reset"
}
```

### Orchestrator Polling Loop

```typescript
async function monitorWorkers(workers: Worker[]): Promise<WorkerResult[]> {
  const results: WorkerResult[] = [];

  while (workers.some(w => w.status === 'in_progress')) {
    for (const worker of workers) {
      const statusPath = `.chi-cto/workers/${worker.id}/status.json`;
      if (fs.existsSync(statusPath)) {
        const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
        worker.status = status.status;
        if (status.status !== 'in_progress') {
          results.push(status);
        }
      }
    }
    await sleep(30000); // Poll every 30 seconds
  }

  return results;
}
```

## Integration Points

### With Existing Systems

- **Priority Scoring** - Determines which features to assign to workers
- **Quality Gates** - Each worker runs gates independently
- **Handover System** - Workers write handover.md for consolidation
- **Error Recovery** - Workers handle their own recovery

### New CLI Commands

```bash
# Spawn parallel workers for top N features
chi-cto spawn --workers 3

# Check status of all workers
chi-cto workers status

# Consolidate completed work
chi-cto workers consolidate
```

## Worker Instructions Template

Each spawned Claude agent receives:

```
You are a Chi CTO worker (ID: {worker_id}).

Your task: {feature_name}
Description: {feature_description}

Instructions:
1. Build the feature in this worktree
2. Run quality gates when done
3. Write your status to: .chi-cto/workers/{worker_id}/status.json
4. Write full context to: .chi-cto/workers/{worker_id}/handover.md

Status file format:
{
  "workerId": "{worker_id}",
  "feature": "{feature_name}",
  "status": "complete|blocked",
  "result": "success|failed",
  "summary": "What you accomplished"
}

Begin working autonomously. Signal completion via status file.
```

## Benefits

1. **3-5x Speedup** - Parallel execution vs sequential
2. **Full Token Budget Per Worker** - Each agent has 200k tokens
3. **Isolation** - Worker failure doesn't block others
4. **Visual Monitoring** - See all workers in Warp tabs
5. **Human Override** - Can jump into any tab to intervene

## Limitations

- macOS only (requires osascript)
- Requires Warp terminal
- Workers share filesystem (need careful isolation)
- No real-time communication between workers

## Success Criteria

- [x] Can spawn 3 workers in parallel Warp tabs (CLI implemented)
- [x] Workers write status files on completion (protocol defined)
- [x] Orchestrator detects completion via polling (worker-monitor.ts)
- [x] Can consolidate results from all workers (consolidate command)
- [x] End-to-end: spawn → monitor → consolidate works (VERIFIED 2026-01-05)

## Files Created/Modified

- `src/warp-spawner.ts` - Warp tab management via osascript ✅
- `src/worker-monitor.ts` - Status polling and consolidation ✅
- `src/cli-local.ts` - Added spawn/workers commands ✅
- `src/orchestrator.ts` - (Not modified - parallel mode is separate from sequential)

## Dependencies

- Warp terminal installed
- osascript available (macOS)
- Existing Chi CTO infrastructure

## Stress Test Results

**Date:** 2026-01-05
**Full Report:** `docs/STRESS-TEST-REPORT-2026-01-05.md`
**Confidence Score:** 8/10

### Verified

- ✅ TypeScript compiles
- ✅ All 143 tests pass
- ✅ Environment validation works
- ✅ JSON parsing handles malformed data gracefully
- ✅ CLI commands work correctly
- ✅ AppleScript escaping is correct (double-escape is intentional)
- ✅ Live end-to-end test passed (Chi-Gateway Health Inspector task completed)

### PAI Documentation Updates (2026-01-05)

- ✅ EP-067 added to ~/.claude/troubleshooting/error-patterns.md
- ✅ Verification Commands section added to docs/RUNBOOK.md
- ✅ Lesson committed to mem0: "Static vs Runtime verification rule"

### Edge Cases Tested

- Empty/null feature names: ✅ Handled
- Malformed JSON status files: ✅ Returns null, doesn't crash
- Missing active-tasks.md: ✅ Shows helpful message
- No IMMEDIATE tier features: ✅ Shows warning
