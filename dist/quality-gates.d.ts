export interface GateResult {
    gate: string;
    status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIP';
    score?: number;
    threshold?: number;
    message: string;
    action: 'proceed' | 'ask-user' | 'block';
    details?: string[];
}
/**
 * Interface for command execution - allows dependency injection for testing
 * TECH DEBT: Currently tests bypass this via NODE_ENV check. Proper fix is to:
 * 1. Inject a MockCommandExecutor in tests
 * 2. Remove all NODE_ENV === 'test' checks
 * 3. Test the actual parsing logic with mock command output
 */
export interface CommandExecutor {
    execute(command: string, args: string[], cwd: string): string;
}
/**
 * Default command executor using child_process
 */
export declare class ShellCommandExecutor implements CommandExecutor {
    execute(command: string, args: string[], cwd: string): string;
}
export declare class QualityGatesExecutor {
    private projectPath;
    private executor;
    constructor(projectPath: string, executor?: CommandExecutor);
    /**
     * Gate 1: Test Coverage (≥80%)
     * PASS: ≥80%
     * WARNING: 70-79% (improving)
     * FAIL: <70%
     * SKIP: No test infrastructure
     */
    runCoverageGate(): Promise<GateResult>;
    /**
     * Gate 2: Linting (0 errors, ≤5 warnings)
     * PASS: 0 errors + ≤5 warnings
     * WARNING: 0 errors + 6-10 warnings
     * FAIL: >0 errors or >10 warnings
     * SKIP: No linter installed
     */
    runLintingGate(): Promise<GateResult>;
    /**
     * Gate 3: Code Review (no critical issues)
     * PASS: All checks OK
     * FAIL: Shared system modified, API breaking, hardcoded secrets, unclear code
     * CRITICAL: Security violations always fail
     */
    runCodeReviewGate(): Promise<GateResult>;
    /**
     * Gate 4: Git Safety (clean rebase)
     * PASS: On top of main, clean messages
     * REBASE: Behind main (auto-rebase)
     * FAIL: Merge conflicts
     */
    runGitSafetyGate(): Promise<GateResult>;
    /**
     * Run all 4 gates sequentially
     * Stop on first FAIL (blocking)
     */
    runAllGates(): Promise<GateResult[]>;
}
//# sourceMappingURL=quality-gates.d.ts.map