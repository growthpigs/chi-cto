# MEMORY Folder Automation Implementation Plan

**Created:** 2026-01-12
**Status:** ✅ IMPLEMENTED
**CTO Review:** COMPLETED (corrections applied)
**Executed:** 2026-01-12 by Chi-CTO

---

## Executive Summary

Chi's PAI MEMORY system has 10 folders per Miessler v2.1, but only 3 are automated:
- ✅ `sessions/` → session-logger.sh
- ✅ `learnings/system-insights/` → insight-logger.sh
- ✅ `State/` → partial (chi-audit uses it)

This plan automates the remaining 7 folders.

---

## CTO Sanity Check Results (APPLIED)

### Critical Corrections

1. **PostToolUse is EMPTY** - Cannot assume existing pattern
2. **Paths must be absolute**: `/Users/rodericandrews/_PAI/.claude/hooks/`
3. **Stop hook input format**: JSON via stdin with `transcript_path` field
4. **Existing hooks to leverage**: session-logger.sh, insight-logger.sh, chi-audit-daily.sh

### settings.json Structure (Verified)

```json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "tool_name", "hooks": [...] }],
    "PostToolUse": [],  // EMPTY - design needed
    "Stop": [{ "hooks": [...] }],  // No matcher, runs on all stops
    "UserPromptSubmit": [{ "hooks": [...] }],
    "SessionStart": [{ "hooks": [...] }]
  }
}
```

---

## Implementation Phases

### Phase 1: High Value, Low Complexity

#### 1.1 decisions/ - ADR Skill
**Type:** Skill (not hook)
**Location:** `skills/ADR/SKILL.md`
**Trigger:** User says `/adr` or "architecture decision"

**Implementation:**
```bash
# Create skill folder
mkdir -p ~/.claude/skills/ADR

# SKILL.md content:
# - Template for ADR format
# - Auto-increment ADR number
# - Output to history/decisions/ADR-NNN-title.md
```

**Output format:** `history/decisions/ADR-001-use-cloudflare-workers.md`

**No settings.json changes needed** - skill-based.

---

#### 1.2 execution/ - Task Execution Logger
**Type:** Extend existing Stop hook OR new skill
**Approach:** Add to `/wrap` skill

**Implementation:**
When `/wrap` runs with a feature context:
1. If DU > 0.5: Create execution log
2. Write to `history/execution/YYYY-MM-DD-feature-name.md`

**Output format:**
```markdown
# Execution Log: Feature Name
**Date:** 2026-01-12
**Project:** ProjectName
**DUs:** 2.5

## Tasks Completed
- [ ] Task 1
- [x] Task 2

## Decisions Made
- Decision 1

## Blockers Encountered
- None
```

**No settings.json changes** - extend /wrap skill.

---

#### 1.3 security/ - Security Event Logger
**Type:** Extend chi-audit-daily.sh
**Location:** Existing hook

**Implementation:**
Add to `chi-audit-daily.sh`:
```bash
# After audit checks, log security events
SECURITY_LOG="$HOME/.claude/history/security/$(date +%Y-%m).md"
if [ "$SECURITY_ISSUES" -gt 0 ]; then
    echo "## $(date +%Y-%m-%d)" >> "$SECURITY_LOG"
    echo "$SECURITY_FINDINGS" >> "$SECURITY_LOG"
fi
```

**Credentials check:** Add to X1-X4 audit section.

---

### Phase 2: Medium Complexity

#### 2.1 research/ - Research Output Skill
**Type:** Skill
**Location:** `skills/Research/SKILL.md`
**Trigger:** `/explore` completion OR explicit `/research save`

**Implementation:**
When deep research completes:
1. Skill prompts: "Save this research? [y/n]"
2. If yes: Write to `history/research/YYYY-MM-DD-topic.md`

**Output format:**
```markdown
# Research: Topic Name
**Date:** 2026-01-12
**Sources:** [list]

## Summary
...

## Key Findings
...

## Related
- See history/research/
```

---

#### 2.2 recovery/ - Recovery Snapshot System
**Type:** Extend /wrap skill + git tags
**Trigger:** Before risky operations

**Implementation:**
1. Add to `/wrap`: If significant changes, suggest recovery point
2. Create: `git tag recovery-YYYY-MM-DD-HH-context`
3. Optionally: Copy critical files to `history/recovery/`

**Recovery points for:**
- Major refactors
- Config changes
- Pre-migration states

---

### Phase 3: Lower Priority

#### 3.1 raw-outputs/ - Error Event Stream
**Type:** New Stop hook
**Location:** `/Users/rodericandrews/_PAI/.claude/hooks/error-logger.sh`

**Implementation:**
```bash
#!/bin/bash
# error-logger.sh - Log errors to raw-outputs/

INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('transcript_path',''))" 2>/dev/null)

# Extract errors from transcript
# Append to history/raw-outputs/errors.jsonl
```

**settings.json addition:**
```json
{
  "type": "command",
  "command": "/bin/bash /Users/rodericandrews/_PAI/.claude/hooks/error-logger.sh",
  "timeout": 3000
}
```

**Output:** `history/raw-outputs/errors.jsonl` (rolling, 7-day retention)

---

#### 3.2 backups/ - Weekly Backup Cron
**Type:** Cron job (not hook)
**Location:** `~/.claude/scripts/cron/weekly-backup.sh`

**Implementation:**
```bash
#!/bin/bash
# Weekly backup of critical config

BACKUP_DIR="$HOME/.claude/history/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Backup critical files
cp ~/.claude/CLAUDE.md "$BACKUP_DIR/"
cp ~/.claude/settings.json "$BACKUP_DIR/"
cp -r ~/.claude/skills/CORE "$BACKUP_DIR/"
```

**Cron entry:**
```
0 3 * * 0 /Users/rodericandrews/.claude/scripts/cron/weekly-backup.sh
```

---

## Files to Create/Modify

### New Files

| File | Phase | Purpose |
|------|-------|---------|
| `skills/ADR/SKILL.md` | 1.1 | ADR creation skill |
| `hooks/error-logger.sh` | 3.1 | Error stream capture |
| `scripts/cron/weekly-backup.sh` | 3.2 | Weekly backup |

### Modified Files

| File | Phase | Change |
|------|-------|--------|
| `skills/Wrap/SKILL.md` | 1.2, 2.2 | Add execution logging, recovery points |
| `hooks/chi-audit-daily.sh` | 1.3 | Add security event logging |
| `settings.json` | 3.1 | Add error-logger.sh to Stop hooks |

---

## settings.json Changes (Phase 3 Only)

Current Stop hooks array:
```json
"Stop": [
  {
    "hooks": [
      {"type": "command", "command": "/bin/bash ...session-logger.sh", "timeout": 5000},
      {"type": "command", "command": "/bin/bash ...tts.sh", "timeout": 15000},
      {"type": "command", "command": "/bin/bash ...chi-audit-daily.sh", "timeout": 2000},
      {"type": "command", "command": "/bin/bash ...cost-tracker.sh", "timeout": 2000},
      {"type": "command", "command": "/bin/bash ...insight-logger.sh", "timeout": 5000}
    ]
  }
]
```

After Phase 3.1:
```json
"Stop": [
  {
    "hooks": [
      {"type": "command", "command": "/bin/bash ...session-logger.sh", "timeout": 5000},
      {"type": "command", "command": "/bin/bash ...tts.sh", "timeout": 15000},
      {"type": "command", "command": "/bin/bash ...chi-audit-daily.sh", "timeout": 2000},
      {"type": "command", "command": "/bin/bash ...cost-tracker.sh", "timeout": 2000},
      {"type": "command", "command": "/bin/bash ...insight-logger.sh", "timeout": 5000},
      {"type": "command", "command": "/bin/bash /Users/rodericandrews/_PAI/.claude/hooks/error-logger.sh", "timeout": 3000}
    ]
  }
]
```

---

## Verification Checklist

After implementation, chi-audit should show:

- [x] S4: All 10 MEMORY folders exist ✅
- [x] decisions/ has ADR files (4 existing + /adr skill)
- [x] execution/ logs appear after /wrap with DU > 0.5
- [x] security/ has monthly event logs (chi-audit-daily.sh)
- [x] research/ populated (4 existing + /research save skill)
- [x] recovery/ ready for git tags (via /wrap recovery points)
- [x] raw-outputs/ ready for errors.jsonl (error-logger.sh hook)
- [x] backups/ ready for weekly snapshots (cron every Sunday 3 AM)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Hook timeout | All new hooks < 5s |
| Disk space | raw-outputs 7-day rolling |
| Git clutter | recovery tags pruned monthly |
| Over-logging | Only significant events |

---

## Execution Command

```
/chi-cto implement MEMORY-AUTOMATION-PLAN.md
```

---

*Plan created: 2026-01-12 | CTO-reviewed | Ready for Chi-CTO execution*
