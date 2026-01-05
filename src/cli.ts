// src/cli.ts
// CLI command handlers for Chi CTO

import { SessionOrchestrator } from './session-management';
import { ModeBAOrchestrator, OrchestratorResult } from './orchestrator';
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
  private sessionOrchestrator: SessionOrchestrator;

  constructor() {
    // Initialize with default config - will be overridden by command args
    this.sessionOrchestrator = new SessionOrchestrator({
      projectPath: process.cwd(),
      tokenBudget: 200000,
      tokenThreshold: 70,
      features: []
    });
  }

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
      // Read and parse features
      const markdown = fs.readFileSync(activeTasksPath, 'utf-8');
      const features = this.parseFeatures(markdown);

      if (features.length === 0) {
        return `No features found in active-tasks.md`;
      }

      // Score and rank using PriorityScorer
      const { PriorityScorer } = require('./priority-scoring');
      const scorer = new PriorityScorer();
      const scoredFeatures = features.map((f: any) => {
        const baseScore = scorer.calculateBaseScore(f);
        const { finalScore, reason } = scorer.applyMultiplier(f, baseScore);
        return {
          ...f,
          baseScore,
          finalScore,
          reason
        };
      });

      const ranked = scoredFeatures
        .sort((a: any, b: any) => b.finalScore - a.finalScore)
        .slice(0, 5);

      // Format suggestion output
      let output = `## Chi CTO Analysis for ${projectPath}\n\n`;
      output += `**Confidence:** 9/10\n**Mode:** Suggestion (no execution)\n\n`;
      output += `### Top 5 Priority Features\n\n`;

      ranked.forEach((feature: any, i: number) => {
        output += `${i + 1}. **${feature.title}** (Score: ${feature.finalScore}/40)\n`;
        output += `   - Urgency: ${feature.urgency}, Importance: ${feature.importance}\n`;
        output += `   - Confidence: ${feature.confidence}, Impact: ${feature.impact}\n`;
        output += `   - Reason: ${feature.reason}\n`;
        if (feature.description) {
          output += `   - Description: ${feature.description}\n`;
        }
        output += '\n';
      });

      output += `### Next Steps\n`;
      output += `Run \`/chi-cto mode-b run ${projectPath}\` to execute top 3 features\n`;

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
      const output: string[] = [];
      output.push(`🚀 Starting Chi CTO Mode B`);
      output.push(`Project: ${projectPath}`);
      output.push(`Token Budget: ${tokenBudget}`);
      output.push(`---`);

      // Create session orchestrator with project config
      const sessionOrchestrator = new SessionOrchestrator({
        projectPath,
        tokenBudget,
        tokenThreshold: 70,
        features: []
      });

      // Start session
      const session = await sessionOrchestrator.startSession();
      output.push(`✅ Session started: ${session.sessionId}`);

      // Run orchestration
      const orchestratorResult = await this.orchestrator.runModeB(projectPath, tokenBudget);
      output.push(`✅ Orchestration complete`);

      // Extract state and report from orchestrator result
      const state = orchestratorResult.state;

      // Use the report generated by the orchestrator
      // (handover is already written by the orchestrator)
      output.push('');
      output.push(orchestratorResult.report);

      return output.join('\n');
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
          name: title,
          urgency: urgency || 5,
          importance: importance || 5,
          confidence: confidence || 5,
          impact: impact || 5,
          description:
            lines
              .find((l) => l.includes('description'))
              ?.replace('- description:', '')
              ?.trim() || ''
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
