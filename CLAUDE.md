# Chi CTO

## 🚨 GitHub PM + SOT

**GitHub is the full PM system and canonical source of truth for this project. Not just an issue tracker.** Durable bugs, tasks, follow-ups, specs, decisions, governance changes, and runbook-worthy findings must land in the correct GitHub repo as issues, issue-body updates, comments, linked milestones, or umbrella records. Local `.md` files support execution and AI continuity; they do not own durable project state.

**Automatic capture rule:** when an AI discovers work that obviously needs to be remembered, tracked, or acted on later, it must create or update the relevant GitHub issue before ending the session. If a fitting milestone or umbrella already exists, attach the issue there too. Do not leave durable project state stranded only in local `.md` files.

**What:** Autonomous feature orchestrator - reads active-tasks, scores priorities, spawns agents to build features.
**Stack:** TypeScript + Cloudflare Workers + MCP
**Status:** Production ready, integrated with PAI system

---

## Quick Context

- Reads `active-tasks.md` from any project
- Scores features using U+I+C+M formula (Urgency, Importance, Confidence, Impact)
- Spawns FeatureBuilder agents in isolated git worktrees
- Runs quality gates on completed work
- Writes session handover for continuity

---

## Key Files

| Need | Location |
|------|----------|
| Operations guide | `docs/06-reference/RUNBOOK.md` |
| Architecture | `docs/04-technical/ARCHITECTURE-DEEP-DIVE.md` |
| Feature plans / FSDs | GitHub issues with `[FSD]` title prefix (project-management lives in GitHub per [PAI governance](https://github.com/growthpigs/lifemodo/issues/561)) |
| Reports | `docs/08-reports/` |
| Reference docs | `docs/06-reference/` |
| Source code | `src/` |
| Tests | `tests/` |

---

## Commands

```bash
# Analyze features (no execution)
/chi-cto suggest ~/my-project

# Execute Mode B orchestration (builds top 3 features)
/chi-cto mode-b run ~/my-project

# Check session status
/chi-cto status ~/my-project
```

---

## Dev Commands

```bash
npm run build     # Build TypeScript
npm test          # Run tests
npm run deploy    # Deploy to Cloudflare
```

---

## Architecture

```
src/
├── orchestrator.ts      # Main orchestration logic
├── priority-scoring.ts  # U+I+C+M formula
├── quality-gates.ts     # Pre/post build validation
├── warp-spawner.ts      # Agent spawning
├── error-recovery.ts    # Failure handling
├── session-management.ts
└── mcp.ts               # MCP server integration
```

---

## Priority Formula

**Score = Urgency + Importance + Confidence + Impact** (max 40)
- 36-40: IMMEDIATE
- 30-35: THIS_WEEK
- 24-29: THIS_MONTH
- <24: BACKLOG
