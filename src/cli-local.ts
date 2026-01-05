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
import {
  spawnWorkers,
  validateEnvironment,
  verifyWarpReady,
  SpawnResult
} from './warp-spawner';
import {
  createWorkerTrackers,
  pollWorkers,
  consolidateResults,
  generateConsolidatedSitrep,
  initWorkersDirectory,
  allWorkersComplete
} from './worker-monitor';
import { readActiveTasksMarkdown } from './orchestrator';
import { PriorityScorer } from './priority-scoring';

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
    const subcommand = args[0];

    // Handle spawn command
    if (subcommand === 'spawn') {
      await handleSpawn(args);
      process.exit(0);
    }

    // Handle workers commands
    if (subcommand === 'workers') {
      await handleWorkers(args);
      process.exit(0);
    }

    // Parse arguments for standard commands
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
 * Handle spawn command - spawn parallel workers in Warp tabs
 */
async function handleSpawn(args: string[]) {
  // Parse arguments: spawn [path] --workers N
  const projectPath = expandPath(args[1] || process.cwd());
  let workerCount = 3; // Default

  const workersIdx = args.indexOf('--workers');
  if (workersIdx > -1 && args[workersIdx + 1]) {
    workerCount = parseInt(args[workersIdx + 1], 10);
  }

  console.log(`🚀 Chi CTO Parallel Worker Spawner\n`);

  // Validate environment
  const envCheck = validateEnvironment();
  if (!envCheck.valid) {
    console.error('❌ Environment validation failed:');
    envCheck.errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }

  console.log(`✅ Environment validated (macOS + Warp)`);

  // Verify exactly ONE Warp window is open and focused
  const warpCheck = await verifyWarpReady();
  if (!warpCheck.ready) {
    console.error('❌ Warp validation failed:');
    warpCheck.errors.forEach(e => console.error(`   - ${e}`));
    console.log('\n📋 Instructions:');
    console.log('   1. Close all Warp windows except ONE');
    console.log('   2. Make sure this Warp window is visible and focused');
    console.log('   3. Run chi-cto spawn again\n');
    process.exit(1);
  }
  console.log('✅ Warp validated (1 window, focused, ready)');

  console.log(`📁 Project: ${projectPath}`);
  console.log(`👷 Workers to spawn: ${workerCount}\n`);

  // Read and score features
  const activeTasksPath = path.join(projectPath, 'active-tasks.md');
  const features = await readActiveTasksMarkdown(activeTasksPath);

  if (features.length === 0) {
    console.log('⚠️  No features found in active-tasks.md');
    console.log('   Create features in the format:');
    console.log('   ## Feature: Name');
    console.log('   - urgency: 1-10');
    console.log('   - importance: 1-10');
    console.log('   - confidence: 1-10');
    console.log('   - impact: 1-10');
    process.exit(0);
  }

  // Score and filter features
  const scorer = new PriorityScorer();
  const scored = scorer.scoreBatch(features);
  const immediate = scored
    .filter(f => f.tier === 'IMMEDIATE')
    .slice(0, workerCount);

  if (immediate.length === 0) {
    console.log('⚠️  No IMMEDIATE tier features found (score >= 25)');
    console.log('   Top features:');
    scored.slice(0, 3).forEach(f => {
      console.log(`   - ${f.name}: ${f.finalScore}/40 (${f.tier})`);
    });
    process.exit(0);
  }

  console.log(`📋 Features to build (${immediate.length}):`);
  immediate.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.name} (score: ${f.finalScore}/40)`);
  });
  console.log('');

  // Initialize workers directory
  initWorkersDirectory(projectPath);

  // Spawn workers
  console.log('🔄 Spawning Warp tabs...\n');
  const results = await spawnWorkers(
    projectPath,
    immediate.map(f => ({ name: f.name, description: f.description }))
  );

  // Report results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Spawned ${successful.length} workers:`);
  successful.forEach(r => {
    console.log(`   - ${r.workerId}`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed to spawn ${failed.length} workers:`);
    failed.forEach(r => {
      console.log(`   - ${r.workerId}: ${r.error}`);
    });
  }

  // Verify workers actually started (post-spawn verification)
  if (successful.length > 0) {
    console.log(`\n⏳ Waiting 5 seconds for workers to initialize...`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log(`\n🔍 Checking worker status files...`);
    let workersWithStatus = 0;

    for (const result of successful) {
      const statusPath = path.join(projectPath, '.chi-cto', 'workers', result.workerId, 'status.json');
      if (fs.existsSync(statusPath)) {
        workersWithStatus++;
        console.log(`   ✅ ${result.workerId} - status file exists`);
      } else {
        console.log(`   ⚠️  ${result.workerId} - no status file yet`);
      }
    }

    if (workersWithStatus === 0) {
      console.log(`\n⚠️  WARNING: No workers have written status files.`);
      console.log(`   Check Warp tabs to see if workers started correctly.\n`);
    }
  }

  console.log(`\n📊 To monitor progress: chi-cto workers status ${projectPath}`);
  console.log(`📦 To consolidate results: chi-cto workers consolidate ${projectPath}`);
}

/**
 * Handle workers subcommands (status, consolidate)
 */
async function handleWorkers(args: string[]) {
  const subcommand = args[1];
  const projectPath = expandPath(args[2] || process.cwd());

  if (subcommand === 'status') {
    await handleWorkersStatus(projectPath);
  } else if (subcommand === 'consolidate') {
    await handleWorkersConsolidate(projectPath);
  } else {
    console.error(`Unknown workers subcommand: ${subcommand}`);
    console.log('Usage: chi-cto workers [status|consolidate] [path]');
    process.exit(1);
  }
}

/**
 * Show status of all workers
 */
async function handleWorkersStatus(projectPath: string) {
  console.log(`📊 Chi CTO Worker Status\n`);
  console.log(`📁 Project: ${projectPath}\n`);

  const workersDir = path.join(projectPath, '.chi-cto', 'workers');

  if (!fs.existsSync(workersDir)) {
    console.log('⚠️  No workers directory found');
    console.log('   Run: chi-cto spawn [path] to start workers');
    return;
  }

  // List all worker directories
  const workerDirs = fs.readdirSync(workersDir).filter(d => {
    return fs.statSync(path.join(workersDir, d)).isDirectory();
  });

  if (workerDirs.length === 0) {
    console.log('⚠️  No workers found');
    return;
  }

  // Create trackers and poll
  const trackers = workerDirs.map(workerId => {
    const workerPath = path.join(workersDir, workerId);
    return {
      workerId,
      feature: '(unknown)',
      status: 'pending' as const,
      statusPath: path.join(workerPath, 'status.json'),
      handoverPath: path.join(workerPath, 'handover.md')
    };
  });

  const polled = pollWorkers(trackers);

  // Display status
  console.log(`Workers (${polled.length}):\n`);

  polled.forEach(t => {
    const icon = t.status === 'complete' ? '✅' :
                 t.status === 'blocked' ? '❌' :
                 t.status === 'in_progress' ? '🔄' : '⏳';

    console.log(`${icon} ${t.workerId}`);
    if (t.result) {
      console.log(`   Feature: ${t.result.feature}`);
      console.log(`   Status: ${t.result.status}`);
      if (t.result.summary) {
        console.log(`   Summary: ${t.result.summary}`);
      }
    } else {
      console.log(`   Status: ${t.status} (no status file yet)`);
    }
    console.log('');
  });

  // Summary
  const complete = polled.filter(t => t.status === 'complete').length;
  const blocked = polled.filter(t => t.status === 'blocked').length;
  const inProgress = polled.filter(t => t.status === 'in_progress' || t.status === 'pending').length;

  console.log(`Summary: ${complete} complete, ${blocked} blocked, ${inProgress} in progress`);

  if (allWorkersComplete(polled)) {
    console.log('\n✅ All workers finished! Run: chi-cto workers consolidate [path]');
  }
}

/**
 * Consolidate results from all workers
 */
async function handleWorkersConsolidate(projectPath: string) {
  console.log(`📦 Chi CTO Worker Consolidation\n`);
  console.log(`📁 Project: ${projectPath}\n`);

  const workersDir = path.join(projectPath, '.chi-cto', 'workers');

  if (!fs.existsSync(workersDir)) {
    console.log('⚠️  No workers directory found');
    return;
  }

  // List all worker directories
  const workerDirs = fs.readdirSync(workersDir).filter(d => {
    return fs.statSync(path.join(workersDir, d)).isDirectory();
  });

  if (workerDirs.length === 0) {
    console.log('⚠️  No workers found');
    return;
  }

  // Create trackers and poll
  const trackers = workerDirs.map(workerId => {
    const workerPath = path.join(workersDir, workerId);
    return {
      workerId,
      feature: '(unknown)',
      status: 'pending' as const,
      statusPath: path.join(workerPath, 'status.json'),
      handoverPath: path.join(workerPath, 'handover.md')
    };
  });

  const polled = pollWorkers(trackers);

  // Update feature names from status files
  polled.forEach(t => {
    if (t.result?.feature) {
      t.feature = t.result.feature;
    }
  });

  // Check if all complete
  if (!allWorkersComplete(polled)) {
    const inProgress = polled.filter(t => t.status === 'in_progress' || t.status === 'pending').length;
    console.log(`⚠️  ${inProgress} workers still in progress`);
    console.log('   Wait for all workers to complete before consolidating');
    console.log('   Run: chi-cto workers status [path] to check progress');
    return;
  }

  // Consolidate
  const result = consolidateResults(polled);
  const sitrep = generateConsolidatedSitrep(result, polled);

  // Write SITREP to file
  const sitrepPath = path.join(projectPath, '.chi-cto', 'consolidated-sitrep.md');
  fs.writeFileSync(sitrepPath, sitrep, 'utf-8');

  console.log(`✅ Consolidation complete!\n`);
  console.log(`Summary:`);
  console.log(`  - Total workers: ${result.totalWorkers}`);
  console.log(`  - Completed: ${result.completed}`);
  console.log(`  - Blocked: ${result.blocked}`);
  console.log(`  - Files changed: ${result.allFilesChanged.length}`);
  console.log(`  - All tests pass: ${result.allTestsPass ? 'yes' : 'no'}`);
  console.log('');
  console.log(`📄 Full SITREP written to: ${sitrepPath}`);

  // Show summaries
  if (result.summaries.length > 0) {
    console.log('\nWorker summaries:');
    result.summaries.forEach(s => console.log(`  ${s}`));
  }
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

  mode-b run [path] [opts]    Execute full orchestration (sequential)
                              Usage: chi-cto mode-b run ~/my-project
                              Options: --token-budget 300000

  spawn [path] [opts]         Spawn parallel workers in Warp tabs
                              Usage: chi-cto spawn ~/my-project --workers 3
                              Options: --workers N (default: 3)
                              Requires: macOS + Warp terminal

  workers status [path]       Check status of all workers
                              Usage: chi-cto workers status ~/my-project

  workers consolidate [path]  Consolidate results from all workers
                              Usage: chi-cto workers consolidate ~/my-project
                              Generates: .chi-cto/consolidated-sitrep.md

  status [path]               Show last session status
                              Usage: chi-cto status ~/my-project

EXAMPLES:
  # Analyze features
  chi-cto suggest ~/my-project

  # Execute sequentially with custom token budget
  chi-cto mode-b run ~/my-project --token-budget 500000

  # Execute in parallel with 5 Warp workers
  chi-cto spawn ~/my-project --workers 5

  # Monitor parallel workers
  chi-cto workers status ~/my-project

  # Consolidate when all done
  chi-cto workers consolidate ~/my-project

  # Check last session
  chi-cto status ~/my-project

PARALLEL ORCHESTRATION:
  1. spawn - Opens N Warp tabs, each running Claude on a feature
  2. workers status - Poll status files to track progress
  3. workers consolidate - Read SITREPs and aggregate results

  Workers write to: .chi-cto/workers/<worker-id>/status.json
  Final report: .chi-cto/consolidated-sitrep.md

DOCUMENTATION:
  Full guide: docs/RUNBOOK.md
  Architecture: src/orchestrator.ts
  Parallel: features/WARP-PARALLEL-ORCHESTRATION.md
  Tests: npm test

NOTE:
  This CLI runs locally on your machine.
  It requires: Node.js 16+, Git, npm/yarn, Jest, ESLint
  Parallel mode also requires: macOS + Warp terminal
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
