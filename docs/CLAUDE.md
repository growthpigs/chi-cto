# Chi CTO

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
| Operations guide | `06-reference/RUNBOOK.md` |
| Architecture | `04-technical/ARCHITECTURE-DEEP-DIVE.md` |
| Reports | `08-reports/` |
| Reference docs | `06-reference/` |
| Feature plans | `05-planning/[feature]/PLAN.md` |
| Source code | `../src/` |
| Tests | `../tests/` |

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
