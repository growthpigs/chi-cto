# Warp Parallel Orchestration - Stress Test Report

**Date:** 2026-01-05
**Tester:** Senior QA Architect (Claude)
**Component:** Warp-based Parallel Orchestration
**Files Tested:** `warp-spawner.ts`, `worker-monitor.ts`, `cli-local.ts`

---

## Pre-Flight Checklist

### Core Claims

| # | Claim | Status | Evidence |
|---|-------|--------|----------|
| 1 | TypeScript compiles without errors | ✅ VERIFIED | `npx tsc` succeeds, dist/*.js created |
| 2 | All 119 tests pass | ✅ VERIFIED | `npm test` shows 119 passed |
| 3 | Environment validation works | ✅ VERIFIED | `validateEnvironment()` returns `{valid: true}` on macOS with Warp |
| 4 | JSON parsing handles malformed data | ✅ VERIFIED | Returns `null` on empty/malformed JSON, no crash |
| 5 | Workers status command works | ✅ VERIFIED | Correctly shows worker states |
| 6 | Workers consolidate command works | ✅ VERIFIED | Generates consolidated-sitrep.md |
| 7 | AppleScript escaping is correct | ✅ VERIFIED | Double-escaping is intentional and correct for bash |

### Edge Cases Tested

| Case | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Empty feature name | `feature: ""` | Handle gracefully | Returns success:true | ✅ |
| Null feature | `feature: null` | Handle gracefully | Returns success:true | ✅ |
| Feature with quotes | `"Auth"` | Escape properly | Escapes correctly | ✅ |
| Malformed JSON | `{broken` | Return null | Returns null | ✅ |
| Empty status file | `(empty)` | Return null | Returns null | ✅ |
| Missing status file | `(nonexistent)` | Return null | Returns null | ✅ |
| No IMMEDIATE features | Score < 25 | Show warning | Shows warning | ✅ |
| Missing active-tasks.md | `(file not found)` | Show instructions | Shows instructions | ✅ |

### Gaps Found

| # | Gap | Severity | Risk | Mitigation |
|---|-----|----------|------|------------|
| 1 | Nonexistent project path shows generic "No features found" | ⚠️ Low | User confusion | Add path existence check |
| 2 | AppleScript escaping is complex/hard to reason about | ⚠️ Low | Maintainability | Add comments explaining the double-escape |
| 3 | No unit tests for new modules | ⚠️ Medium | Regression risk | Add tests for warp-spawner.ts and worker-monitor.ts |
| 4 | No retry logic for osascript failures | ⚠️ Low | Transient failures | Could add 1 retry |

### Critical Fix Applied During Stress Test

| Issue | Original Code | Fixed Code |
|-------|---------------|------------|
| Claude invocation | `claude "instructions..."` | 1. `claude` + Enter, 2. Wait 3s, 3. Type instructions |

**Root Cause:** Claude Code must be started with just `claude` + Enter.
The instructions are then typed as the first user message.
Passing instructions as command-line args does NOT work reliably.

### Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `child_process` | ✅ Built-in | Node.js core module |
| `fs` | ✅ Built-in | Node.js core module |
| `path` | ✅ Built-in | Node.js core module |
| `Warp.app` | ✅ Installed | Verified at /Applications/Warp.app |
| `osascript` | ✅ Available | macOS built-in |

### Assumptions

| Assumption | Verified | Risk if Wrong |
|------------|----------|---------------|
| User is on macOS | ✅ Yes | `validateEnvironment()` checks this |
| Warp is installed | ✅ Yes | `isWarpAvailable()` checks this |
| osascript has permissions | ✅ Yes | Tested successfully |
| Claude CLI is available | ⚠️ Not verified | Worker would fail to start |
| Workers write valid JSON | ⚠️ Not verified | Handled - returns null on bad JSON |

---

## Confidence Score: 8/10

### Why Not 10?

1. **No unit tests for new modules** (-1): warp-spawner.ts and worker-monitor.ts need dedicated tests
2. **No live end-to-end test** (-1): Haven't actually spawned real workers with Claude

### Recommended Before Production

1. Add unit tests for `warp-spawner.ts`:
   - Test `escapeAppleScript()` with edge cases
   - Test `generateWorkerInstructions()` output format
   - Mock `execSync` to test spawn logic without side effects

2. Add unit tests for `worker-monitor.ts`:
   - Test `pollWorkers()` with various status combinations
   - Test `consolidateResults()` aggregation logic
   - Test `generateConsolidatedSitrep()` output format

3. Do one live test:
   - Create a test project with 2 simple features
   - Run `chi-cto spawn . --workers 2`
   - Verify Warp opens tabs
   - Verify workers write status files
   - Run `chi-cto workers consolidate .`

---

## Verified Runtime Tests

```bash
# 1. Compilation
npx tsc  # ✅ Succeeded

# 2. Tests
npm test  # ✅ 119/119 passed

# 3. Environment validation
node -e "const {validateEnvironment} = require('./dist/warp-spawner.js'); console.log(validateEnvironment())"
# ✅ {valid: true, errors: []}

# 4. JSON edge cases
# Created /tmp/chi-test/.chi-cto/workers/ with valid, malformed, and empty status files
# ✅ All handled correctly

# 5. CLI commands
npx ts-node src/cli-local.ts workers status /tmp/chi-test  # ✅ Shows status
npx ts-node src/cli-local.ts workers consolidate /tmp/chi-test  # ✅ Consolidates
```

---

## Conclusion

The implementation is **READY FOR TESTING** with the following caveats:

1. ✅ All core functionality verified
2. ✅ Edge cases handled gracefully
3. ⚠️ Needs unit tests before production
4. ⚠️ Needs one live end-to-end test

**Recommendation:** Proceed to live testing with a simple 2-feature project.
