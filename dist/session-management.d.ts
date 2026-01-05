export interface SessionConfig {
    projectPath: string;
    tokenBudget: number;
    tokenThreshold: number;
    features: any[];
}
export interface SessionState {
    sessionId: string;
    startTime: Date;
    tokenBudget: number;
    tokenUsed: number;
    status: 'active' | 'paused' | 'complete';
    features: any[];
    currentFeature?: any;
    completedFeatures: string[];
    blockedFeatures: string[];
    decisions?: string[];
}
export declare class SessionOrchestrator {
    private config;
    constructor(config: SessionConfig);
    /**
     * Start new session
     * 1. Create worktree
     * 2. Score all features
     * 3. Pick top 3 (IMMEDIATE tier: ≥25)
     * 4. Initialize session state
     */
    startSession(): Promise<SessionState>;
    /**
     * Resume session from handover.md
     * 1. Parse handover
     * 2. Restore session state
     * 3. Continue work
     */
    resumeSession(projectPath: string): Promise<SessionState>;
    /**
     * Check token budget
     * Returns: status (OK/WARNING/CRITICAL) + action
     */
    checkTokenBudget(state: SessionState): {
        status: string;
        percentageUsed: number;
        action?: string;
    };
    /**
     * Generate morning report for user
     * Shows: What completed, what's blocked, decisions needed
     */
    generateMorningReport(state: SessionState): Promise<string>;
    /**
     * Write handover for next session
     * Creates: handover.md with complete session state
     */
    writeHandover(state: SessionState, projectPath: string): Promise<void>;
}
//# sourceMappingURL=session-management.d.ts.map