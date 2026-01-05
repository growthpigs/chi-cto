# Chi CTO Runbook

**Version:** 1.0.0
**Updated:** 2026-01-05
**Status:** Production Ready

---

## Overview

**Chi CTO** is an autonomous feature orchestrator that:
- Reads `active-tasks.md` from any project
- Scores features using the U+I+C+M formula
- Spawns agents to build top-priority features
- Runs quality gates on completed work
- Handles failures with error recovery
- Writes session handover for continuity

---

## Quick Start

### Prerequisites
- Claude Code (latest version)
- Project with `working/active-tasks.md` file
- Token budget (default: 200,000)

### Three Commands

```bash
# 1. Analyze and suggest top features (no execution)
/chi-cto suggest ~/my-project

# 2. Execute full Mode B orchestration (builds top 3 features)
/chi-cto mode-b run ~/my-project

# 3. Show last session status
/chi-cto status ~/my-project
```

---

## Detailed Usage

### Command 1: `/chi-cto suggest [project-path]`

**What it does:**
- Reads `active-tasks.md` from the project
- Scores all features using priority formula
- Ranks top 5 by priority
- Shows scores and reasoning
- **Does not execute** - just analysis

**Example:**
```
/chi-cto suggest ~/chi-cto
```

**Output:**
```
## Chi CTO Analysis for ~/chi-cto

**Confidence:** 9/10
**Mode:** Suggestion (no execution)

### Top 5 Priority Features

1. **Add real agent spawning** (Score: 38/40)
   - Urgency: 10, Importance: 9
   - Confidence: 9, Impact: 10
   - Reason: Critical for autonomous building

2. **Implement token tracking** (Score: 35/40)
   ...
```

**Use this when:**
- You want to understand feature priorities
- You're planning work
- You want to validate scoring before execution

---

### Command 2: `/chi-cto mode-b run [project-path] [--token-budget N]`

**What it does:**
- Reads `active-tasks.md`
- Scores all features
- Takes top 3 "IMMEDIATE" tier features
- For each feature:
  - Creates isolated git worktree
  - Spawns FeatureBuilder agent
  - Runs quality gates
  - Handles recovery on failures
- Loops until 70% token budget exhausted
- Writes `handover.md` with session state
- Returns morning report

**Example:**
```
/chi-cto mode-b run ~/my-project --token-budget 300000
```

**Token Budget Options:**
- Default: 200,000
- Large projects: 300,000-500,000
- Small features: 100,000
- Flag: `--token-budget N` (1 to 10,000,000)

**Output:**
```
🚀 Starting Chi CTO Mode B
Project: ~/my-project
Token Budget: 300000
---

✅ Session started: chi-cto-1704495600000
✅ Orchestration complete

## Chi CTO Morning Report

### Session Summary
- Session ID: chi-cto-1704495600000
- Duration: 45 minutes
- Features Attempted: 3
- Completed: 2
- Blocked: 1
- Tokens Used: 145,000 / 300,000 (48%)

### Completed Features
1. ✅ Add real agent spawning
   - Quality Gates: PASS (coverage, linting, code review, git-safety)
   - Commits: 3 (abc123, def456, ghi789)

2. ✅ Implement token tracking
   - Quality Gates: PASS
   - Commits: 2 (jkl012, mno345)

### Blocked Features
1. ❌ Performance optimization
   - Reason: Quality Gate FAIL (coverage below 80%)
   - Recovery Attempted: FAILED
   - Recommendation: Review test coverage

### Next Steps
- Review coverage gaps in Performance optimization feature
- Re-run mode-b to continue building
- Check handover.md for session state
```

**When to use:**
- Running overnight/scheduled builds
- Autonomous feature implementation
- Catching up on backlog
- Testing orchestration

**What happens on failure:**
- Error Recovery kicks in automatically
- Feature moved to blocked list
- Session continues with next feature
- Full log in handover.md

---

### Command 3: `/chi-cto status [project-path]`

**What it does:**
- Reads the last `handover.md` from the project
- Shows previous session state
- Lists completed/blocked features
- Token usage
- Next steps

**Example:**
```
/chi-cto status ~/my-project
```

**Output:**
```
## Last Chi CTO Session

Session ID: chi-cto-1704495600000
Start Time: 2026-01-05T14:30:00Z
Status: complete
Features: 3
Completed: 2
Blocked: 1
Tokens Used: 145,000 / 300,000

[Full handover.md content]
```

**Use this when:**
- You need to see what ran last
- You want to resume interrupted session
- You're checking status of ongoing work

---

## How Chi CTO Works

### The 4 Phases

#### Phase 1: Priority Scoring

**Formula:** `Score = Urgency + Importance + Confidence + Impact`

Each dimension is 1-10, so max score is 40.

**Tiers:**
- **IMMEDIATE** (score ≥ 25): Do now
- **SOON** (score 15-24): Plan for next
- **LATER** (score < 15): Backlog

**Scoring multiplier adjustments:**
- External blockers: 0.5x (waiting on others)
- Technical debt: 1.2x (fix now to prevent worse)
- User-requested: 1.3x (customer priority)
- Experimental: 0.7x (unproven)

#### Phase 2: Feature Selection

Top 3 IMMEDIATE features are selected for building.

#### Phase 3: Building

For each feature:
1. Create isolated git worktree (`feature/{feature-id}`)
2. Spawn FeatureBuilder agent
3. Agent implements feature
4. Code committed to worktree branch

#### Phase 4: Quality Gates

All features run through 4 gates:

| Gate | What It Checks | Fails If |
|------|---|---|
| **Coverage** | Jest coverage report | Below 80% |
| **Linting** | ESLint errors | Any error found |
| **Code Review** | Manual review checks | Issues found |
| **Git Safety** | Commits, history, conflicts | Unsafe state |

If ANY gate fails → Error Recovery kicks in

#### Phase 5: Error Recovery

7 recovery strategies:

| Strategy | Trigger | Action |
|----------|---------|--------|
| **Rollback** | Build failed | Revert commits |
| **Tool Fix** | Tool missing | Install dependency |
| **Coverage Gap** | Coverage < 80% | Ask to add tests |
| **Lint Errors** | ESLint failed | Auto-fix (eslint --fix) |
| **Code Review** | Manual review failed | Improve code quality |
| **Git Cleanup** | Merge conflict | Abort feature, clean up |
| **Infrastructure** | Tool infrastructure down | Retry or skip gate |

---

## active-tasks.md Format

Your project's `working/active-tasks.md` should follow this format:

```markdown
# Active Tasks

## Feature: Add user authentication
- urgency: 9
- importance: 10
- confidence: 8
- impact: 10
- description: Implement JWT-based auth with password reset

## Feature: Implement API rate limiting
- urgency: 7
- importance: 8
- confidence: 9
- impact: 7
- description: Rate limit by IP and user ID

## Feature: Add dark mode toggle
- urgency: 3
- importance: 5
- confidence: 10
- impact: 3
- description: Theme switcher in settings
```

**Required fields:**
- `## Feature: [name]` - Feature title
- `urgency: 1-10` - How time-sensitive
- `importance: 1-10` - Business value
- `confidence: 1-10` - Do we know how to build it?
- `impact: 1-10` - How much does it help?

**Optional:**
- `description: [text]` - What to build

---

## handover.md Structure

After each Mode B run, Chi CTO writes `handover.md` with:

```markdown
---
## Chi CTO Session Handover

**Session ID:** chi-cto-1704495600000
**Start Time:** 2026-01-05T14:30:00Z
**End Time:** 2026-01-05T15:15:00Z
**Status:** complete|paused|failed

### Completed Features
- feature-1 (id-abc123)
- feature-2 (id-def456)

### Blocked Features
- feature-3 (reason: quality gate failure)

### Token Budget
- Budget: 300,000
- Used: 145,000 (48%)
- Remaining: 155,000

### Decisions
- Feature 3 blocked due to coverage gate failing
- Recommended: Add test coverage and retry

---
```

**Location:** `{project-root}/handover.md`

**Use for:**
- Resuming interrupted sessions
- Understanding what happened
- Planning next run
- Debugging failures

---

## Deployment

Chi CTO runs as a **Cloudflare Worker** (MCP Server).

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/chi-cto/suggest` | Request feature analysis |
| POST | `/chi-cto/mode-b` | Execute orchestration |
| GET | `/chi-cto/status` | Get last session status |
| GET | `/health` | Health check |

### Configuration

Edit `wrangler.toml`:

```toml
[env.production]
vars = { LOG_LEVEL = "info", TOKEN_BUDGET = "200000" }

[env.staging]
vars = { LOG_LEVEL = "debug", TOKEN_BUDGET = "100000" }
```

### Deployment Commands

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy

# Verify deployment
curl https://chi-cto.roderic-andrews.workers.dev/health
```

**URLs:**
- Staging: https://chi-cto-staging.roderic-andrews.workers.dev
- Production: https://chi-cto.roderic-andrews.workers.dev

---

## Troubleshooting

### Common Issues

#### "No active-tasks.md found"

**Problem:** Chi CTO couldn't find `working/active-tasks.md`

**Solution:**
1. Check file exists: `ls -la ~/my-project/working/active-tasks.md`
2. Check format: Should have `## Feature:` headers
3. Add dummy features if missing:
   ```markdown
   ## Feature: Test feature
   - urgency: 5
   - importance: 5
   - confidence: 5
   - impact: 5
   ```

#### "Token budget exceeded (> 70%)"

**Problem:** Mode B stopped because token budget hit 70%

**Solution:**
- This is intentional (saves tokens for recovery)
- Run `/chi-cto status` to see what completed
- Next run will resume from handover.md
- Or increase `--token-budget` to 300000-500000

#### "Quality gate failed: coverage below 80%"

**Problem:** Feature built but tests don't meet coverage threshold

**Solution:**
- Error Recovery will attempt auto-fix
- Check `handover.md` for details
- Add tests and re-run mode-b
- Or adjust coverage threshold in jest.config.js

#### "Feature builder agent failed"

**Problem:** Agent crashed while building feature

**Solution:**
- Check agent logs in orchestrator output
- Review feature specification in active-tasks.md
- Break into smaller sub-features
- Or increase token budget for more context

---

## Monitoring & Logs

### Log Levels

Chi CTO logs structured JSON to stdout:

```json
{
  "requestId": "req_1704495600000_abc123",
  "level": "info",
  "timestamp": "2026-01-05T14:30:00.000Z",
  "message": "suggest completed",
  "projectPath": "~/my-project"
}
```

Set log level in `wrangler.toml`:
- `debug` - Verbose (staging)
- `info` - Normal (production)
- `warn` - Errors only
- `error` - Failures only

### Session Monitoring

Track token usage across runs:

```bash
# Show all session handovers
find ~/my-project -name "handover.md" -exec cat {} \;

# Total tokens used this week
grep "Token Budget" ~/my-project/handover.md | tail -7
```

---

## Best Practices

### 1. Keep active-tasks.md Updated

**Good:**
```
## Feature: Add email notifications
- urgency: 8
- importance: 9
- confidence: 7
- impact: 8
- description: Send weekly digest to users
```

**Bad:**
```
## Feature: stuff
- urgency: 5
```

### 2. Run suggest First

Always run `/chi-cto suggest` before `/chi-cto mode-b run`:

```bash
/chi-cto suggest ~/my-project        # Check top 5
# Review output, adjust active-tasks.md if needed
/chi-cto mode-b run ~/my-project     # Execute
```

### 3. Monitor Token Budget

Start conservative:
```bash
/chi-cto mode-b run ~/my-project --token-budget 150000
```

Then adjust based on results:
```bash
/chi-cto mode-b run ~/my-project --token-budget 300000
```

### 4. Review Blocked Features

After each run, check handover.md:
```bash
/chi-cto status ~/my-project
```

Fix issues and re-run to continue.

### 5. Git Cleanliness

Chi CTO assumes clean git state:
```bash
cd ~/my-project
git status
# Should show "nothing to commit, working tree clean"
```

If dirty:
```bash
git add .
git commit -m "checkpoint"
```

---

## Recovery & Rollback

### Manual Recovery

If Chi CTO gets stuck:

```bash
# See last session status
/chi-cto status ~/my-project

# Check worktree status
cd ~/my-project/.worktrees
ls -la

# Clean up stuck worktrees
git worktree remove .worktrees/feature-xyz --force

# Read handover for context
cat ~/my-project/handover.md
```

### Rollback Latest Feature

```bash
# View commit history
git log --oneline

# Revert problematic commit
git revert abc123def456...

# Re-run mode-b
/chi-cto mode-b run ~/my-project
```

---

## Integration with Workflow

### In Your Development Workflow

1. **Morning:** Run `/chi-cto suggest` to see top priorities
2. **Planning:** Adjust `active-tasks.md` based on team input
3. **Overnight:** Schedule `/chi-cto mode-b run` (or manual)
4. **Next Morning:** Check `/chi-cto status` to review built features
5. **Sprint Review:** Features ready for QA

### With Other Tools

- **Git:** Chi CTO creates worktrees and commits
- **Jest:** Quality gates check coverage
- **ESLint:** Auto-fixes linting issues
- **GitHub/GitLab:** Integrated via git worktrees

---

## Support

### Documentation
- Architecture: See `docs/04-technical/ARCHITECTURE.md`
- Design: See `docs/03-design/DESIGN-BRIEF.md`
- Technical Stack: See `docs/04-technical/TECH-STACK.md`

### Debugging
- Check logs: stdout JSON format
- Read handover: `handover.md` in project root
- Review orchestrator output: Full trace in last `/chi-cto` result

### Issues
- Feature not being scored correctly? Check `urgency, importance, confidence, impact` values
- Quality gate failing? Run gate manually: `npm test`, `npm run lint`
- Agent building wrong thing? Check feature `description` in `active-tasks.md`

---

**Last Updated:** 2026-01-05
**Status:** Production Ready
**Confidence:** 9/10
