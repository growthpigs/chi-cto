export interface GateResult {
    gate: string;
    status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIP';
    score?: number;
    threshold?: number;
    message: string;
    action: 'proceed' | 'ask-user' | 'block';
    details?: string[];
}
export declare class QualityGatesExecutor {
    private projectPath;
    constructor(projectPath: string);
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