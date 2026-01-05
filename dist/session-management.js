"use strict";
// src/session-management.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionOrchestrator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const handover_1 = require("./handover");
class SessionOrchestrator {
    constructor(config) {
        this.config = config;
    }
    /**
     * Start new session
     * 1. Create worktree
     * 2. Score all features
     * 3. Pick top 3 (IMMEDIATE tier: ≥25)
     * 4. Initialize session state
     */
    async startSession() {
        const sessionId = `chi-cto-${Date.now()}`;
        // Score features (calls Priority Scoring module)
        // For now, assume features have a score property
        const scoredFeatures = this.config.features.sort((a, b) => (b.score || 0) - (a.score || 0));
        // Filter for IMMEDIATE tier (score >= 25)
        const immediateFeatures = scoredFeatures.filter(f => (f.score || 0) >= 25).slice(0, 3);
        const sessionState = {
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
    async resumeSession(projectPath) {
        const handoverPath = path.join(projectPath, 'handover.md');
        if (!fs.existsSync(handoverPath)) {
            throw new Error(`No handover file found at ${handoverPath}`);
        }
        const markdown = fs.readFileSync(handoverPath, 'utf-8');
        const handoverData = handover_1.HandoverBuilder.fromMarkdown(markdown);
        const sessionState = {
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
    checkTokenBudget(state) {
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
    async generateMorningReport(state) {
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
    async writeHandover(state, projectPath) {
        try {
            const handoverData = {
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
            const markdown = handover_1.HandoverBuilder.toMarkdown(handoverData);
            const handoverPath = path.join(projectPath, 'handover.md');
            // Ensure directory exists
            const dir = path.dirname(handoverPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(handoverPath, markdown, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to write handover to ${projectPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.SessionOrchestrator = SessionOrchestrator;
//# sourceMappingURL=session-management.js.map