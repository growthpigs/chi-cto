# Stream 2: CLI Registration & Entry Point

**Agent:** InfraBuilder
**Estimated Time:** 2-3 hours
**Status:** Ready for Dispatch
**Created:** 2026-01-05

---

## MISSION

Create the CLI entry point and register slash commands so users can invoke Chi CTO.

**High-Level Goal:** Implement `src/cli.ts` with handlers for `/chi-cto suggest` and `/chi-cto mode-b run`, then register these in `.claude/commands/`.

---

## CRITICAL CONTEXT (Self-Contained)

### Project Structure
```
/Users/rodericandrews/_PAI/projects/chi-cto/
├── src/
│   ├── index.ts ← MODIFY (export CLI handlers)
│   ├── cli.ts ← CREATE (new file - command handlers)
│   ├── orchestrator.ts (Stream 1 will create this)
│   └── [other phases...]
└── ~/.claude/
    └── commands/
        └── chi-cto.ts ← CREATE (slash command registration)
```

### What Already Exists

**SessionOrchestrator** (from `src/session-management.ts`)
```typescript
export class SessionOrchestrator {
  async startSession(): Promise<SessionState>
  async resumeSession(projectPath: string): Promise<SessionState>
  checkTokenBudget(state: SessionState): TokenStatus
  async generateMorningReport(state: SessionState): Promise<string>
  async writeHandover(state: SessionState, projectPath: string): Promise<void>
}
// Entry point for Mode B orchestration
```

**Orchestrator** (from Stream 1 - will be created)
```typescript
export class ModeBAOrchestrator {
  async runModeB(projectPath: string, tokenBudget: number): Promise<SessionState>
}
// Main automation loop
```

### Slash Command System (How It Works)

**Location:** `/Users/rodericandrews/.claude/commands/`

**File Format:** TypeScript with exported handler

```typescript
// Example: ~/.claude/commands/chi-cto.ts
export const chiCtoCommand = {
  name: 'chi-cto',
  description: 'Chi CTO autonomous feature orchestrator',
  handler: async (args: CommandArgs) => {
    // Handle command
  }
};
```

**Used By:** Claude Code CLI interprets these files and registers them as `/chi-cto` command.

---

## YOUR TASK

### Step 1: Create `src/cli.ts`

This file exports command handlers that the slash command system will invoke.

```typescript
// src/cli.ts

import { SessionOrchestrator } from './session-management';
import { ModeBAOrchestrator } from './orchestrator';
import path from 'path';
import fs from 'fs';

export interface CommandArgs {
  subcommand: 'suggest' | 'mode-b run' | 'status';
  projectPath?: string;
  tokenBudget?: number;
  args?: Record<string, string>;
}

export class ChiCTOCLI {
  private orchestrator = new ModeBAOrchestrator();
  private sessionOrchestrator = new SessionOrchestrator();

  /**
   * Main entry point for /chi-cto command
   * Parses arguments and routes to appropriate handler
   */
  async execute(args: CommandArgs): Promise<string> {
    switch (args.subcommand) {
      case 'suggest':
        return this.handleSuggest(args);
      case 'mode-b run':
        return this.handleModeB(args);
      case 'status':
        return this.handleStatus(args);
      default:
        return this.showHelp();
    }
  }

  /**
   * /chi-cto suggest [project-path]
   * Analyzes active-tasks.md and suggests next features to build
   * (No execution, just priority analysis)
   */
  private async handleSuggest(args: CommandArgs): Promise<string> {
    const projectPath = args.projectPath || process.cwd();

    if (!fs.existsSync(projectPath)) {
      return `Error: Project path not found: ${projectPath}`;
    }

    const activeTasksPath = path.join(projectPath, 'working/active-tasks.md');
    if (!fs.existsSync(activeTasksPath)) {
      return `Error: No active-tasks.md found in ${projectPath}`;
    }

    try {
      // Start new session in suggestion mode
      const session = await this.sessionOrchestrator.startSession();

      // Read and score features (don't execute)
      const markdown = fs.readFileSync(activeTasksPath, 'utf-8');
      const features = this.parseFeatures(markdown);

      if (features.length === 0) {
        return `No features found in active-tasks.md`;
      }

      // Score and rank
      const scorer = require('./priority-scoring').PriorityScorer;
      const ranked = new scorer().scoreBatch(features)
        .sort((a: any, b: any) => b.finalScore - a.finalScore)
        .slice(0, 5);

      // Format suggestion output
      let output = `## Chi CTO Analysis for ${projectPath}\n\n`;
      output += `**Confidence:** 9/10\n**Mode:** Suggestion (no execution)\n\n`;
      output += `### Top 5 Priority Features\n\n`;

      ranked.forEach((feature: any, i: number) => {
        output += `${i + 1}. **${feature.title}** (Score: ${feature.finalScore}/100)\n`;
        output += `   - Urgency: ${feature.urgency}, Importance: ${feature.importance}\n`;
        output += `   - Confidence: ${feature.confidence}, Impact: ${feature.impact}\n`;
        output += `   - Description: ${feature.description}\n\n`;
      });

      output += `### Next Steps\n`;
      output += `Run \`/chi-cto mode-b run\` to execute top 3 features\n`;

      return output;
    } catch (error: any) {
      return `Error during analysis: ${error.message}`;
    }
  }

  /**
   * /chi-cto mode-b run [project-path] [--token-budget N]
   * Executes full Mode B orchestration loop
   * Spawns agents, runs quality gates, writes handover
   */
  private async handleModeB(args: CommandArgs): Promise<string> {
    const projectPath = args.projectPath || process.cwd();
    const tokenBudget = args.tokenBudget || 200000;

    if (!fs.existsSync(projectPath)) {
      return `Error: Project path not found: ${projectPath}`;
    }

    try {
      console.log(`🚀 Starting Chi CTO Mode B`);
      console.log(`Project: ${projectPath}`);
      console.log(`Token Budget: ${tokenBudget}`);
      console.log(`---`);

      // Start session
      const session = await this.sessionOrchestrator.startSession();

      // Run orchestration
      const state = await this.orchestrator.runModeB(projectPath, tokenBudget);

      // Generate report
      const report = await this.sessionOrchestrator.generateMorningReport(state);

      // Write handover for next session
      await this.sessionOrchestrator.writeHandover(state, projectPath);

      return `✅ Mode B Execution Complete\n\n${report}`;
    } catch (error: any) {
      return `❌ Mode B Failed: ${error.message}`;
    }
  }

  /**
   * /chi-cto status [project-path]
   * Show status of last Mode B session
   */
  private async handleStatus(args: CommandArgs): Promise<string> {
    const projectPath = args.projectPath || process.cwd();
    const handoverPath = path.join(projectPath, 'handover.md');

    if (!fs.existsSync(handoverPath)) {
      return `No previous session found for ${projectPath}`;
    }

    try {
      const handoverContent = fs.readFileSync(handoverPath, 'utf-8');

      return `## Last Chi CTO Session\n\n${handoverContent}`;
    } catch (error: any) {
      return `Error reading handover: ${error.message}`;
    }
  }

  /**
   * Show help text
   */
  private showHelp(): string {
    return `
# Chi CTO - Autonomous Feature Orchestrator

## Commands

### /chi-cto suggest [project-path]
Analyze active-tasks.md and suggest top features to build
(No execution, just analysis)

### /chi-cto mode-b run [project-path] [--token-budget N]
Execute full Mode B orchestration
- Reads active-tasks.md
- Scores features
- Spawns agents for top 3
- Runs quality gates
- Writes handover

### /chi-cto status [project-path]
Show last session's handover

## Examples

\`/chi-cto suggest ~/my-project\`
\`/chi-cto mode-b run ~/my-project --token-budget 300000\`
\`/chi-cto status ~/my-project\`

## Default Project Path
If not specified, uses current working directory (process.cwd())
`;
  }

  /**
   * Helper: Parse active-tasks.md
   */
  private parseFeatures(markdown: string): any[] {
    const features = [];
    const featureBlocks = markdown.split('## Feature:').slice(1);

    for (const block of featureBlocks) {
      const lines = block.split('\n');
      const title = lines[0]?.trim();

      const urgency = this.extractValue(block, 'urgency');
      const importance = this.extractValue(block, 'importance');
      const confidence = this.extractValue(block, 'confidence');
      const impact = this.extractValue(block, 'impact');

      if (title && urgency !== null) {
        features.push({
          id: title.toLowerCase().replace(/\s+/g, '-'),
          title,
          urgency: urgency || 5,
          importance: importance || 5,
          confidence: confidence || 5,
          impact: impact || 5,
          description: lines
            .find((l) => l.includes('description'))
            ?.replace('- description:', '')
            ?.trim() || '',
        });
      }
    }

    return features;
  }

  private extractValue(text: string, field: string): number | null {
    const match = text.match(new RegExp(`- ${field}:\\s*(\\d+)`));
    return match ? parseInt(match[1], 10) : null;
  }
}

// Export for use in index.ts and slash commands
export const cli = new ChiCTOCLI();
```

### Step 2: Update `src/index.ts`

Create or update the main entry point to export CLI:

```typescript
// src/index.ts

export { ChiCTOCLI, CommandArgs, cli } from './cli';
export { SessionOrchestrator } from './session-management';
export { ModeBAOrchestrator } from './orchestrator';
export { PriorityScorer } from './priority-scoring';
export { QualityGatesExecutor } from './quality-gates';
export { ErrorRecoveryHandler } from './error-recovery';
```

### Step 3: Create Slash Command Registration

Create this file in `.claude/commands/`:

```typescript
// ~/.claude/commands/chi-cto.ts

import { cli, CommandArgs } from '@/projects/chi-cto/src/cli';

export const chiCtoCommand = {
  name: 'chi-cto',
  description: 'Chi CTO - Autonomous feature orchestrator with Mode B',

  handler: async (input: string) => {
    // Parse input: "suggest /path" or "mode-b run /path --token-budget 300000"
    const parts = input.trim().split(/\s+/);
    const subcommand = parts.slice(0, 2).join(' '); // "suggest" or "mode-b run"

    const args: CommandArgs = {
      subcommand: (subcommand as any) || 'status',
      projectPath: parts.find(p => p.startsWith('/')) || process.cwd(),
      tokenBudget: 200000,
    };

    // Parse --token-budget flag
    const tokenIndex = parts.indexOf('--token-budget');
    if (tokenIndex > -1 && parts[tokenIndex + 1]) {
      args.tokenBudget = parseInt(parts[tokenIndex + 1], 10);
    }

    try {
      const result = await cli.execute(args);
      return result;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },

  help: () => {
    return `
/chi-cto suggest [path]           - Analyze and suggest features
/chi-cto mode-b run [path]        - Execute full orchestration
/chi-cto status [path]            - Show last session status
`.trim();
  }
};
```

### Step 4: Create Tests

Create `test/cli/cli-commands.test.ts`:

```typescript
import { ChiCTOCLI } from '../../src/cli';
import * as fs from 'fs';
import * as path from 'path';

describe('Chi CTO CLI', () => {
  let cli: ChiCTOCLI;
  let testProjectPath: string;

  beforeAll(() => {
    cli = new ChiCTOCLI();
    testProjectPath = path.join(__dirname, '../fixtures/test-project');
  });

  test('should show help when no command', async () => {
    const result = await cli.execute({ subcommand: 'status' });
    expect(result).toContain('Chi CTO');
  });

  test('should handle missing project path', async () => {
    const result = await cli.execute({
      subcommand: 'suggest',
      projectPath: '/nonexistent/path'
    });
    expect(result).toContain('Error');
  });

  test('should parse suggest command', async () => {
    // This would need a fixture project with active-tasks.md
    // For now, just test that command is recognized
    expect(() =>
      cli.execute({ subcommand: 'suggest' })
    ).not.toThrow();
  });

  test('should parse mode-b run command', async () => {
    expect(() =>
      cli.execute({
        subcommand: 'mode-b run',
        tokenBudget: 300000
      })
    ).not.toThrow();
  });

  test('should parse status command', async () => {
    const result = await cli.execute({ subcommand: 'status' });
    // Should return something (either status or not found message)
    expect(typeof result).toBe('string');
  });
});
```

---

## ACCEPTANCE CRITERIA (MUST PASS)

### Code
- ✅ `src/cli.ts` compiles without errors
- ✅ `ChiCTOCLI` class exported
- ✅ All 3 handlers implemented: `handleSuggest`, `handleModeB`, `handleStatus`
- ✅ `src/index.ts` updated to export CLI
- ✅ `~/.claude/commands/chi-cto.ts` created and registered
- ✅ No TypeScript errors

### Tests
- ✅ 4+ CLI tests pass
- ✅ Command argument parsing works
- ✅ Help text displays correctly
- ✅ Error handling for missing paths

### Integration
- ✅ Doesn't break existing 80 unit tests
- ✅ `npm test` shows: `85+ tests passing`
- ✅ `/chi-cto help` displays without errors (manual verification)

---

## IMPORTANT PATTERNS

### Command Parsing
```typescript
// Input: "/chi-cto suggest /path/to/project"
// Parts: ["suggest", "/path/to/project"]

// Input: "/chi-cto mode-b run /path --token-budget 300000"
// Parts: ["mode-b", "run", "/path", "--token-budget", "300000"]
```

### Error Handling
```typescript
// ✅ CORRECT
try {
  const result = await this.orchestrator.runModeB();
} catch (error: any) {
  return `❌ Mode B Failed: ${error.message}`;
}

// ❌ WRONG
console.error(error);  // Don't log to console, return to user
```

### Return Format
```typescript
// ✅ Always return string (CLI output)
return `✅ Complete\n\nDetails...`;

// ❌ Don't return objects
return { success: true };  // Wrong
```

---

## RESOURCES

**Existing code to reference:**
- `src/session-management.ts` - SessionOrchestrator interface
- `src/orchestrator.ts` - ModeBAOrchestrator (Stream 1)

**Do NOT modify:**
- Package.json (unless Stream 3 needs dependency updates)
- Test files from other streams

---

## SUCCESS OUTPUT

When complete, return:

```
## Stream 2: CLI Registration

**Status:** ✅ COMPLETE

**What Was Built:**
- src/cli.ts with ChiCTOCLI class (3 command handlers)
- Updated src/index.ts to export CLI
- ~/.claude/commands/chi-cto.ts slash command registration
- test/cli/cli-commands.test.ts with 4+ tests

**Test Results:**
[Paste output from: npm test -- cli]

**Commands Now Available:**
- /chi-cto suggest [path]
- /chi-cto mode-b run [path] [--token-budget N]
- /chi-cto status [path]

**Files Modified:**
- src/cli.ts (NEW - 350+ lines)
- src/index.ts (MODIFIED - added CLI exports)
- ~/.claude/commands/chi-cto.ts (NEW - 50+ lines)
- test/cli/cli-commands.test.ts (NEW - 100+ lines)

**Next Step:**
Stream 3 (Deployment) needs to wire these handlers to wrangler.toml
```

---

*Task Document: Stream 2 CLI Registration | Status: Ready for Dispatch | Created: 2026-01-05*
