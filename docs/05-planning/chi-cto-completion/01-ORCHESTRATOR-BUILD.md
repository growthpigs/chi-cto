# Stream 1: Orchestrator Implementation

**Agent:** FeatureBuilder
**Estimated Time:** 6-8 hours
**Status:** Ready for Dispatch
**Created:** 2026-01-05

---

## MISSION

Build the core orchestration loop that connects all 4 phases of Chi CTO.

**High-Level Goal:** Implement `SessionOrchestrator.runModeB()` - the main automation loop that reads tasks, scores them, spawns agents, applies quality gates, handles errors, and writes handover.

---

## CRITICAL CONTEXT (Self-Contained)

### Project Structure
```
/Users/rodericandrews/_PAI/projects/chi-cto/
├── src/
│   ├── index.ts (TO BE CREATED - entry point)
│   ├── priority-scoring.ts ✅ COMPLETE
│   ├── quality-gates.ts ✅ COMPLETE
│   ├── error-recovery.ts ✅ COMPLETE
│   ├── session-management.ts ✅ PARTIAL (missing orchestrator)
│   ├── handover.ts ✅ COMPLETE
│   └── orchestrator.ts ← YOUR TASK
└── test/
    └── (80/80 unit tests passing)
```

### What Already Exists (NO MODIFICATIONS NEEDED)

**PriorityScorer** (`src/priority-scoring.ts`)
```typescript
export class PriorityScorer {
  scoreFeature(feature: Feature): ScoredFeature
  scoreBatch(features: Feature[]): ScoredFeature[]
}
// Features score on U+I+C+M formula (0-100)
// ✅ Tested, working
```

**QualityGatesExecutor** (`src/quality-gates.ts`)
```typescript
export class QualityGatesExecutor {
  async runAllGates(): Promise<GateResult[]>
  // 4 sequential gates: coverage, linting, code review, git safety
  // ✅ Tested, working
}
```

**ErrorRecoveryHandler** (`src/error-recovery.ts`)
```typescript
export class ErrorRecoveryHandler {
  async handleError(error: AgentError): Promise<RecoveryAction>
  // 7 error types with specific recovery strategies
  // ✅ Tested, working
}
```

**SessionOrchestrator** (`src/session-management.ts`)
```typescript
export class SessionOrchestrator {
  async startSession(): Promise<SessionState>
  async resumeSession(projectPath: string): Promise<SessionState>
  checkTokenBudget(state: SessionState): TokenStatus
  async generateMorningReport(state: SessionState): Promise<string>
  async writeHandover(state: SessionState, projectPath: string): Promise<void>
}
// Exists but runModeB() is NOT implemented
```

---

## YOUR TASK

### Step 1: Create `src/orchestrator.ts`

This is the NEW file that will contain the main Mode B loop.

**Responsibilities:**

```typescript
export class ModeBAOrchestrator {
  /**
   * Main Mode B automation loop
   *
   * Workflow:
   * 1. Read active-tasks.md from project
   * 2. Parse into Feature[] (title, urgency, importance, confidence, impact)
   * 3. Call PriorityScorer to score each feature (U+I+C+M formula)
   * 4. Filter features with score >= 25 (immediate action threshold)
   * 5. Take top 3 immediate features
   * 6. For each feature (LOOP):
   *    a. Create git worktree for isolated work
   *    b. Spawn FeatureBuilder agent to implement feature
   *    c. Wait for agent to report completion
   *    d. Run QualityGates on completed code
   *    e. If gates pass: Mark as completed
   *    f. If gates fail: Call ErrorRecoveryHandler
   *    g. Loop until feature done or recovery fails
   * 7. Check token budget (if > 70% used, exit)
   * 8. Write handover.md with session state
   * 9. Return morning report
   */
  async runModeB(
    projectPath: string,
    tokenBudget: number = 200000
  ): Promise<SessionState>
}
```

### Step 2: Implement Data Parsing

**Read active-tasks.md and extract features:**

```typescript
async function readActiveTasksMarkdown(filePath: string): Promise<Feature[]> {
  // Expected format in active-tasks.md:
  // ## Feature: [name]
  // - urgency: 1-10
  // - importance: 1-10
  // - confidence: 1-10
  // - impact: 1-10
  // - description: [what it does]

  // Parse markdown and return Feature[]
}
```

**Example active-tasks.md:**
```markdown
## Feature: Add Email Validation
- urgency: 8
- importance: 9
- confidence: 7
- impact: 6
- description: Validate email format on signup

## Feature: Implement Rate Limiting
- urgency: 9
- importance: 10
- confidence: 9
- impact: 8
- description: Prevent brute force attacks
```

### Step 3: Implement Priority Scoring Loop

```typescript
const scorer = new PriorityScorer();
const features = await readActiveTasksMarkdown(projectPath);
const scoredFeatures = scorer.scoreBatch(features);

// Filter for immediate action (score >= 25)
const immediate = scoredFeatures
  .filter(f => f.finalScore >= 25)
  .sort((a, b) => b.finalScore - a.finalScore)
  .slice(0, 3);  // Top 3 only
```

### Step 4: Implement Feature Implementation Loop

For each feature in `immediate`, implement this pattern:

```typescript
for (const feature of immediate) {
  // 1. Create isolated worktree
  const worktreePath = await createGitWorktree(
    projectPath,
    `feature/${feature.id}`
  );

  // 2. Spawn FeatureBuilder agent
  //    (This uses Task tool to spawn subagent)
  const buildResult = await spawnFeatureBuilderAgent(
    worktreePath,
    feature,
    tokenBudget - tokenUsed
  );

  if (buildResult.success) {
    // 3. Run quality gates
    const gateResults = await gatesExecutor.runAllGates(worktreePath);

    if (gateResults.all_passed) {
      // Mark complete
      state.completedFeatures.push(feature.id);
      state.tokenUsed += buildResult.tokensUsed;
    } else {
      // 4. Handle recovery
      const recovery = await recoveryHandler.handleError({
        type: 'quality_gate_failed',
        feature: feature.id,
        details: gateResults
      });

      if (recovery.success) {
        state.completedFeatures.push(feature.id);
      } else {
        state.blockedFeatures.push(feature.id);
      }
    }
  }

  // Check token budget (exit if > 70% used)
  if (state.tokenUsed > tokenBudget * 0.7) {
    break;  // Exit loop, write handover
  }
}
```

### Step 5: Implement Token Budget Tracking

```typescript
// Track tokens during execution
state.tokenUsed += buildResult.tokensUsed;

// Check before each iteration
const percentageUsed = (state.tokenUsed / tokenBudget) * 100;
if (percentageUsed > 70) {
  console.log(`Token budget 70% consumed (${state.tokenUsed}/${tokenBudget})`);
  break;  // Exit loop gracefully
}
```

### Step 6: Write Handover and Generate Report

```typescript
// Write handover for multi-session persistence
await sessionOrchestrator.writeHandover(state, projectPath);

// Generate morning report for user
const report = await sessionOrchestrator.generateMorningReport(state);

return {
  state,
  report,
  success: state.blockedFeatures.length === 0
};
```

---

## ACCEPTANCE CRITERIA (MUST PASS)

### Code
- ✅ `src/orchestrator.ts` compiles without errors
- ✅ Exports `ModeBAOrchestrator` class
- ✅ Implements `runModeB(projectPath, tokenBudget)` async method
- ✅ All TypeScript types align with existing (Priority, QualityGates, ErrorRecovery, SessionManagement)
- ✅ No circular dependencies

### Tests
Create `test/orchestrator/orchestrator-integration.test.ts`:

- ✅ Test 1: Reads active-tasks.md and parses features
- ✅ Test 2: Scores features using PriorityScorer
- ✅ Test 3: Filters for immediate features (score >= 25)
- ✅ Test 4: Takes top 3 by score
- ✅ Test 5: Executes mock feature implementation
- ✅ Test 6: Runs quality gates on completion
- ✅ Test 7: Handles gate failure + recovery
- ✅ Test 8: Respects 70% token budget limit
- ✅ Test 9: Writes handover on completion
- ✅ Test 10: Generates morning report

**Minimum:** 5/10 tests pass. Ideal: 10/10.

### Integration
- ✅ Doesn't break existing 80 unit tests
- ✅ `npm test` shows: `85+ tests passing` (80 existing + 5+ new)

---

## HELPER FUNCTIONS (You May Need These)

### Git Worktree Creation
```typescript
async function createGitWorktree(
  projectPath: string,
  branchName: string
): Promise<string> {
  // Create: git worktree add [path] -b [branchName]
  // Return: worktree path
}
```

### Markdown Parsing
```typescript
function parseMarkdownFeatures(markdown: string): Feature[] {
  // Use regex to extract:
  // - Feature name (## Feature: [...])
  // - urgency, importance, confidence, impact (- field: value)
  // Return Feature[] array
}
```

### Spawn FeatureBuilder Agent
```typescript
async function spawnFeatureBuilderAgent(
  worktreePath: string,
  feature: Feature,
  remainingTokens: number
): Promise<BuildResult> {
  // Use Task tool to invoke FeatureBuilder skill
  // Task(description, prompt, subagent_type='feature-dev')
  // Return: { success, tokensUsed, output }
}
```

These don't need to be in your code - they're patterns for you to understand.

---

## IMPORTANT PATTERNS

### DO Use Task Tool for Agent Spawning
```typescript
// ✅ CORRECT - Use Task tool
const result = await Task({
  description: "Build auth feature",
  prompt: `Implement email auth in ${worktreePath}. Requirements: ...`,
  subagent_type: 'feature-dev'
});
```

### DON'T Hardcode Shell Commands
```typescript
// ❌ WRONG - Don't do this
exec(`git worktree add ...`);  // Shell commands should be minimal

// ✅ CORRECT - Use structured tools
git.worktree.add(path, branch);  // Or shell minimally
```

### DO Handle Errors Gracefully
```typescript
// ✅ CORRECT - Catch and recover
try {
  const result = await buildFeature();
} catch (error) {
  const recovery = await recoveryHandler.handleError(error);
  // Continue or exit based on recovery result
}
```

---

## RESOURCES

**All existing code you can read (reference implementation):**
- `src/priority-scoring.ts` - How to score features
- `src/quality-gates.ts` - How to run gates
- `src/error-recovery.ts` - How to recover from errors
- `src/session-management.ts` - How to write handover and reports

**DO NOT MODIFY existing files unless absolutely necessary.**

---

## SUCCESS OUTPUT

When complete, return:

```
## Stream 1: Orchestrator Implementation

**Status:** ✅ COMPLETE

**What Was Built:**
- src/orchestrator.ts with ModeBAOrchestrator class
- [List of key methods implemented]
- 10 unit tests (or fewer if partial)

**Test Results:**
[Paste output from: npm test -- orchestrator.test.ts]

**Files Modified:**
- src/orchestrator.ts (NEW - 600+ lines)
- test/orchestrator/orchestrator-integration.test.ts (NEW - 400+ lines)

**Next Step:**
Stream 2 (CLI) should export entry point that calls orchestrator.runModeB()
```

---

*Task Document: Stream 1 Orchestrator Build | Status: Ready for Dispatch | Created: 2026-01-05*
