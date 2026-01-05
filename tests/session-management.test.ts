// tests/session-management.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { SessionOrchestrator, SessionConfig, SessionState } from '../src/session-management';
import { HandoverBuilder } from '../src/handover';

describe('Session Management', () => {
  const testProjectPath = '/tmp/chi-cto-test';

  const config: SessionConfig = {
    projectPath: testProjectPath,
    tokenBudget: 200000,
    tokenThreshold: 70,
    features: [
      { name: 'Feature A', score: 30 },
      { name: 'Feature B', score: 25 },
      { name: 'Feature C', score: 20 },
      { name: 'Feature D', score: 15 }
    ]
  };

  beforeEach(() => {
    // Create test directory if it doesn't exist
    if (!fs.existsSync(testProjectPath)) {
      fs.mkdirSync(testProjectPath, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    try {
      const handoverPath = path.join(testProjectPath, 'handover.md');
      if (fs.existsSync(handoverPath)) {
        fs.unlinkSync(handoverPath);
      }
    } catch (e) {
      // ignore cleanup errors
    }
  });

  describe('Session Start', () => {
    test('starts new session with initial state', async () => {
      const orchestrator = new SessionOrchestrator(config);
      const state = await orchestrator.startSession();

      expect(state.sessionId).toMatch(/^chi-cto-\d+$/);
      expect(state.startTime).toBeInstanceOf(Date);
      expect(state.tokenBudget).toBe(200000);
      expect(state.tokenUsed).toBe(0);
      expect(state.status).toBe('active');
      expect(state.completedFeatures).toEqual([]);
      expect(state.blockedFeatures).toEqual([]);
    });

    test('scores features and picks top 3 IMMEDIATE', async () => {
      const orchestrator = new SessionOrchestrator(config);
      const state = await orchestrator.startSession();

      // Should have top 3 features with score >= 25
      expect(state.features.length).toBeLessThanOrEqual(3);
      state.features.forEach(f => {
        expect(f.score).toBeGreaterThanOrEqual(25);
      });

      // Verify they're the top ones
      expect(state.features[0].name).toBe('Feature A');
      expect(state.features[1].name).toBe('Feature B');
    });
  });

  describe('Session Resume', () => {
    test('resumes session from handover.md', async () => {
      const orchestrator = new SessionOrchestrator(config);

      // Create initial session and write handover
      const initialState = await orchestrator.startSession();
      initialState.completedFeatures.push('Feature A');
      initialState.blockedFeatures.push('Feature B: linting error');
      initialState.tokenUsed = 50000;

      await orchestrator.writeHandover(initialState, testProjectPath);

      // Resume from handover
      const resumedState = await orchestrator.resumeSession(testProjectPath);

      expect(resumedState.sessionId).toBe(initialState.sessionId);
      expect(resumedState.completedFeatures).toContain('Feature A');
      expect(resumedState.blockedFeatures).toContain('Feature B: linting error');
      expect(resumedState.tokenUsed).toBe(50000);
    });

    test('preserves completed features across sessions', async () => {
      const orchestrator = new SessionOrchestrator(config);

      // Session 1: complete Feature A
      const session1 = await orchestrator.startSession();
      session1.completedFeatures.push('Feature A');
      session1.tokenUsed = 40000;

      // Write handover
      await orchestrator.writeHandover(session1, testProjectPath);

      // Session 2: resume
      const session2 = await orchestrator.resumeSession(testProjectPath);

      // Verify Feature A is still completed
      expect(session2.completedFeatures).toContain('Feature A');
      expect(session2.tokenUsed).toBe(40000);
    });
  });

  describe('Token Budget', () => {
    test('OK status below 60%', () => {
      const orchestrator = new SessionOrchestrator(config);
      const state: any = { tokenUsed: 100000, tokenBudget: 200000 };
      const result = orchestrator.checkTokenBudget(state);

      expect(result.status).toBe('OK');
      expect(result.percentageUsed).toBe(50);
    });

    test('WARNING between 60-70%', () => {
      const orchestrator = new SessionOrchestrator(config);
      const state: any = { tokenUsed: 130000, tokenBudget: 200000 };
      const result = orchestrator.checkTokenBudget(state);

      expect(result.status).toBe('WARNING');
      expect(result.percentageUsed).toBe(65);
      expect(result.action).toContain('carefully');
    });

    test('CRITICAL at 70%+', () => {
      const orchestrator = new SessionOrchestrator(config);
      const state: any = { tokenUsed: 140000, tokenBudget: 200000 };
      const result = orchestrator.checkTokenBudget(state);

      expect(result.status).toBe('CRITICAL');
      expect(result.percentageUsed).toBe(70);
      expect(result.action).toContain('STOP');
    });
  });

  describe('Morning Report', () => {
    test('generates report with all sections', async () => {
      const state: any = {
        sessionId: 'test-123',
        startTime: new Date(),
        tokenBudget: 200000,
        tokenUsed: 100000,
        features: [],
        completedFeatures: ['Feature A'],
        blockedFeatures: ['Feature B: linting error'],
        decisions: ['Approve Feature A merge?']
      };

      const orchestrator = new SessionOrchestrator(config);
      const report = await orchestrator.generateMorningReport(state);

      expect(report).toContain('Chi CTO Morning Report');
      expect(report).toContain('Completed Features');
      expect(report).toContain('Feature A');
      expect(report).toContain('Blocked Features');
      expect(report).toContain('Feature B: linting error');
      expect(report).toContain('Decisions Needed');
      expect(report).toContain('Approve Feature A merge?');
      expect(report).toContain('50.0%');
    });
  });

  describe('Handover System', () => {
    test('serializes session state to markdown', () => {
      const data = {
        sessionId: 'test-123',
        startTime: new Date().toISOString(),
        tokenBudget: 200000,
        tokenUsed: 100000,
        completedFeatures: ['Feature A'],
        blockedFeatures: [],
        currentFeature: undefined,
        decisions: ['Merge Feature A?'],
        notes: 'Ready for next session'
      };

      const markdown = HandoverBuilder.toMarkdown(data);

      expect(markdown).toContain('test-123');
      expect(markdown).toContain('Feature A');
      expect(markdown).toContain('100000 / 200000');
      expect(markdown).toContain('Merge Feature A?');
      expect(markdown).toContain('Ready for next session');
    });

    test('parses markdown handover back to state', () => {
      const markdown = `---
## Chi CTO Session Handover

**Session ID:** test-123
**Start Time:** 2026-01-04T10:00:00Z
**Token Budget:** 100000 / 200000

### Completed
- ✅ Feature A

### Blocked
None

### Decisions Needed
- [ ] Merge Feature A?

### Notes
Ready for next session

---`;

      const data = HandoverBuilder.fromMarkdown(markdown);

      expect(data.sessionId).toBe('test-123');
      expect(data.tokenUsed).toBe(100000);
      expect(data.tokenBudget).toBe(200000);
      expect(data.completedFeatures).toContain('Feature A');
      expect(data.decisions).toContain('Merge Feature A?');
      expect(data.notes).toContain('Ready');
    });

    test('handover round-trip preserves startTime', () => {
      const originalStart = '2026-01-04T10:00:00Z';
      const data = {
        sessionId: 'test-123',
        startTime: originalStart,
        tokenBudget: 100000,
        tokenUsed: 30000,
        completedFeatures: ['Feature A'],
        blockedFeatures: [],
        currentFeature: undefined,
        decisions: ['Merge Feature A?'],
        notes: 'Ready for next session'
      };

      // Write to markdown
      const markdown = HandoverBuilder.toMarkdown(data);

      // Verify startTime is in markdown
      expect(markdown).toContain(originalStart);

      // Read back from markdown
      const restored = HandoverBuilder.fromMarkdown(markdown);

      // startTime should match original
      expect(restored.startTime).toBe(originalStart);
    });
  });

  describe('2-Session Workflow', () => {
    test('Session 1 → write handover → Session 2 resume', async () => {
      const orchestrator = new SessionOrchestrator(config);

      // Session 1: start, complete Feature A, write handover
      const session1 = await orchestrator.startSession();
      const sessionId1 = session1.sessionId;

      session1.completedFeatures.push('Feature A');
      session1.tokenUsed = 50000;
      session1.decisions = ['Should we proceed with Feature B?'];

      await orchestrator.writeHandover(session1, testProjectPath);

      // Verify handover was written
      const handoverPath = path.join(testProjectPath, 'handover.md');
      expect(fs.existsSync(handoverPath)).toBe(true);

      // Session 2: read handover, resume
      const session2 = await orchestrator.resumeSession(testProjectPath);

      // Verify continuity
      expect(session2.sessionId).toBe(sessionId1);
      expect(session2.completedFeatures).toContain('Feature A');
      expect(session2.blockedFeatures).toEqual([]);
      expect(session2.tokenUsed).toBe(50000);
      expect(session2.decisions).toContain('Should we proceed with Feature B?');

      // Verify new session can continue work
      session2.completedFeatures.push('Feature B');
      expect(session2.completedFeatures.length).toBe(2);
    });
  });

  describe('File I/O Error Handling', () => {
    test('writeHandover handles invalid path gracefully', async () => {
      const orchestrator = new SessionOrchestrator(config);
      const invalidPath = '/invalid/nonexistent/path/that/cannot/exist/here/chi-cto-test';

      const state: SessionState = {
        sessionId: 'test',
        startTime: new Date(),
        tokenBudget: 100000,
        tokenUsed: 30000,
        status: 'active',
        completedFeatures: [],
        blockedFeatures: [],
        features: []
      };

      // Should throw error instead of crashing
      await expect(orchestrator.writeHandover(state, invalidPath)).rejects.toThrow(
        /Failed to write handover/
      );
    });
  });
});
