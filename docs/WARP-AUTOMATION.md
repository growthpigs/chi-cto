# Warp Terminal Automation via AppleScript

Chi CTO can autonomously spawn **multiple Claude Code sessions** in parallel Warp windows.

**Key insight:** We're not running bash commands - we're spawning Claude Code agents that work autonomously.

---

## Key Discovery

Warp's process name is **"stable"** (not "Warp"). It has no native AppleScript dictionary, but full UI automation works via System Events.

---

## Capabilities

| Capability | Status | Method |
|------------|--------|--------|
| Activate Warp | ✅ | `tell application "Warp" to activate` |
| Get all window titles | ✅ | System Events → process "stable" → windows |
| Open new window | ✅ | Cmd+N keystroke |
| Open new tab | ✅ | Cmd+T keystroke |
| Type commands | ✅ | `keystroke "command"` |
| Execute commands | ✅ | `keystroke return` |
| Switch between tabs | ✅ | Cmd+Shift+[ or ] |

---

## Core Scripts

### 1. Get All Warp Windows

```bash
osascript -e '
tell application "System Events"
    tell process "stable"
        get name of every window
    end tell
end tell'
```

### 2. Open New Warp Window

```bash
osascript -e '
tell application "Warp" to activate
delay 0.2
tell application "System Events"
    keystroke "n" using command down
end tell'
```

### 3. Open New Tab in Current Window

```bash
osascript -e '
tell application "Warp" to activate
delay 0.2
tell application "System Events"
    keystroke "t" using command down
end tell'
```

### 4. Run Command in Warp

```bash
osascript -e '
tell application "Warp" to activate
delay 0.2
tell application "System Events"
    keystroke "echo Hello from Chi CTO"
    delay 0.1
    keystroke return
end tell'
```

### 5. Run Command in New Window (Full Automation)

```bash
osascript -e '
tell application "Warp" to activate
delay 0.2
tell application "System Events"
    -- Open new window
    keystroke "n" using command down
    delay 0.5
    -- Navigate to project
    keystroke "cd /path/to/project"
    keystroke return
    delay 0.3
    -- Run command
    keystroke "npm run build"
    keystroke return
end tell'
```

---

## CRITICAL: Spawning Claude Code Sessions

The primary use case is spawning autonomous Claude Code agents, not raw bash commands.

### Spawn Claude Code in New Window

```bash
osascript -e '
tell application "Warp" to activate
delay 0.2
tell application "System Events"
    -- Open new window
    keystroke "n" using command down
    delay 0.5
    -- Navigate to project first
    keystroke "cd /Users/rodericandrews/_PAI/projects/war-room"
    keystroke return
    delay 0.3
    -- Start Claude Code
    keystroke "claude"
    keystroke return
end tell'
```

### Spawn Claude Code with Initial Prompt

```bash
osascript -e '
tell application "Warp" to activate
delay 0.2
tell application "System Events"
    keystroke "n" using command down
    delay 0.5
    keystroke "cd /path/to/project"
    keystroke return
    delay 0.3
    -- Start Claude with a prompt
    keystroke "claude \"Fix the failing tests in src/auth\""
    keystroke return
end tell'
```

### Full Orchestration: Spawn Multiple Claude Agents

```bash
#!/bin/bash
# spawn-claude-agents.sh - Chi CTO spawns parallel Claude workers

declare -A TASKS=(
    ["/Users/rodericandrews/_PAI/projects/war-room"]="Fix the TypeScript errors in the API layer"
    ["/Users/rodericandrews/_PAI/projects/audience-os"]="Add unit tests for the knowledge base module"
    ["/Users/rodericandrews/_PAI/projects/revos"]="Review and refactor the cartridge system"
)

for project in "${!TASKS[@]}"; do
    task="${TASKS[$project]}"
    name=$(basename "$project")

    osascript <<EOF
tell application "Warp" to activate
delay 0.2
tell application "System Events"
    keystroke "n" using command down
    delay 0.5
    keystroke "cd $project"
    keystroke return
    delay 0.3
    keystroke "claude \"$task\""
    keystroke return
end tell
EOF

    echo "Spawned Claude agent for: $name"
    sleep 0.5
done

echo "All Claude agents running in parallel"
```

---

## Parallel Execution Pattern

Chi CTO can spawn multiple windows/tabs and run commands in parallel:

```bash
#!/bin/bash
# spawn-parallel.sh - Run multiple commands in parallel Warp windows

COMMANDS=(
    "cd /project1 && npm test"
    "cd /project2 && npm run build"
    "cd /project3 && npm run lint"
)

for cmd in "${COMMANDS[@]}"; do
    osascript -e "
    tell application \"Warp\" to activate
    delay 0.2
    tell application \"System Events\"
        keystroke \"n\" using command down
        delay 0.5
        keystroke \"$cmd\"
        keystroke return
    end tell"
    sleep 0.5
done
```

---

## Naming Windows for Tracking

Set tab names using Warp's built-in command:

```bash
# In the new window, run:
warp-set-tab-name "Build Project A"
```

Or via AppleScript:

```bash
osascript -e '
tell application "Warp" to activate
tell application "System Events"
    keystroke "warp-set-tab-name \"Task: Build\""
    keystroke return
end tell'
```

---

## Orchestration Example

Chi CTO running a parallel build across 3 projects:

```bash
#!/bin/bash
# chi-parallel-build.sh

PROJECTS=(
    "/Users/rodericandrews/_PAI/projects/war-room"
    "/Users/rodericandrews/_PAI/projects/audience-os"
    "/Users/rodericandrews/_PAI/projects/chi-cto"
)

for project in "${PROJECTS[@]}"; do
    name=$(basename "$project")
    osascript <<EOF
tell application "Warp" to activate
delay 0.2
tell application "System Events"
    keystroke "n" using command down
    delay 0.5
    keystroke "cd $project && npm run build"
    keystroke return
end tell
EOF
    echo "Started build in: $name"
    sleep 0.3
done

echo "All builds started in parallel windows"
```

---

## Integration with Chi CTO

### TypeScript: Spawn Claude Code Agent

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ClaudeTask {
    project: string;
    prompt: string;
}

/**
 * Spawn a new Claude Code session in a fresh Warp window
 */
async function spawnClaudeAgent(task: ClaudeTask): Promise<void> {
    const escapedPrompt = task.prompt.replace(/"/g, '\\"');

    const script = `
tell application "Warp" to activate
delay 0.2
tell application "System Events"
    keystroke "n" using command down
    delay 0.5
    keystroke "cd ${task.project}"
    keystroke return
    delay 0.3
    keystroke "claude \\"${escapedPrompt}\\""
    keystroke return
end tell
    `;

    await execAsync(`osascript -e '${script}'`);
}

// Usage
await spawnClaudeAgent({
    project: '/Users/rodericandrews/_PAI/projects/war-room',
    prompt: 'Fix the failing tests in src/auth'
});
```

### TypeScript: Spawn Multiple Claude Agents in Parallel

```typescript
/**
 * Chi CTO Orchestrator - Spawn parallel Claude Code workers
 */
async function orchestrateParallelClaude(tasks: ClaudeTask[]): Promise<void> {
    console.log(`Spawning ${tasks.length} Claude agents...`);

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const projectName = task.project.split('/').pop();

        await spawnClaudeAgent(task);
        console.log(`[${i + 1}/${tasks.length}] Spawned agent for: ${projectName}`);

        // Stagger spawns to avoid race conditions
        await new Promise(resolve => setTimeout(resolve, 600));
    }

    console.log('All Claude agents running in parallel');
}

// Chi CTO dispatching work across projects
await orchestrateParallelClaude([
    {
        project: '/Users/rodericandrews/_PAI/projects/war-room',
        prompt: 'Fix TypeScript errors in the API layer'
    },
    {
        project: '/Users/rodericandrews/_PAI/projects/audience-os',
        prompt: 'Add unit tests for the knowledge base module'
    },
    {
        project: '/Users/rodericandrews/_PAI/projects/revos',
        prompt: 'Review and refactor the cartridge system'
    }
]);
```

### TypeScript: Full Chi CTO Worker Module

```typescript
// src/workers/warp-spawner.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface WorkerTask {
    id: string;
    project: string;
    prompt: string;
    priority?: 'high' | 'normal' | 'low';
}

export class WarpSpawner {
    private activeWorkers: Map<string, WorkerTask> = new Map();

    async spawn(task: WorkerTask): Promise<string> {
        const escapedPrompt = task.prompt
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');

        const script = `
tell application "Warp" to activate
delay 0.2
tell application "System Events"
    keystroke "n" using command down
    delay 0.5
    keystroke "cd ${task.project}"
    keystroke return
    delay 0.3
    keystroke "claude \\"${escapedPrompt}\\""
    keystroke return
end tell`;

        await execAsync(`osascript -e '${script}'`);
        this.activeWorkers.set(task.id, task);

        return task.id;
    }

    async spawnMany(tasks: WorkerTask[]): Promise<string[]> {
        const ids: string[] = [];

        for (const task of tasks) {
            const id = await this.spawn(task);
            ids.push(id);
            await this.delay(600);
        }

        return ids;
    }

    async getActiveWindows(): Promise<string[]> {
        const { stdout } = await execAsync(`osascript -e '
tell application "System Events"
    tell process "stable"
        get name of every window
    end tell
end tell'`);

        return stdout.trim().split(', ');
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

---

## Limitations

1. **No direct output capture** - Can't read command output via AppleScript (use log files or MCP)
2. **Timing-dependent** - Needs delays between actions
3. **Focus required** - Warp must be activated (can't run fully headless)
4. **macOS only** - Uses AppleScript/System Events

---

## Best Practices

1. **Use delays** - Allow 0.2-0.5s between actions
2. **Name windows** - Use `warp-set-tab-name` for tracking
3. **Log to files** - Redirect output: `command > /tmp/task-1.log 2>&1`
4. **Stagger spawns** - Don't open 10 windows simultaneously

---

**Created:** 2026-01-05
**Tested on:** Warp (stable), macOS Sonoma
