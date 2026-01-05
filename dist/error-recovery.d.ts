export type ErrorClass = 'TOKEN_LIMIT' | 'CORRUPTED_FILE' | 'GIT_CONFLICT' | 'STALE_MEMORY' | 'RATE_LIMIT' | 'MISSING_INFRASTRUCTURE' | 'TOOL_INFRASTRUCTURE';
export interface RecoveryResult {
    class: ErrorClass;
    detected: boolean;
    action: 'log' | 'block' | 'ask';
    message: string;
    recovered: boolean;
    details?: string[];
}
export declare class ErrorRecoveryHandler {
    /**
     * Classify error: determine which error class it belongs to
     */
    classifyError(error: Error | string, context?: any): ErrorClass;
    /**
     * Handle Token Limit (exit gracefully at 70%)
     * Action: LOG + ask user before continuing
     */
    handleTokenLimit(tokensUsed: number, tokensBudget: number): Promise<RecoveryResult>;
    /**
     * Handle Corrupted File (attempt repair or escalate)
     * Action: LOG first, then BLOCK if critical
     */
    handleCorruptedFile(filePath: string, error: Error): Promise<RecoveryResult>;
    /**
     * Handle Git Conflict (user must resolve manually)
     * Action: BLOCK (requires manual resolution)
     */
    handleGitConflict(conflictedFiles: string[]): Promise<RecoveryResult>;
    /**
     * Handle Stale Memory (trust session state over mem0)
     * Action: LOG (non-blocking)
     */
    handleStaleMemory(entry: string): Promise<RecoveryResult>;
    /**
     * Handle Rate Limit (exponential backoff + retry)
     * Action: LOG (retryable)
     */
    handleRateLimit(service: string, retryCount?: number): Promise<RecoveryResult>;
    /**
     * Handle Missing Infrastructure (npm, git, python missing)
     * Action: BLOCK (critical dependencies)
     */
    handleMissingInfrastructure(tool: string): Promise<RecoveryResult>;
    /**
     * Handle Tool Infrastructure Failure (eslint, coverage reporter missing)
     * Action: LOG (optional tools) or BLOCK (critical tools)
     */
    handleToolInfrastructure(tool: string, critical?: boolean): Promise<RecoveryResult>;
}
//# sourceMappingURL=error-recovery.d.ts.map