import { Feature } from './priority-scoring';
import { SessionState } from './session-management';
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
export declare function readActiveTasksMarkdown(filePath: string): Promise<Feature[]>;
export declare class ModeBAOrchestrator {
    private scorer;
    private recoveryHandler;
    private sessionOrchestrator;
    constructor();
    /**
     * Main Mode B automation loop
     */
    runModeB(projectPath: string, tokenBudget?: number): Promise<OrchestratorResult>;
}
//# sourceMappingURL=orchestrator.d.ts.map