#!/usr/bin/env node

/**
 * Local CLI Entry Point for Chi CTO
 *
 * This runs the orchestrator locally (not on Cloudflare).
 * Cloudflare can only serve as a reference/documentation endpoint.
 *
 * Usage:
 *   npx ts-node src/cli-local.ts suggest ~/my-project
 *   npx ts-node src/cli-local.ts mode-b ~/my-project --token-budget 300000
 *   npx ts-node src/cli-local.ts status ~/my-project
 */

import * as fs from 'fs';
import * as path from 'path';
import { cli } from './index';
import { CommandArgs } from './cli';

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  try {
    // Parse arguments
    const commandArgs = parseArgs(args);

    // Execute command
    const result = await cli.execute(commandArgs);

    // Output result
    console.log(result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Parse command-line arguments
 */
function parseArgs(args: string[]): CommandArgs {
  const subcommand = args[0];
  let projectPath: string | undefined;
  let tokenBudget: number | undefined;

  // Validate subcommand
  if (!['suggest', 'mode-b', 'status'].includes(subcommand)) {
    throw new Error(`Unknown command: ${subcommand}`);
  }

  // Handle 'mode-b run' (two-word subcommand)
  if (subcommand === 'mode-b') {
    if (args[1] !== 'run') {
      throw new Error('Expected: mode-b run [path]');
    }
    projectPath = args[2] || process.cwd();

    // Look for --token-budget flag
    const budgetIdx = args.indexOf('--token-budget');
    if (budgetIdx > -1 && args[budgetIdx + 1]) {
      tokenBudget = parseInt(args[budgetIdx + 1], 10);
    }

    return {
      subcommand: 'mode-b run' as const,
      projectPath: expandPath(projectPath),
      tokenBudget
    };
  }

  // Handle single-word subcommands
  projectPath = args[1] || process.cwd();

  return {
    subcommand: subcommand as 'suggest' | 'mode-b run' | 'status',
    projectPath: expandPath(projectPath)
  };
}

/**
 * Expand ~ to home directory
 */
function expandPath(filePath: string): string {
  if (filePath.startsWith('~')) {
    return filePath.replace('~', process.env.HOME || '/root');
  }
  return path.resolve(filePath);
}

/**
 * Show help text
 */
function showHelp() {
  console.log(`
Chi CTO - Autonomous Feature Orchestrator

USAGE:
  chi-cto <command> [options]

COMMANDS:
  suggest [path]              Analyze and suggest top features
                              Usage: chi-cto suggest ~/my-project

  mode-b run [path] [opts]    Execute full orchestration
                              Usage: chi-cto mode-b run ~/my-project
                              Options: --token-budget 300000

  status [path]               Show last session status
                              Usage: chi-cto status ~/my-project

EXAMPLES:
  # Analyze features
  chi-cto suggest ~/my-project

  # Execute with custom token budget
  chi-cto mode-b run ~/my-project --token-budget 500000

  # Check last session
  chi-cto status ~/my-project

DOCUMENTATION:
  Full guide: docs/RUNBOOK.md
  Architecture: src/orchestrator.ts
  Tests: npm test

NOTE:
  This CLI runs locally on your machine.
  It requires: Node.js 16+, Git, npm/yarn, Jest, ESLint

  For REST API access, use Cloudflare Worker (reference only):
  https://chi-cto.roderic-andrews.workers.dev/health

  But note: Cloudflare cannot access your filesystem,
  so the REST API cannot execute orchestration.
  Use this local CLI for actual feature building.
`);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { parseArgs, expandPath };
