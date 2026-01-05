/**
 * Chi CTO Priority Scoring
 * Formula: SCORE = U + I + C + M (0-40 range)
 * Based on proven PriorityEngine (61 tests, production-ready)
 */
export interface Feature {
    id: string;
    name: string;
    urgency: number;
    importance: number;
    confidence: number;
    impact: number;
    multiplier?: 'kids+school' | 'payment-failure' | 'lawyer' | 'phishing';
    description?: string;
}
export interface ScoredFeature extends Feature {
    baseScore: number;
    finalScore: number;
    tier: 'IMMEDIATE' | 'SOON' | 'LATER' | 'SKIP' | 'FLAGGED';
    reason: string;
}
export declare class PriorityScorer {
    /**
     * Calculate base score: U + I + C + M
     * Simple addition, no division (no division-by-zero errors)
     */
    calculateBaseScore(feature: Feature): number;
    /**
     * Apply multipliers from PriorityEngine
     * 1. phishing → FLAG (return -1)
     * 2. lawyer → I=10 (floor, max importance)
     * 3. kids+school → U×1.5 (urgency escalation)
     * 4. payment-failure → U×1.5 (urgency escalation)
     */
    applyMultiplier(feature: Feature, baseScore: number): {
        finalScore: number;
        reason: string;
    };
    /**
     * Map score to tier
     * IMMEDIATE: ≥25
     * SOON: 20-24
     * LATER: 10-19
     * SKIP: <10
     * FLAGGED: -1 (phishing)
     */
    getTier(score: number): 'IMMEDIATE' | 'SOON' | 'LATER' | 'SKIP' | 'FLAGGED';
    /**
     * Score a single feature
     * Returns: Feature + baseScore + finalScore + tier + reason
     */
    scoreFeature(feature: Feature): ScoredFeature;
    /**
     * Score batch of features
     * Returns: Sorted by priority (FLAGGED first, then by score descending)
     */
    scoreBatch(features: Feature[]): ScoredFeature[];
}
//# sourceMappingURL=priority-scoring.d.ts.map