# Chi CTO - Autonomous Feature Orchestrator

**Analyze project priorities and orchestrate autonomous feature building.**

---

## Quick Start

### 1. Analyze Features (No Execution)

```bash
# Suggest top 5 features based on priority scoring
/chi-cto suggest ~/my-project
```

**What it does:**
- Reads `working/active-tasks.md` from your project
- Scores each feature using: Urgency + Importance + Confidence + Impact
- Ranks by priority (IMMEDIATE, SOON, LATER)
- Returns top 5 features with scores and reasoning

**Example output:**
```
Top 5 Priority Features

1. Add user authentication (Score: 38/40)
   - Urgency: 9, Importance: 10
   - Confidence: 8, Impact: 10
   - Reason: Critical for security

2. Implement API caching (Score: 32/40)
   ...
```

---

### 2. Execute Full Orchestration

```bash
# Build top 3 features with quality gates + error recovery
/chi-cto mode-b run ~/my-project
```

**What it does:**
- Selects top 3 IMMEDIATE tier features
- For each feature:
  - Creates isolated git worktree
  - Spawns FeatureBuilder agent to implement
  - Runs quality gates (coverage, linting, code review, git-safety)
  - Applies error recovery if gates fail
- Loops until 70% token budget exhausted
- Writes handover.md with session state

**Options:**
```bash
/chi-cto mode-b run ~/my-project --token-budget 300000
```

---

### 3. Check Last Session Status

```bash
# Show what ran, what completed, what blocked
/chi-cto status ~/my-project
```

**What it shows:**
- Previous session ID and duration
- Features completed / blocked
- Token usage (X / Y)
- Blockers and recommendations

---

## How Chi CTO Works

### The 5 Phases

**Phase 1: Priority Scoring**
- Formula: `Score = Urgency + Importance + Confidence + Impact`
- Range: 0-40 (max = 10 each)
- Tiers:
  - IMMEDIATE: score ≥ 25 (do now)
  - SOON: 15-24 (plan next)
  - LATER: < 15 (backlog)

**Phase 2: Feature Selection**
- Top 3 features with IMMEDIATE tier selected for building

**Phase 3: Building**
- Isolated git worktree created for each feature
- FeatureBuilder agent implements
- Code committed to feature branch

**Phase 4: Quality Gates** (4 checks)
1. **Coverage** - Jest code coverage ≥ 80%
2. **Linting** - ESLint passes with no errors
3. **Code Review** - Manual review criteria met
4. **Git Safety** - No conflicts, clean history

**Phase 5: Error Recovery** (7 strategies)
- Rollback (build failed)
- Tool Fix (dependency missing)
- Coverage Gap (add tests)
- Lint Errors (auto-fix)
- Code Review (improve quality)
- Git Cleanup (merge conflict)
- Infrastructure (retry or skip)

---

## Setup: active-tasks.md Format

Your project needs `working/active-tasks.md` with this format:

```markdown
# Active Tasks

## Feature: Add user authentication
- urgency: 9
- importance: 10
- confidence: 8
- impact: 10
- description: Implement JWT-based auth with password reset

## Feature: Implement API caching
- urgency: 7
- importance: 8
- confidence: 9
- impact: 7
- description: Cache responses for 24 hours

## Feature: Add dark mode
- urgency: 3
- importance: 5
- confidence: 10
- impact: 3
```

**Required fields:**
- `## Feature: [name]` - Feature title
- `urgency: 1-10` - How time-sensitive?
- `importance: 1-10` - Business value?
- `confidence: 1-10` - Do we know how to build?
- `impact: 1-10` - How much does it help?

**Optional:**
- `description: [text]` - What to build

---

## Understanding Scores

### Example: "Add user authentication"

```
Urgency:   9 (users can't sign up without it)
Importance: 10 (core feature)
Confidence: 8 (we know how to do this)
Impact:     10 (enables everything else)

SCORE = 9 + 10 + 8 + 10 = 37/40
TIER = IMMEDIATE
REASON = Critical security feature
```

### Score Multipliers

If your feature has special context:

| Context | Multiplier | Example |
|---------|-----------|---------|
| External blocker | 0.5x | Waiting on client |
| Technical debt | 1.2x | Fix now before worse |
| User-requested | 1.3x | Customer priority |
| Experimental | 0.7x | Unproven value |

---

## Working with Handover

After each orchestration run, Chi CTO writes `handover.md` with:
- Session ID and timing
- Completed/blocked features
- Token usage
- Next steps

**Use for:**
- Understanding what happened
- Resuming interrupted sessions
- Planning next run

---

## Troubleshooting

### "No active-tasks.md found"

**Problem:** Chi CTO couldn't find your tasks file

**Solution:**
1. Create `working/active-tasks.md` in project root
2. Add features with required fields (urgency, importance, etc.)
3. Re-run command

### "Token budget exhausted (> 70%)"

**Problem:** Mode B stopped mid-execution

**Solution:**
- This is intentional (reserves tokens for recovery)
- Run `/chi-cto status` to see what completed
- Next run will continue from where it left off
- Or increase token budget: `--token-budget 300000`

### "Quality gate failed"

**Problem:** Feature built but failed testing/linting

**Solution:**
- Check handover.md for which gate failed
- Error Recovery attempts auto-fix
- If blocked, manually fix and re-run mode-b
- Or adjust thresholds (coverage, eslint)

---

## Key Resources

- **Full Docs:** `docs/RUNBOOK.md` (2500+ words)
- **Completion Status:** `COMPLETION-STATUS.md`
- **Architecture:** `src/orchestrator.ts` (main loop)
- **Tests:** `npm test` (119 passing)
- **Deployment:** https://chi-cto.roderic-andrews.workers.dev

---

## Advanced Usage

### Custom Token Budget

```bash
/chi-cto mode-b run ~/my-project --token-budget 500000
```

Larger budget = more features built in one run

### Testing Without Execution

```bash
/chi-cto suggest ~/my-project
# Review scores and reasoning
# Adjust active-tasks.md if needed
# Then run: /chi-cto mode-b run ~/my-project
```

### Session Recovery

If interrupted:
```bash
# Check last session
/chi-cto status ~/my-project

# Review handover.md for context
cat ~/my-project/handover.md

# Next orchestration will continue from there
/chi-cto mode-b run ~/my-project
```

---

## How to Run Chi CTO

### Local CLI (RECOMMENDED)

**Use the local CLI for actual feature building:**

```bash
# Analyze features
npx ts-node src/cli-local.ts suggest ~/my-project

# Execute orchestration
npx ts-node src/cli-local.ts mode-b ~/my-project

# Check status
npx ts-node src/cli-local.ts status ~/my-project
```

**Why local?** The orchestrator needs:
- Filesystem access (read active-tasks.md)
- Git access (create worktrees, commit)
- npm access (run quality gates)
- ESLint access (run linting)

Cloudflare Workers do NOT have these capabilities.

### REST API (Reference Only)

**Cloudflare Workers endpoint:**
- URL: https://chi-cto.roderic-andrews.workers.dev
- Health: `GET /health`
- Suggest: `POST /chi-cto/suggest`
- Status: `GET /chi-cto/status`

**Limitation:** REST API cannot execute orchestration because Cloudflare Workers cannot access your filesystem or run git/npm commands. Use the API only for reference or documentation purposes.

---

*Slash Command for Chi CTO*
*Read full docs: docs/RUNBOOK.md*
*Status: Production Ready*
