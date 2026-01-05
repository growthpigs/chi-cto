#!/usr/bin/env node

/**
 * Chi CTO Slash Command Handler
 *
 * Usage:
 *   /chi-cto suggest [project-path]
 *   /chi-cto mode-b run [project-path] [--token-budget N]
 *   /chi-cto status [project-path]
 */

import { cli, CommandArgs } from '../../../src/index';
import path from 'path';

export interface SlashCommandInput {
  subcommand?: string;
  projectPath?: string;
  tokenBudget?: number;
}

/**
 * Parse command-line arguments from slash command
 * Examples:
 *   suggest ~/my-project
 *   mode-b run ~/my-project --token-budget 300000
 *   status
 */
function parseArgs(args: string[]): CommandArgs {
  if (args.length === 0) {
    return {
      subcommand: 'suggest',
      projectPath: process.cwd()
    };
  }

  let projectPath: string | undefined;
  let tokenBudget: number | undefined;
  let subcommand: 'suggest' | 'mode-b run' | 'status' = 'suggest';

  // First arg is subcommand
  if (args[0] === 'suggest') {
    subcommand = 'suggest';
    projectPath = args[1] || process.cwd();
  } else if (args[0] === 'mode-b' && args[1] === 'run') {
    subcommand = 'mode-b run';
    projectPath = args[2] || process.cwd();

    // Look for --token-budget flag
    const budgetIdx = args.indexOf('--token-budget');
    if (budgetIdx > -1 && args[budgetIdx + 1]) {
      tokenBudget = parseInt(args[budgetIdx + 1], 10);
    }
  } else if (args[0] === 'status') {
    subcommand = 'status';
    projectPath = args[1] || process.cwd();
  } else {
    // Default: treat first arg as project path for suggest
    subcommand = 'suggest';
    projectPath = args[0];
  }

  // Expand ~ to home directory
  if (projectPath && projectPath.startsWith('~')) {
    projectPath = projectPath.replace('~', process.env.HOME || '');
  }

  return {
    subcommand,
    projectPath,
    tokenBudget
  };
}

/**
 * Main command handler
 */
export async function executeChiCTO(input: string | string[]): Promise<string> {
  const args = typeof input === 'string' ? input.split(/\s+/) : input;

  try {
    const commandArgs = parseArgs(args);
    const result = await cli.execute(commandArgs);
    return result;
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Export for CLI invocation
export default {
  name: 'chi-cto',
  description: 'Chi CTO - Autonomous Feature Orchestrator. Suggests and builds features based on priority.',
  usage: `
chi-cto suggest [project-path]          - Analyze and suggest top features to build
chi-cto mode-b run [project-path]       - Execute full orchestration (build top 3 features)
chi-cto status [project-path]           - Show last session status
  `,
  handler: executeChiCTO
};
