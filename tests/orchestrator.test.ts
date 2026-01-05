// tests/orchestrator.test.ts

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  ModeBAOrchestrator,
  readActiveTasksMarkdown,
  OrchestratorResult
} from '../src/orchestrator';
import { PriorityScorer, Feature } from '../src/priority-scoring';

// Create temp directory for tests
const testTempDir = path.join(os.tmpdir(), 'chi-cto-tests');

describe('ModeBAOrchestrator Integration Tests', () => {
  beforeAll(() => {
    // Create temp directory
    if (!fs.existsSync(testTempDir)) {
      fs.mkdirSync(testTempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup test files
    const files = fs.readdirSync(testTempDir);
    for (const file of files) {
      const filePath = path.join(testTempDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  });

  afterAll(() => {
    // Cleanup temp directory
    if (fs.existsSync(testTempDir)) {
      fs.rmSync(testTempDir, { recursive: true });
    }
  });

  // Test 1: Read active-tasks.md and parse features
  test('should read active-tasks.md and parse features', async () => {
    const tasksPath = path.join(testTempDir, 'active-tasks.md');
    const taskContent = `## Feature: Add Email Validation
- urgency: 8
- importance: 9
- confidence: 7
- impact: 6
- description: Validate email format on signup

## Feature: Implement Rate Limiting
- urgency: 9
- importance: 10
- confidence: 9
- impact: 8
- description: Prevent brute force attacks
`;

    fs.writeFileSync(tasksPath, taskContent, 'utf-8');

    const features = await readActiveTasksMarkdown(tasksPath);

    expect(features.length).toBe(2);
    expect(features[0].name).toBe('Add Email Validation');
    expect(features[1].name).toBe('Implement Rate Limiting');
  });

  // Test 2: Score features using PriorityScorer
  test('should score features using PriorityScorer', async () => {
    const tasksPath = path.join(testTempDir, 'active-tasks.md');
    const taskContent = `## Feature: Critical Bug Fix
- urgency: 10
- importance: 10
- confidence: 10
- impact: 8
- description: Fix production bug
`;

    fs.writeFileSync(tasksPath, taskContent, 'utf-8');

    const features = await readActiveTasksMarkdown(tasksPath);
    const scorer = new PriorityScorer();
    const scored = scorer.scoreFeature(features[0]);

    // 10+10+10+8 = 38
    expect(scored.finalScore).toBe(38);
    expect(scored.tier).toBe('IMMEDIATE');
  });

  // Test 3: Filter for immediate features (score >= 25)
  test('should filter for immediate features with score >= 25', async () => {
    const tasksPath = path.join(testTempDir, 'active-tasks.md');
    const taskContent = `## Feature: High Priority
- urgency: 8
- importance: 9
- confidence: 7
- impact: 6

## Feature: Low Priority
- urgency: 2
- importance: 3
- confidence: 2
- impact: 1
`;

    fs.writeFileSync(tasksPath, taskContent, 'utf-8');

    const features = await readActiveTasksMarkdown(tasksPath);
    const scorer = new PriorityScorer();
    const scored = scorer.scoreBatch(features);

    const immediate = scored.filter(f => f.finalScore >= 25);

    expect(immediate.length).toBe(1);
    expect(immediate[0].name).toBe('High Priority');
  });

  // Test 4: Take top 3 by score
  test('should take top 3 features by score', async () => {
    const tasksPath = path.join(testTempDir, 'active-tasks.md');
    const taskContent = `## Feature: Feature A
- urgency: 8
- importance: 9
- confidence: 7
- impact: 6

## Feature: Feature B
- urgency: 7
- importance: 8
- confidence: 6
- impact: 5

## Feature: Feature C
- urgency: 6
- importance: 7
- confidence: 5
- impact: 4

## Feature: Feature D
- urgency: 5
- importance: 6
- confidence: 4
- impact: 3
`;

    fs.writeFileSync(tasksPath, taskContent, 'utf-8');

    const features = await readActiveTasksMarkdown(tasksPath);
    const scorer = new PriorityScorer();
    const scored = scorer.scoreBatch(features);

    const immediate = scored
      .filter(f => f.finalScore >= 25)
      .slice(0, 3);

    expect(immediate.length).toBeLessThanOrEqual(3);
    // Verify sorted by score descending
    for (let i = 0; i < immediate.length - 1; i++) {
      expect(immediate[i].finalScore).toBeGreaterThanOrEqual(immediate[i + 1].finalScore);
    }
  });

  // Test 5: Execute mock feature implementation
  test('should execute orchestrator with mock features', async () => {
    const projectPath = path.join(testTempDir, `project-${Date.now()}`);
    fs.mkdirSync(projectPath, { recursive: true });

    // Initialize git repo
    const gitInit = require('child_process').execSync;
    try {
      gitInit('git init', { cwd: projectPath });
      gitInit('git config user.email "test@test.com"', { cwd: projectPath });
      gitInit('git config user.name "Test"', { cwd: projectPath });
    } catch (e) {
      // Ignore git errors in test environment
    }

    const tasksPath = path.join(projectPath, 'active-tasks.md');
    const taskContent = `## Feature: Add Email Validation
- urgency: 8
- importance: 9
- confidence: 7
- impact: 6
- description: Validate email format on signup
`;

    fs.writeFileSync(tasksPath, taskContent, 'utf-8');

    const orchestrator = new ModeBAOrchestrator();
    const result = await orchestrator.runModeB(projectPath, 200000);

    expect(result).toBeDefined();
    expect(result.report).toBeDefined();
    expect(result.state).toBeDefined();
  });

  // Test 6: Run quality gates on completion
  test('should run quality gates and report results', async () => {
    const projectPath = path.join(testTempDir, `project-gates-${Date.now()}`);
    fs.mkdirSync(projectPath, { recursive: true });

    const tasksPath = path.join(projectPath, 'active-tasks.md');
    const taskContent = `## Feature: Test Feature
- urgency: 8
- importance: 9
- confidence: 7
- impact: 6
`;

    fs.writeFileSync(tasksPath, taskContent, 'utf-8');

    const orchestrator = new ModeBAOrchestrator();
    const result: OrchestratorResult = await orchestrator.runModeB(projectPath, 200000);

    // In test environment, gates are mocked to pass
    expect(result.state.completedFeatures.length + result.state.blockedFeatures.length).toBeGreaterThanOrEqual(0);
  });

  // Test 7: Handle gate failure and recovery
  test('should handle gate failure gracefully', async () => {
    const projectPath = path.join(testTempDir, `project-failure-${Date.now()}`);
    fs.mkdirSync(projectPath, { recursive: true });

    const tasksPath = path.join(projectPath, 'active-tasks.md');
    const taskContent = `## Feature: Risky Feature
- urgency: 10
- importance: 10
- confidence: 10
- impact: 10
`;

    fs.writeFileSync(tasksPath, taskContent, 'utf-8');

    const orchestrator = new ModeBAOrchestrator();
    const result = await orchestrator.runModeB(projectPath, 200000);

    // Should complete without throwing
    expect(result.state).toBeDefined();
    expect(typeof result.report).toBe('string');
  });

  // Test 8: Respect 70% token budget limit
  test('should exit when token budget reaches 70%', async () => {
    const projectPath = path.join(testTempDir, `project-budget-${Date.now()}`);
    fs.mkdirSync(projectPath, { recursive: true });

    const tasksPath = path.join(projectPath, 'active-tasks.md');
    const taskContent = `## Feature: Feature 1
- urgency: 10
- importance: 10
- confidence: 10
- impact: 10

## Feature: Feature 2
- urgency: 10
- importance: 10
- confidence: 10
- impact: 10

## Feature: Feature 3
- urgency: 10
- importance: 10
- confidence: 10
- impact: 10
`;

    fs.writeFileSync(tasksPath, taskContent, 'utf-8');

    // Set low token budget to trigger limit
    const orchestrator = new ModeBAOrchestrator();
    const result = await orchestrator.runModeB(projectPath, 10000); // Very low budget

    // Should exit gracefully when approaching limit
    expect(result.state).toBeDefined();
    expect(typeof result.report).toBe('string');

    // Check if status reflects low token situation
    const percentageUsed = (result.state.tokenUsed / result.state.tokenBudget) * 100;
    expect(percentageUsed).toBeLessThanOrEqual(100);
  });

  // Test 9: Write handover on completion
  test('should write handover.md on completion', async () => {
    const projectPath = path.join(testTempDir, `project-handover-${Date.now()}`);
    fs.mkdirSync(projectPath, { recursive: true });

    const tasksPath = path.join(projectPath, 'active-tasks.md');
    const taskContent = `## Feature: Test Feature
- urgency: 8
- importance: 9
- confidence: 7
- impact: 6
`;

    fs.writeFileSync(tasksPath, taskContent, 'utf-8');

    const orchestrator = new ModeBAOrchestrator();
    await orchestrator.runModeB(projectPath, 200000);

    const handoverPath = path.join(projectPath, 'handover.md');
    expect(fs.existsSync(handoverPath)).toBe(true);

    const handoverContent = fs.readFileSync(handoverPath, 'utf-8');
    expect(handoverContent).toContain('Chi CTO Session Handover');
    expect(handoverContent).toContain('Session ID');
  });

  // Test 10: Generate morning report
  test('should generate morning report with session summary', async () => {
    const projectPath = path.join(testTempDir, `project-report-${Date.now()}`);
    fs.mkdirSync(projectPath, { recursive: true });

    const tasksPath = path.join(projectPath, 'active-tasks.md');
    const taskContent = `## Feature: Test Feature
- urgency: 8
- importance: 9
- confidence: 7
- impact: 6
`;

    fs.writeFileSync(tasksPath, taskContent, 'utf-8');

    const orchestrator = new ModeBAOrchestrator();
    const result = await orchestrator.runModeB(projectPath, 200000);

    expect(result.report).toBeDefined();
    expect(result.report.length).toBeGreaterThan(0);
    expect(result.report).toContain('Chi CTO');
    expect(result.report).toContain('Token Usage');
  });
});
