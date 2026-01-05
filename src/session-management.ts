// src/session-management.ts

import * as fs from 'fs';
import * as path from 'path';
import { HandoverBuilder, HandoverData } from './handover';

export interface SessionConfig {
  projectPath: string;
  tokenBudget: number;          // Total tokens available (200k)
  tokenThreshold: number;       // Exit at this % (70%)
  features: any[];              // Features to score and execute
}

export interface SessionState {
  sessionId: string;
  startTime: Date;
  tokenBudget: number;
  tokenUsed: number;
  status: 'active' | 'paused' | 'complete';
  features: any[];              // Scored features
  currentFeature?: any;
  completedFeatures: string[];
  blockedFeatures: string[];
  decisions?: string[];
}

export class SessionOrchestrator {
  constructor(private config: SessionConfig) {}

  /**
   * Start new session
   * 1. Create worktree
   * 2. Score all features
   * 3. Pick top 3 (IMMEDIATE tier: ≥25)
   * 4. Initialize session state
   */
  async startSession(): Promise<SessionState> {
    const sessionId = `chi-cto-${Date.now()}`;

    // Score features (calls Priority Scoring module)
    // For now, assume features have a score property
    const scoredFeatures = this.config.features.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Filter for IMMEDIATE tier (score >= 25)
    const immediateFeatures = scoredFeatures.filter(f => (f.score || 0) >= 25).slice(0, 3);

    const sessionState: SessionState = {
      sessionId,
      startTime: new Date(),
      tokenBudget: this.config.tokenBudget,
      tokenUsed: 0,
      status: 'active',
      features: immediateFeatures,
      completedFeatures: [],
      blockedFeatures: [],
      decisions: []
    };

    return sessionState;
  }

  /**
   * Resume session from handover.md
   * 1. Parse handover
   * 2. Restore session state
   * 3. Continue work
   */
  async resumeSession(projectPath: string): Promise<SessionState> {
    const handoverPath = path.join(projectPath, 'handover.md');

    if (!fs.existsSync(handoverPath)) {
      throw new Error(`No handover file found at ${handoverPath}`);
    }

    const markdown = fs.readFileSync(handoverPath, 'utf-8');
    const handoverData = HandoverBuilder.fromMarkdown(markdown);

    const sessionState: SessionState = {
      sessionId: handoverData.sessionId,
      startTime: new Date(handoverData.startTime),
      tokenBudget: handoverData.tokenBudget,
      tokenUsed: handoverData.tokenUsed,
      status: 'active',
      features: this.config.features,
      currentFeature: handoverData.currentFeature,
      completedFeatures: handoverData.completedFeatures,
      blockedFeatures: handoverData.blockedFeatures,
      decisions: handoverData.decisions
    };

    return sessionState;
  }

  /**
   * Check token budget
   * Returns: status (OK/WARNING/CRITICAL) + action
   */
  checkTokenBudget(state: SessionState): { status: string; percentageUsed: number; action?: string } {
    const percentage = (state.tokenUsed / state.tokenBudget) * 100;
    const threshold = this.config.tokenThreshold;

    if (percentage >= threshold) {
      return {
        status: 'CRITICAL',
        percentageUsed: percentage,
        action: 'STOP - write handover, exit gracefully'
      };
    }

    if (percentage >= 60) {
      return {
        status: 'WARNING',
        percentageUsed: percentage,
        action: 'Plan next task carefully, have handover ready'
      };
    }

    return {
      status: 'OK',
      percentageUsed: percentage
    };
  }

  /**
   * Generate morning report for user
   * Shows: What completed, what's blocked, decisions needed
   */
  async generateMorningReport(state: SessionState): Promise<string> {
    const duration = new Date().getTime() - state.startTime.getTime();
    const durationMinutes = Math.round(duration / 60000);

    const report = `# Chi CTO Morning Report

**Session:** ${state.sessionId}
**Duration:** ${durationMinutes} minutes
**Token Usage:** ${state.tokenUsed} / ${state.tokenBudget} (${((state.tokenUsed / state.tokenBudget) * 100).toFixed(1)}%)

## Completed Features
${state.completedFeatures.length > 0 ? state.completedFeatures.map(f => `- ✅ ${f}`).join('\n') : 'None yet'}

## Blocked Features
${state.blockedFeatures.length > 0 ? state.blockedFeatures.map(f => `- ⚠️ ${f}`).join('\n') : 'None'}

## Decisions Needed
${state.decisions && state.decisions.length > 0 ? state.decisions.map(d => `- [ ] ${d}`).join('\n') : 'None'}

## Next Steps
1. Review completed features
2. Approve blockers or make decisions
3. Next session will resume from handover.md
`;
    return report;
  }

  /**
   * Write handover for next session
   * Creates: handover.md with complete session state
   */
  async writeHandover(state: SessionState, projectPath: string): Promise<void> {
    try {
      const handoverData: HandoverData = {
        sessionId: state.sessionId,
        startTime: state.startTime.toISOString(),
        tokenBudget: state.tokenBudget,
        tokenUsed: state.tokenUsed,
        completedFeatures: state.completedFeatures,
        blockedFeatures: state.blockedFeatures,
        currentFeature: state.currentFeature,
        decisions: state.decisions || [],
        notes: `Session status: ${state.status}`
      };

      const markdown = HandoverBuilder.toMarkdown(handoverData);
      const handoverPath = path.join(projectPath, 'handover.md');

      // Ensure directory exists
      const dir = path.dirname(handoverPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(handoverPath, markdown, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to write handover to ${projectPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
