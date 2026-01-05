"use strict";
// src/priority-scoring.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityScorer = void 0;
class PriorityScorer {
    /**
     * Calculate base score: U + I + C + M
     * Simple addition, no division (no division-by-zero errors)
     */
    calculateBaseScore(feature) {
        return feature.urgency + feature.importance + feature.confidence + feature.impact;
    }
    /**
     * Apply multipliers from PriorityEngine
     * 1. phishing → FLAG (return -1)
     * 2. lawyer → I=10 (floor, max importance)
     * 3. kids+school → U×1.5 (urgency escalation)
     * 4. payment-failure → U×1.5 (urgency escalation)
     */
    applyMultiplier(feature, baseScore) {
        // Phishing: FLAG for human review
        if (feature.multiplier === 'phishing') {
            return {
                finalScore: -1,
                reason: 'FLAGGED: Potential phishing - requires human review before actioning'
            };
        }
        // Lawyer: Importance floor at 10
        if (feature.multiplier === 'lawyer') {
            const escalatedScore = feature.urgency + 10 + feature.confidence + feature.impact;
            return {
                finalScore: escalatedScore,
                reason: 'Escalated: Lawyer email (importance floor = 10)'
            };
        }
        // Kids + school day: Urgency ×1.5
        if (feature.multiplier === 'kids+school') {
            const escalatedUrgency = Math.floor(feature.urgency * 1.5);
            const escalatedScore = escalatedUrgency + feature.importance + feature.confidence + feature.impact;
            return {
                finalScore: escalatedScore,
                reason: 'Escalated: Kids + school day (urgency ×1.5)'
            };
        }
        // Payment failure (3rd+ attempt): Urgency ×1.5
        if (feature.multiplier === 'payment-failure') {
            const escalatedUrgency = Math.floor(feature.urgency * 1.5);
            const escalatedScore = escalatedUrgency + feature.importance + feature.confidence + feature.impact;
            return {
                finalScore: escalatedScore,
                reason: 'Escalated: Payment failure 3rd+ (urgency ×1.5)'
            };
        }
        // No multiplier
        return {
            finalScore: baseScore,
            reason: 'No multiplier applied'
        };
    }
    /**
     * Map score to tier
     * IMMEDIATE: ≥25
     * SOON: 20-24
     * LATER: 10-19
     * SKIP: <10
     * FLAGGED: -1 (phishing)
     */
    getTier(score) {
        if (score < 0)
            return 'FLAGGED';
        if (score >= 25)
            return 'IMMEDIATE';
        if (score >= 20)
            return 'SOON';
        if (score >= 10)
            return 'LATER';
        return 'SKIP';
    }
    /**
     * Score a single feature
     * Returns: Feature + baseScore + finalScore + tier + reason
     */
    scoreFeature(feature) {
        const baseScore = this.calculateBaseScore(feature);
        const { finalScore, reason } = this.applyMultiplier(feature, baseScore);
        const tier = this.getTier(finalScore);
        return {
            ...feature,
            baseScore,
            finalScore,
            tier,
            reason
        };
    }
    /**
     * Score batch of features
     * Returns: Sorted by priority (FLAGGED first, then by score descending)
     */
    scoreBatch(features) {
        const scored = features.map(f => this.scoreFeature(f));
        // Sort: FLAGGED first, then by finalScore descending
        return scored.sort((a, b) => {
            // Flagged items always first
            if (a.tier === 'FLAGGED' && b.tier !== 'FLAGGED')
                return -1;
            if (a.tier !== 'FLAGGED' && b.tier === 'FLAGGED')
                return 1;
            // Within same tier, sort by score descending
            return b.finalScore - a.finalScore;
        });
    }
}
exports.PriorityScorer = PriorityScorer;
//# sourceMappingURL=priority-scoring.js.map