export interface HandoverData {
    sessionId: string;
    startTime: string;
    tokenBudget: number;
    tokenUsed: number;
    completedFeatures: string[];
    blockedFeatures: string[];
    currentFeature?: any;
    decisions: string[];
    notes: string;
}
export declare class HandoverBuilder {
    /**
     * Build markdown handover from session state
     * Format: Human-readable, preserves all important state
     */
    static toMarkdown(data: HandoverData): string;
    /**
     * Parse markdown handover back to SessionState
     */
    static fromMarkdown(markdown: string): HandoverData;
}
//# sourceMappingURL=handover.d.ts.map