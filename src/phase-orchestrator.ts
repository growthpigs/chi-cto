// src/phase-orchestrator.ts
// Phase Orchestrator for Chi CTO
// Uses existing A-F command system - doesn't reinvent docs

import * as fs from 'fs';
import * as path from 'path';

/**
 * Project phases in order (A-F system)
 * Each phase has required docs that gate progression
 */
export const PHASES = [
  {
    id: 'P',
    name: 'Product Discovery',
    command: '/P-1-mvp-prd',
    requiredDocs: ['docs/01-product/MVP-PRD.md'],
    description: 'MVP definition from raw idea',
    optional: true // Can skip to B if requirements are clear
  },
  {
    id: 'B1',
    name: 'Vision',
    command: '/B-1-vision',
    requiredDocs: ['docs/01-product/VISION.md'],
    description: 'What we\'re building and why'
  },
  {
    id: 'B2',
    name: 'Scope',
    command: '/B-2-scope',
    requiredDocs: ['docs/01-product/SCOPE.md'],
    description: 'What\'s IN, what\'s OUT'
  },
  {
    id: 'B3',
    name: 'Risks',
    command: '/B-3-risks',
    requiredDocs: ['docs/05-planning/RISK-REGISTER.md'],
    description: 'Blockers, dependencies, mitigations'
  },
  {
    id: 'D1',
    name: 'SpecKit Init',
    command: '/D-1-speckit-init',
    requiredDocs: [
      'docs/01-product/PRD.md',
      'docs/04-technical/DATA-MODEL.md',
      'docs/04-technical/API-CONTRACTS.md',
      'docs/04-technical/TECH-STACK.md'
    ],
    description: 'Full technical specs'
  },
  {
    id: 'D2',
    name: 'Feature Specs',
    command: '/D-2-speckit-feature',
    requiredDocs: ['features/INDEX.md'],
    description: 'Per-feature living documents',
    repeatable: true // Run for each feature
  },
  {
    id: 'READY',
    name: 'Ready to Build',
    command: null, // No command - spawn workers
    requiredDocs: [], // Already checked in D2
    description: 'All specs done, spawn parallel workers'
  }
] as const;

export type PhaseId = typeof PHASES[number]['id'];

export interface PhaseStatus {
  projectPath: string;
  projectName: string;
  currentPhase: PhaseId;
  completedPhases: PhaseId[];
  missingDocs: string[];
  nextCommand: string | null;
  canSpawn: boolean;
  features: string[]; // Features ready to build
}

/**
 * Detect current phase by checking which docs exist
 */
export function detectPhase(projectPath: string): PhaseStatus {
  const projectName = path.basename(projectPath);
  const completedPhases: PhaseId[] = [];
  let currentPhase: PhaseId = 'P';
  let missingDocs: string[] = [];
  let nextCommand: string | null = '/P-1-mvp-prd';

  // Check each phase in order
  for (const phase of PHASES) {
    if (phase.id === 'READY') break; // Don't check READY phase docs

    const allDocsExist = phase.requiredDocs.every(doc => {
      const fullPath = path.join(projectPath, doc);
      return fs.existsSync(fullPath);
    });

    if (allDocsExist) {
      completedPhases.push(phase.id);
    } else {
      // This is where we stopped
      currentPhase = phase.id;
      missingDocs = phase.requiredDocs.filter(doc => {
        const fullPath = path.join(projectPath, doc);
        return !fs.existsSync(fullPath);
      });
      nextCommand = phase.command;
      break;
    }
  }

  // If all phases complete, we're ready to build
  const allPhasesComplete = completedPhases.includes('D2') ||
    (completedPhases.includes('D1') && hasFeatureSpecs(projectPath));

  if (allPhasesComplete) {
    currentPhase = 'READY';
    nextCommand = null;
    missingDocs = [];
  }

  // Get features ready to build
  const features = getFeatures(projectPath);

  return {
    projectPath,
    projectName,
    currentPhase,
    completedPhases,
    missingDocs,
    nextCommand,
    canSpawn: currentPhase === 'READY',
    features
  };
}

/**
 * Check if project has feature specs
 */
function hasFeatureSpecs(projectPath: string): boolean {
  const featuresDir = path.join(projectPath, 'features');
  if (!fs.existsSync(featuresDir)) return false;

  const files = fs.readdirSync(featuresDir);
  return files.some(f => f.endsWith('.md') && f !== 'INDEX.md');
}

/**
 * Get list of features from features/ directory
 */
function getFeatures(projectPath: string): string[] {
  const featuresDir = path.join(projectPath, 'features');
  if (!fs.existsSync(featuresDir)) return [];

  const files = fs.readdirSync(featuresDir);
  return files
    .filter(f => f.endsWith('.md') && f !== 'INDEX.md')
    .map(f => f.replace('.md', ''));
}

/**
 * Get parallelizable tasks from feature specs
 * Parses ## Task: sections from feature files
 */
export function getParallelTasks(projectPath: string): Array<{
  feature: string;
  name: string;
  description: string;
  parallel: boolean;
}> {
  const tasks: Array<{
    feature: string;
    name: string;
    description: string;
    parallel: boolean;
  }> = [];

  const featuresDir = path.join(projectPath, 'features');
  if (!fs.existsSync(featuresDir)) return tasks;

  const files = fs.readdirSync(featuresDir)
    .filter(f => f.endsWith('.md') && f !== 'INDEX.md');

  for (const file of files) {
    const feature = file.replace('.md', '');
    const content = fs.readFileSync(path.join(featuresDir, file), 'utf-8');

    // Parse ## Task: sections
    const taskBlocks = content.split(/^## Task:\s*/m).slice(1);

    for (const block of taskBlocks) {
      const lines = block.split('\n');
      const name = lines[0].trim();

      // Extract description
      const descMatch = block.match(/- description:\s*(.+)/i);
      const description = descMatch ? descMatch[1].trim() : name;

      // Check if parallelizable (default true if not specified)
      const parallelMatch = block.match(/- parallel:\s*(true|false|yes|no)/i);
      const parallel = !parallelMatch ||
        ['true', 'yes'].includes(parallelMatch[1].toLowerCase());

      tasks.push({ feature, name, description, parallel });
    }
  }

  return tasks;
}

/**
 * Generate status report for display
 */
export function getPhaseReport(status: PhaseStatus): string {
  let report = `\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `📋 Chi CTO Phase Status: ${status.projectName}\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Show phase progress
  report += `Phase Progress:\n\n`;

  for (const phase of PHASES) {
    const isComplete = status.completedPhases.includes(phase.id);
    const isCurrent = status.currentPhase === phase.id;

    let icon = '⬜';
    let statusText = '';

    if (isComplete) {
      icon = '✅';
      statusText = 'Complete';
    } else if (isCurrent) {
      icon = '🔶';
      statusText = '← CURRENT';
    } else {
      icon = '⬜';
      statusText = '';
    }

    if (phase.id === 'READY') {
      if (status.canSpawn) {
        icon = '🚀';
        statusText = 'READY TO BUILD';
      }
    }

    report += `  ${icon} ${phase.id}: ${phase.name} ${statusText}\n`;
    if (phase.command && isCurrent) {
      report += `     Command: ${phase.command}\n`;
    }
  }

  report += `\n`;

  // Show next action
  if (status.canSpawn) {
    report += `🚀 All specs complete! Ready to spawn workers.\n\n`;

    if (status.features.length > 0) {
      report += `Features to build:\n`;
      status.features.forEach(f => {
        report += `  - ${f}\n`;
      });
      report += `\n`;
    }

    report += `Run: chi-cto spawn ${status.projectPath}\n`;
  } else {
    report += `📝 Next Step: Run ${status.nextCommand}\n`;

    if (status.missingDocs.length > 0) {
      report += `\nMissing docs:\n`;
      status.missingDocs.forEach(doc => {
        report += `  - ${doc}\n`;
      });
    }

    report += `\nThis command will create the required documents.\n`;
    report += `After approval, Chi CTO will proceed to the next phase.\n`;
  }

  report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return report;
}

/**
 * Mark a phase as approved (creates approval marker file)
 */
export function approvePhase(projectPath: string, phaseId: PhaseId): boolean {
  const approvalDir = path.join(projectPath, '.chi-cto', 'approvals');

  if (!fs.existsSync(approvalDir)) {
    fs.mkdirSync(approvalDir, { recursive: true });
  }

  const approvalFile = path.join(approvalDir, `${phaseId}.approved`);
  fs.writeFileSync(approvalFile, new Date().toISOString(), 'utf-8');

  return true;
}

/**
 * Check if a phase is approved
 */
export function isPhaseApproved(projectPath: string, phaseId: PhaseId): boolean {
  const approvalFile = path.join(projectPath, '.chi-cto', 'approvals', `${phaseId}.approved`);
  return fs.existsSync(approvalFile);
}
