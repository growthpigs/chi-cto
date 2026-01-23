# PAI System Enforcement Implementation Plan

> **For Claude:** Execute this plan task-by-task with runtime verification. Show `stdout`/`stderr` for every command.

**Goal:** Convert documentation-only enforcement to executable system enforcement (startup script, validation, project creation automation).

**Architecture:** Three independent blockers fixed in sequence:
1. Automated startup script (`~/.claude/bin/start-session.sh`) - eliminates manual startup
2. Startup validation checklist - ensures all 4 steps are visible
3. Project creation automation (`~/.claude/bin/create-project.sh`) - eliminates manual setup

**Tech Stack:** Bash scripts, MCP tools (mem0, chi-gateway), git

---

## Blocker 1: Create Automated Startup Script

### Task 1a: Write `start-session.sh` script

**Files:**
- Create: `~/.claude/bin/start-session.sh`

**Step 1: Create the startup script**

```bash
#!/bin/bash
set -e

# ~/.claude/bin/start-session.sh
# Usage: start-session PROJECT_NAME
# Executes the mandatory startup sequence for any project

PROJECT_NAME="${1:-current}"

echo "🚪 EXECUTING MANDATORY STARTUP SEQUENCE"
echo "=========================================="
echo ""

# STEP 1: Load mem0 context
echo "📚 STEP 1: Loading mem0 context for project: $PROJECT_NAME"
echo "Command: mcp__mem0__search-memories(userId='chi', query='$PROJECT_NAME')"
echo "⚠️  NOTE: Requires MCP connection. Output will appear in Claude Code."
echo ""

# STEP 2: Load chi-gateway status
echo "🔌 STEP 2: Loading live system state from chi-gateway"
echo "Commands to run in Claude Code:"
echo "  mcp__chi-gateway__sentry_issues"
echo "  mcp__chi-gateway__github_list_repos"
echo "⚠️  NOTE: Requires MCP connection. Output will appear in Claude Code."
echo ""

# STEP 3: Load local project docs
echo "📄 STEP 3: Loading local project documents"
if [ -f "handover.md" ]; then
    echo "✅ Found: handover.md"
    echo "---"
    head -20 handover.md
    echo "---"
else
    echo "⚠️  No handover.md found"
fi

echo ""
if [ -f "working/active-tasks.md" ]; then
    echo "✅ Found: working/active-tasks.md"
    echo "---"
    head -15 working/active-tasks.md
    echo "---"
else
    echo "⚠️  No working/active-tasks.md found"
fi

echo ""
if [ -f ".git/config" ]; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    COMMIT=$(git log -1 --format='%h %s' 2>/dev/null || echo "unknown")
    echo "✅ Git Status:"
    echo "   Branch: $BRANCH"
    echo "   Latest: $COMMIT"
else
    echo "⚠️  No git repo found"
fi

echo ""
echo "=========================================="
echo "✅ STARTUP SEQUENCE COMPLETE"
echo ""
echo "You are now ready to work. If any step shows warnings:"
echo "1. Check mem0 for context"
echo "2. Check chi-gateway MCPs for live system state"
echo "3. Fix missing documents in working/ directory"
echo ""
```

Save this exactly to `~/.claude/bin/start-session.sh`

**Step 2: Make the script executable**

Run: `chmod +x ~/.claude/bin/start-session.sh`

Expected: No output (silent success)

**Step 3: Test the script in Command Center project**

Run:
```bash
cd /Users/rodericandrews/_PAI/projects/command_center_audience_OS
~/.claude/bin/start-session.sh "Command Center"
```

Expected output:
```
🚪 EXECUTING MANDATORY STARTUP SEQUENCE
==========================================

📚 STEP 1: Loading mem0 context for project: Command Center
Command: mcp__mem0__search-memories(userId='chi', query='Command Center')
⚠️  NOTE: Requires MCP connection...

🔌 STEP 2: Loading live system state from chi-gateway
Commands to run in Claude Code:
  mcp__chi-gateway__sentry_issues
...

📄 STEP 3: Loading local project documents
✅ Found: handover.md
---
# Session Handover
...

✅ Found: working/active-tasks.md
...

✅ Git Status:
   Branch: main
   Latest: [recent commit]

==========================================
✅ STARTUP SEQUENCE COMPLETE
```

**Step 4: Commit**

```bash
cd ~/.claude
git add bin/start-session.sh
git commit -m "feat: add automated startup script for mandatory startup sequence

- Eliminates manual startup steps
- Loads mem0 context (identifies needed MCP calls)
- Loads local docs (handover, active-tasks)
- Shows git status
- Executable from any project directory"
```

Expected: Shows files changed, new commit hash

---

## Blocker 2: Add Startup Validation Checklist to CLAUDE.md

### Task 2a: Add validation section to global CLAUDE.md

**Files:**
- Modify: `~/.claude/CLAUDE.md` - Add startup validation section after mandatory startup sequence

**Step 1: Add validation section to global CLAUDE.md**

Find the "🚪 MANDATORY STARTUP SEQUENCE" section and add after it:

```markdown
## ✅ STARTUP SEQUENCE VALIDATION

**Before claiming session is "loaded", verify all 4 steps completed:**

### 1. mem0 Context Loaded
Check: Did you see output from `mcp__mem0__search-memories`?
- ✅ If YES: "From mem0: [findings]"
- ❌ If NO: System not connected to memory. Check MCP connection.

### 2. Live System State Checked
Check: Did you see output from chi-gateway MCP?
- ✅ If YES: "chi-gateway reports: [status/errors/repos]"
- ❌ If NO: System not connected to live data. Check MCP connection.

### 3. Local Docs Loaded
Check: Did you read handover.md and active-tasks.md?
- ✅ If YES: "Active tasks: [list]"
- ❌ If NO: Go read them now before proceeding.

### 4. Session Ready Confirmation
Only after all 3 above, report:
```
✅ Session loaded successfully
From mem0: [what was learned]
Active: [pending tasks]
Ready to work.
```

**If any step missing:** Stop. Run `~/.claude/bin/start-session.sh [PROJECT_NAME]` to verify all steps executed.
```

**Step 2: Verify the change**

Run: `grep -A 20 "STARTUP SEQUENCE VALIDATION" ~/.claude/CLAUDE.md`

Expected: Shows the new validation section

**Step 3: Commit**

```bash
cd ~/.claude
git add CLAUDE.md
git commit -m "docs: add startup sequence validation checklist

- Requires explicit evidence for each startup step
- mem0 output must be visible
- chi-gateway output must be visible
- Local docs must be read
- Prevents silent skipping of startup sequence"
```

Expected: Shows modified CLAUDE.md, new commit hash

---

## Blocker 3: Create Project Creation Automation Script

### Task 3a: Write `create-project.sh` script

**Files:**
- Create: `~/.claude/bin/create-project.sh`

**Step 1: Create the project creation script**

```bash
#!/bin/bash
set -e

# ~/.claude/bin/create-project.sh
# Usage: create-project PROJECT_NAME
# Automatically scaffolds a new PAI project with all required structure

if [ -z "$1" ]; then
    echo "❌ Usage: create-project PROJECT_NAME"
    echo ""
    echo "Examples:"
    echo "  create-project my-feature"
    echo "  create-project new-dashboard"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="/Users/rodericandrews/_PAI/projects/$PROJECT_NAME"

echo "🚀 Creating PAI project: $PROJECT_NAME"
echo "=========================================="
echo ""

# Step 1: Create directory
echo "📁 Step 1: Creating project directory..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
echo "✅ Created: $PROJECT_DIR"
echo ""

# Step 2: Initialize git
echo "🔧 Step 2: Initializing git repository..."
if [ ! -d ".git" ]; then
    git init
    git config user.name "Roderic Andrews"
    git config user.email "roderic@example.com"
    echo "✅ Git initialized"
else
    echo "⚠️  Git already initialized"
fi
echo ""

# Step 3: Create folder structure
echo "📋 Step 3: Creating 10-folder docs structure..."
mkdir -p docs/{00-intake,01-product,02-specs,03-design,04-technical,05-planning,06-reference,07-business,08-reports,09-delivered}
mkdir -p features
mkdir -p working
echo "✅ Created docs folders (00-09)"
echo "✅ Created features folder"
echo "✅ Created working folder"
echo ""

# Step 4: Copy and customize CLAUDE.md
echo "📝 Step 4: Creating CLAUDE.md from template..."
cp ~/.claude/templates/PROJECT_CLAUDE_TEMPLATE.md CLAUDE.md
# Update placeholder
sed -i '' "s/\[PROJECT NAME\]/$PROJECT_NAME/g" CLAUDE.md
echo "✅ Created CLAUDE.md (update description manually)"
echo ""

# Step 5: Create handover.md
echo "📝 Step 5: Creating handover.md..."
cat > handover.md << 'EOF'
# Session Handover

_Cleared at session start. See working/active-tasks.md for pending items._
EOF
echo "✅ Created handover.md"
echo ""

# Step 6: Create active-tasks.md
echo "📝 Step 6: Creating working/active-tasks.md..."
cp ~/.claude/templates/WORKING_TASKS_TEMPLATE.md working/active-tasks.md
echo "✅ Created working/active-tasks.md"
echo ""

# Step 7: Create open-loops.md
echo "📝 Step 7: Creating working/open-loops.md..."
cat > working/open-loops.md << 'EOF'
# Open Loops

## Pending Items

[Add deferred work items here]
EOF
echo "✅ Created working/open-loops.md"
echo ""

# Step 8: Create features/INDEX.md
echo "📝 Step 8: Creating features/INDEX.md..."
cat > features/INDEX.md << 'EOF'
# Features

| # | Feature | Status | Owner |
|---|---------|--------|-------|
| 1 | [Feature 1] | Planned | You |
| 2 | [Feature 2] | Planned | You |
EOF
echo "✅ Created features/INDEX.md"
echo ""

# Step 9: Create .gitignore
echo "📝 Step 9: Creating .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
.env.local
.env.*.local
dist/
build/
.DS_Store
*.log
EOF
echo "✅ Created .gitignore"
echo ""

# Step 10: Initial commit
echo "🔄 Step 10: Creating initial commit..."
git add -A
git commit -m "feat: initialize PAI project structure

- 10-folder docs structure (00-intake through 09-delivered)
- features/INDEX.md for tracking
- working/ directory for active-tasks and open-loops
- CLAUDE.md with PAI system reference
- Ready for development"
echo "✅ Initial commit created"
echo ""

# Step 11: Setup symlink in PAI system
echo "🔗 Step 11: Creating symlink in PAI system..."
ln -sf "$PROJECT_DIR/docs" "/Users/rodericandrews/.claude/projects/$PROJECT_NAME" 2>/dev/null || echo "⚠️  Symlink already exists"
echo "✅ Symlink created: ~/.claude/projects/$PROJECT_NAME -> $PROJECT_DIR/docs"
echo ""

echo "=========================================="
echo "✅ PROJECT CREATED SUCCESSFULLY"
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_DIR"
echo "2. Edit CLAUDE.md - customize description"
echo "3. Start session: ~/.claude/bin/start-session.sh \"$PROJECT_NAME\""
echo "4. Begin work"
echo ""
echo "Project structure:"
echo "  docs/00-intake     ← Client materials"
echo "  docs/01-product    ← PRD, MVP-PRD, VISION"
echo "  docs/02-specs      ← User stories, acceptance criteria"
echo "  docs/03-design     ← Design brief, screens"
echo "  docs/04-technical  ← Data model, API, architecture"
echo "  docs/05-planning   ← Risk register, roadmap"
echo "  docs/06-reference  ← Runbook, tech debt"
echo "  docs/07-business   ← Proposal, SOW, agreement"
echo "  docs/08-reports    ← Progress reports"
echo "  docs/09-delivered  ← Handover, final docs"
echo "  features/INDEX.md  ← Feature tracker"
echo "  working/           ← active-tasks, open-loops, handover"
echo ""
```

Save this exactly to `~/.claude/bin/create-project.sh`

**Step 2: Make the script executable**

Run: `chmod +x ~/.claude/bin/create-project.sh`

Expected: No output (silent success)

**Step 3: Test the script by creating a test project**

Run: `~/.claude/bin/create-project.sh test-project-verify`

Expected output:
```
🚀 Creating PAI project: test-project-verify
==========================================

📁 Step 1: Creating project directory...
✅ Created: /Users/rodericandrews/_PAI/projects/test-project-verify

🔧 Step 2: Initializing git repository...
✅ Git initialized

📋 Step 3: Creating 10-folder docs structure...
✅ Created docs folders (00-09)
✅ Created features folder
✅ Created working folder

📝 Step 4: Creating CLAUDE.md from template...
✅ Created CLAUDE.md (update description manually)

...

✅ PROJECT CREATED SUCCESSFULLY

Next steps:
1. cd /Users/rodericandrews/_PAI/projects/test-project-verify
...
```

**Step 4: Verify the test project structure**

Run: `ls -la /Users/rodericandrews/_PAI/projects/test-project-verify/`

Expected:
```
total XXX
drwxr-xr-x  ...  .
drwxr-xr-x  ...  ..
-rw-r--r--  ...  .gitignore
-rw-r--r--  ...  CLAUDE.md
-rw-r--r--  ...  handover.md
drwxr-xr-x  ...  .git
drwxr-xr-x  ...  docs
drwxr-xr-x  ...  features
drwxr-xr-x  ...  working
```

Run: `ls -la /Users/rodericandrews/_PAI/projects/test-project-verify/docs/`

Expected:
```
total XXX
drwxr-xr-x  ...  .
drwxr-xr-x  ...  ..
drwxr-xr-x  ...  00-intake
drwxr-xr-x  ...  01-product
drwxr-xr-x  ...  02-specs
drwxr-xr-x  ...  03-design
drwxr-xr-x  ...  04-technical
drwxr-xr-x  ...  05-planning
drwxr-xr-x  ...  06-reference
drwxr-xr-x  ...  07-business
drwxr-xr-x  ...  08-reports
drwxr-xr-x  ...  09-delivered
```

**Step 5: Verify CLAUDE.md has mandatory startup section**

Run: `head -30 /Users/rodericandrews/_PAI/projects/test-project-verify/CLAUDE.md`

Expected: Should show "🚪 MANDATORY: READ GLOBAL PAI SYSTEM FIRST"

**Step 6: Verify git commit was created**

Run: `cd /Users/rodericandrews/_PAI/projects/test-project-verify && git log --oneline`

Expected:
```
[hash] feat: initialize PAI project structure
```

**Step 7: Clean up test project and commit the script**

Run: `rm -rf /Users/rodericandrews/_PAI/projects/test-project-verify`

Then:
```bash
cd ~/.claude
git add bin/create-project.sh
git commit -m "feat: add automated project creation script

- Creates full PAI project structure (10 folders)
- Initializes git with proper config
- Copies CLAUDE.md with mandatory startup reference
- Creates all working documents (handover, active-tasks)
- Creates initial commit automatically
- Sets up symlink in PAI system
- Eliminates manual project setup steps"
```

Expected: Shows new file, commit hash

---

## Summary of Fixes

| Blocker | Solution | Verification |
|---------|----------|--------------|
| Manual startup | `~/.claude/bin/start-session.sh` | Runs without error, shows all 4 steps |
| No validation | Checklist in CLAUDE.md | Requires explicit evidence for each step |
| Manual project creation | `~/.claude/bin/create-project.sh` | Test project creates, has all structure |

All three changes committed to git with evidence.
