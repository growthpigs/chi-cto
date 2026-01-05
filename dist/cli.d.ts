export interface CommandArgs {
    subcommand: 'suggest' | 'mode-b run' | 'status';
    projectPath?: string;
    tokenBudget?: number;
    args?: Record<string, string>;
}
export declare class ChiCTOCLI {
    private orchestrator;
    private sessionOrchestrator;
    constructor();
    /**
     * Main entry point for /chi-cto command
     * Parses arguments and routes to appropriate handler
     */
    execute(args: CommandArgs): Promise<string>;
    /**
     * /chi-cto suggest [project-path]
     * Analyzes active-tasks.md and suggests next features to build
     * (No execution, just priority analysis)
     */
    private handleSuggest;
    /**
     * /chi-cto mode-b run [project-path] [--token-budget N]
     * Executes full Mode B orchestration loop
     * Spawns agents, runs quality gates, writes handover
     */
    private handleModeB;
    /**
     * /chi-cto status [project-path]
     * Show status of last Mode B session
     */
    private handleStatus;
    /**
     * Show help text
     */
    private showHelp;
    /**
     * Helper: Parse active-tasks.md
     */
    private parseFeatures;
    private extractValue;
}
export declare const cli: ChiCTOCLI;
//# sourceMappingURL=cli.d.ts.map