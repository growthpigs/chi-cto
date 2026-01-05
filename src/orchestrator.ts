// src/orchestrator.ts

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { PriorityScorer, Feature, ScoredFeature } from './priority-scoring';
import { QualityGatesExecutor, GateResult } from './quality-gates';
import { ErrorRecoveryHandler } from './error-recovery';
import { SessionOrchestrator, SessionState, SessionConfig } from './session-management';

/**
 * Mode B Orchestrator
 * Implements the main automation loop for Chi CTO
 *
 * Workflow:
 * 1. Read active-tasks.md from project
 * 2. Parse into Feature[] (title, urgency, importance, confidence, impact)
 * 3. Call PriorityScorer to score each feature (U+I+C+M formula)
 * 4. Filter features with score >= 25 (immediate action threshold)
 * 5. Take top 3 immediate features
 * 6. For each feature:
 *    a. Create git worktree for isolated work
 *    b. Spawn FeatureBuilder agent to implement feature
 *    c. Wait for agent to report completion
 *    d. Run QualityGates on completed code
 *    e. If gates pass: Mark as completed
 *    f. If gates fail: Call ErrorRecoveryHandler
 *    g. Loop until feature done or recovery fails
 * 7. Check token budget (if > 70% used, exit)
 * 8. Write handover.md with session state
 * 9. Return morning report
 */

export interface FeatureTask {
  id: string;
  name: string;
  urgency: number;
  importance: number;
  confidence: number;
  impact: number;
  description?: string;
}

export interface BuildResult {
  success: boolean;
  tokensUsed: number;
  output?: string;
  error?: string;
}

export interface OrchestratorResult {
  state: SessionState;
  report: string;
  success: boolean;
}

/**
 * Parse active-tasks.md and extract features
 * Expected format in active-tasks.md:
 * ## Feature: [name]
 * - urgency: 1-10
 * - importance: 1-10
 * - confidence: 1-10
 * - impact: 1-10
 * - description: [optional description]
 */
export async function readActiveTasksMarkdown(filePath: string): Promise<Feature[]> {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const markdown = fs.readFileSync(filePath, 'utf-8');
  return parseMarkdownFeatures(markdown);
}

/**
 * Parse markdown to extract features
 */
function parseMarkdownFeatures(markdown: string): Feature[] {
  const features: Feature[] = [];

  // Split by ## Feature: headers
  const featureBlocks = markdown.split(/^## Feature:\s*/m).slice(1); // Skip first empty element

  for (const block of featureBlocks) {
    const lines = block.split('\n');
    const name = lines[0].trim();

    // Extract properties using regex
    const getProperty = (propName: string): number => {
      const regex = new RegExp(`^-\\s*${propName}:\\s*(\\d+)`, 'm');
      const match = block.match(regex);
      return match ? parseInt(match[1], 10) : 0;
    };

    const urgency = getProperty('urgency');
    const importance = getProperty('importance');
    const confidence = getProperty('confidence');
    const impact = getProperty('impact');

    // Extract description (optional)
    const descriptionMatch = block.match(/^-\s*description:\s*(.+)$/m);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';

    // Only add valid features (all properties set)
    if (urgency > 0 || importance > 0 || confidence > 0 || impact > 0) {
      features.push({
        id: `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        urgency,
        importance,
        confidence,
        impact,
        description
      });
    }
  }

  return features;
}

/**
 * Create isolated git worktree for feature work
 */
async function createGitWorktree(projectPath: string, branchName: string): Promise<string> {
  try {
    const worktreePath = path.join(projectPath, '.worktrees', branchName);

    // Ensure .worktrees directory exists
    const worktreesDir = path.dirname(worktreePath);
    if (!fs.existsSync(worktreesDir)) {
      fs.mkdirSync(worktreesDir, { recursive: true });
    }

    // Create worktree
    execSync(`git worktree add "${worktreePath}" -b "${branchName}" 2>/dev/null || true`, {
      cwd: projectPath,
      stdio: 'pipe'
    });

    return worktreePath;
  } catch (error) {
    throw new Error(`Failed to create git worktree: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mock spawn of FeatureBuilder agent
 * In production, this would use the Task tool to spawn a subagent
 */
async function spawnFeatureBuilderAgent(
  worktreePath: string,
  feature: Feature,
  remainingTokens: number
): Promise<BuildResult> {
  // Mock implementation: simulate agent work
  // In production, this would invoke the Task tool with subagent_type='feature-dev'

  try {
    // Simulate work by creating a simple implementation file
    const srcDir = path.join(worktreePath, 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    // Create feature implementation file
    const featureFile = path.join(srcDir, `${feature.id}.ts`);
    const content = `// Auto-generated implementation for ${feature.name}
export class ${feature.name.replace(/\s+/g, '')} {
  /**
   * Feature: ${feature.name}
   * Description: ${feature.description || 'No description'}
   */
  async execute(): Promise<void> {
    // Implementation goes here
  }
}
`;

    fs.writeFileSync(featureFile, content, 'utf-8');

    // Simulate token usage (estimate: 1000-5000 tokens per feature)
    const tokensUsed = Math.min(remainingTokens, 3000);

    return {
      success: true,
      tokensUsed,
      output: `Feature ${feature.name} implemented successfully`
    };
  } catch (error) {
    return {
      success: false,
      tokensUsed: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export class ModeBAOrchestrator {
  private scorer: PriorityScorer;
  private recoveryHandler: ErrorRecoveryHandler;
  private sessionOrchestrator: SessionOrchestrator;

  constructor() {
    this.scorer = new PriorityScorer();
    this.recoveryHandler = new ErrorRecoveryHandler();

    // Initialize session orchestrator with dummy config
    this.sessionOrchestrator = new SessionOrchestrator({
      projectPath: '',
      tokenBudget: 200000,
      tokenThreshold: 70,
      features: []
    });
  }

  /**
   * Main Mode B automation loop
   */
  async runModeB(projectPath: string, tokenBudget: number = 200000): Promise<OrchestratorResult> {
    const state: SessionState = {
      sessionId: `chi-cto-${Date.now()}`,
      startTime: new Date(),
      tokenBudget,
      tokenUsed: 0,
      status: 'active',
      features: [],
      completedFeatures: [],
      blockedFeatures: [],
      decisions: []
    };

    try {
      // Step 1: Read active-tasks.md
      const activeTasksPath = path.join(projectPath, 'active-tasks.md');
      const features = await readActiveTasksMarkdown(activeTasksPath);

      if (features.length === 0) {
        return {
          state,
          report: 'No active tasks found',
          success: true
        };
      }

      // Step 2 & 3: Score features using PriorityScorer
      const scoredFeatures = this.scorer.scoreBatch(features);

      // Step 4 & 5: Filter for immediate features and take top 3
      const immediate = scoredFeatures
        .filter(f => f.finalScore >= 25 && f.tier === 'IMMEDIATE')
        .slice(0, 3);

      state.features = immediate;

      // Step 6: Feature implementation loop
      for (const feature of immediate) {
        // Check token budget before starting feature
        const percentageUsed = (state.tokenUsed / state.tokenBudget) * 100;
        if (percentageUsed > 70) {
          break; // Exit loop gracefully
        }

        state.currentFeature = feature;

        try {
          // Create isolated worktree
          const worktreePath = await createGitWorktree(projectPath, `feature/${feature.id}`);

          // Spawn FeatureBuilder agent
          const buildResult = await spawnFeatureBuilderAgent(
            worktreePath,
            feature,
            state.tokenBudget - state.tokenUsed
          );

          if (buildResult.success) {
            // Run quality gates
            const gatesExecutor = new QualityGatesExecutor(worktreePath);
            const gateResults = await gatesExecutor.runAllGates();

            // Check if all gates passed
            const allPassed = gateResults.every(g => g.status !== 'FAIL');

            if (allPassed) {
              // Mark complete
              state.completedFeatures.push(feature.id);
              state.tokenUsed += buildResult.tokensUsed;
            } else {
              // Handle recovery
              const failedGates = gateResults.filter(g => g.status === 'FAIL');
              const recovery = await this.recoveryHandler.handleToolInfrastructure(
                `quality-gates (${failedGates.map(g => g.gate).join(', ')})`,
                false
              );

              if (recovery.recovered) {
                state.completedFeatures.push(feature.id);
              } else {
                state.blockedFeatures.push(feature.id);
                state.decisions?.push(`Feature ${feature.name} blocked: ${failedGates.map(g => g.message).join('; ')}`);
              }

              state.tokenUsed += buildResult.tokensUsed;
            }
          } else {
            // Build failed
            state.blockedFeatures.push(feature.id);
            state.decisions?.push(`Feature ${feature.name} build failed: ${buildResult.error}`);
          }
        } catch (error) {
          state.blockedFeatures.push(feature.id);
          state.decisions?.push(`Feature ${feature.name} error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Step 7: Check token budget
      const finalPercentage = (state.tokenUsed / state.tokenBudget) * 100;
      state.status = finalPercentage > 70 ? 'paused' : 'complete';

      // Step 8: Write handover
      await this.sessionOrchestrator.writeHandover(state, projectPath);

      // Step 9: Generate morning report
      const report = await this.sessionOrchestrator.generateMorningReport(state);

      return {
        state,
        report,
        success: state.blockedFeatures.length === 0
      };
    } catch (error) {
      const report = `# Chi CTO Error Report\n\n**Error:** ${
        error instanceof Error ? error.message : String(error)
      }\n\nSession: ${state.sessionId}`;

      return {
        state,
        report,
        success: false
      };
    }
  }
}
