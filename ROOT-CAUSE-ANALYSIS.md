# Chi CTO - Root Cause Analysis

**Date:** 2026-01-05
**Issue:** Chi CTO can't invoke skills. Tests pass but system doesn't work.
**Method:** Systematic root cause tracing + diagnostics

---

## Executive Summary

**Two Critical Root Causes Found:**

### 1. **Fundamental Architecture Mismatch** (MOST CRITICAL)

Chi CTO is a **TypeScript/Node.js orchestrator** trying to invoke **Claude-only Skills**.

```
Skills (FeatureBuilder, Brainstorming, etc.)
  └─ Only exist in Claude conversation contexts
  └─ Invoked via /skill-name slash commands
  └─ Require human or Claude interaction

Chi CTO (Node.js code)
  └─ Running as local TypeScript
  └─ Has NO access to Skill tool
  └─ Cannot invoke anything in Claude context
  └─ Generates stub code instead
```

**Evidence:**
- ❌ Diagnostic [1]: Skill tool not available in Node.js
- ❌ Diagnostic [4]: spawnFeatureBuilderAgent() never invokes a skill
- ❌ Diagnostic [7]: Orchestrator doesn't read skill registry

**Impact:** CRITICAL
- Chi CTO code CANNOT invoke skills programmatically
- Every skill invocation would require human intervention
- Current design generates stubs instead

---

### 2. **Skill → Orchestrator Communication Gap** (CRITICAL)

Workers spawn in separate Claude sessions and invoke skills, but:
- Skills output goes into conversation chat (text)
- Orchestrator expects executable code
- No mechanism to extract/return actual code

```
Worker (Claude in Warp Tab)
  ├─ Invokes: /feature-dev:feature-dev "build hero"
  ├─ FeatureBuilder executes and outputs code in chat
  └─ But code stays in THAT worker's conversation
      └─ Orchestrator can't access it
      └─ Only sees status.json (which is text, not code)

Orchestrator needs:
  ├─ Worker to execute skill
  ├─ Skill to produce actual files
  ├─ Worker to report "file X is at Y"
  └─ Orchestrator to retrieve file from Y
      └─ NONE of this is implemented
```

**Evidence:**
- ⚠️  Diagnostic [5]: Tests expect stubs, not real code
- ❌ Diagnostic [6]: Workers write status.json, not actual code
- ❌ Diagnostic [3]: But no mechanism to RETURN that code to orchestrator

**Impact:** CRITICAL
- Even if workers invoke skills, orchestrator can't get results
- Only handshake is status.json (metadata)
- Actual code artifact never reaches orchestrator

---

## Why Tests Pass But System Doesn't Work

Tests verify:
- ✅ Orchestrator can score features (PriorityScorer)
- ✅ Orchestrator can check quality gates (QualityGates)
- ✅ Orchestrator can spawn workers (Warp spawner)
- ✅ Orchestrator can read status files (WorkerMonitor)

Tests do NOT verify:
- ❌ That skills are actually invoked
- ❌ That skill outputs are captured
- ❌ That code is returned to orchestrator
- ❌ That final deliverable is assembled

**Why?** Tests mock the "success case" - they assume skills work and code is available. But that assumes the two root causes above are solved.

---

## The Design Contradiction

**SKILL.md says Chi CTO can:**
```markdown
"Orchestrates all available skills (FeatureBuilder, InfraBuilder, Orchestrator, etc.)
For EACH isolated feature:
1. Create git worktree
2. Command FeatureBuilder OR InfraBuilder (depending on task)
3. If complex: Use Orchestrator (spawn parallel sub-tasks)"
```

**But the code does:**
```typescript
async function spawnFeatureBuilderAgent(worktreePath, feature) {
  // NEVER invokes FeatureBuilder
  const implementation = generateImplementation(feature);  // Stub!
  fs.writeFileSync(..., implementation);  // Write stub to file
  return { success: true };  // Claim victory
}
```

**This worked for TESTING** (tests expect stubs)
**But fails for REAL WORK** (nobody wants stubs)

---

## Tracing the Problem Backward

**Symptom:** "Chi CTO can't invoke skills"

**Trace:**
1. spawnFeatureBuilderAgent generates stubs instead of code
2. WHY? Because it tries to generate code locally
3. WHY? Because it's TypeScript/Node.js, not Claude
4. WHY THAT DESIGN? Original plan was to generate code locally
5. ROOT CAUSE: Fundamental misunderstanding that TypeScript can invoke Skills

**The real discovery:** Worker tabs CAN invoke skills, but there's no mechanism to return the results.

---

## Two Paths Forward

### Path A: Accept the Limitation
```
"Chi CTO orchestrates, workers invoke skills"
- Orchestrator: Scores, plans, spawns
- Workers: Invoke skills, produce code
- Problem: How to get code back to orchestrator?
- Solution: Workers write code to shared directory, orchestrator retrieves it
- Feasibility: 80% - mostly plumbing
```

### Path B: Redesign Orchestration Model
```
"Orchestrator = Claude conversation, not Node.js"
- Instead of spawning workers in separate tabs
- Have orchestrator BE a Claude conversation that invokes skills directly
- No TypeScript code at all
- Feasibility: 100% - much simpler design
- Trade-off: No parallel worktree execution
```

---

## Diagnostic Evidence

Run this to confirm:
```bash
bash /Users/rodericandrews/_PAI/projects/chi-cto/diagnostic-validation.sh
```

Results show:
- ❌ [1] Skill tool not in Node.js
- ✅ [2] 47 skills available (workers can see them)
- ✅ [3] Workers can write files
- ❌ [4] No skill invocation in code
- ⚠️  [5] Tests expect stubs
- ❌ [6] No code return mechanism
- ❌ [7] No skill registry reading

---

## Recommendation

**Before implementing any fix:**

Decide: Do you want Chi CTO to be:

1. **Orchestrator that delegates to workers** (Path A)
   - TypeScript code spawns workers
   - Workers (Claude) invoke skills
   - Needs: Skill result return mechanism
   - Time: ~2 weeks
   - Complexity: Medium

2. **Pure Claude orchestration** (Path B)
   - Single Claude conversation acting as orchestrator
   - Invokes skills directly
   - No spawning, no parallel execution
   - Time: ~3 days
   - Complexity: Low
   - Trade-off: Less parallelization

Choose architecture → then implementation becomes clear.

---

## Next Steps (DO NOT IMPLEMENT YET)

1. ✅ Root cause analysis complete (THIS DOCUMENT)
2. ⏳ Pending: User decision on architecture
3. ⏳ Then: Implement the chosen path
4. ⏳ Then: Update tests to verify real behavior
5. ⏳ Then: Validate end-to-end

**DO NOT** attempt to "fix" without first choosing Path A or Path B.
