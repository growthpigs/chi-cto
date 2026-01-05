import { ChiCTOCLI } from '../src/cli';
import * as fs from 'fs';
import * as path from 'path';

describe('Chi CTO CLI', () => {
  let cli: ChiCTOCLI;

  beforeAll(() => {
    cli = new ChiCTOCLI();
  });

  describe('execute() - command routing', () => {
    test('should handle status command without path', async () => {
      const result = await cli.execute({ subcommand: 'status' });
      expect(typeof result).toBe('string');
      // Should either show handover or "No previous session"
      expect(result.length > 0).toBe(true);
    });

    test('should handle missing project path gracefully', async () => {
      const result = await cli.execute({
        subcommand: 'suggest',
        projectPath: '/nonexistent/path/that/does/not/exist'
      });
      expect(result).toContain('Error');
      expect(result).toContain('not found');
    });

    test('should route suggest command correctly', async () => {
      const result = await cli.execute({
        subcommand: 'suggest',
        projectPath: process.cwd()
      });
      // Should either find tasks or report no active-tasks.md
      expect(typeof result).toBe('string');
      expect(result.length > 0).toBe(true);
    });

    test('should route mode-b run command correctly', async () => {
      const result = await cli.execute({
        subcommand: 'mode-b run',
        projectPath: process.cwd(),
        tokenBudget: 150000
      });
      expect(typeof result).toBe('string');
      expect(result.length > 0).toBe(true);
    });

    test('should route status command correctly', async () => {
      const result = await cli.execute({ subcommand: 'status' });
      expect(typeof result).toBe('string');
      // Status should either show handover or indicate no previous session
    });
  });

  describe('handleSuggest()', () => {
    test('should report error when active-tasks.md does not exist', async () => {
      const tempDir = '/tmp/chi-cto-test-no-tasks';
      fs.mkdirSync(tempDir, { recursive: true });

      const result = await cli.execute({
        subcommand: 'suggest',
        projectPath: tempDir
      });

      expect(result).toContain('Error');
      expect(result).toContain('active-tasks.md');

      // Cleanup
      fs.rmSync(tempDir, { recursive: true });
    });

    test('should analyze features from active-tasks.md if present', async () => {
      const tempDir = '/tmp/chi-cto-test-with-tasks';
      const workingDir = path.join(tempDir, 'working');
      fs.mkdirSync(workingDir, { recursive: true });

      const tasksContent = `
# Active Tasks

## Feature: Add Auth
- urgency: 8
- importance: 9
- confidence: 7
- impact: 8
- description: Implement OAuth2 flow

## Feature: Fix Logo
- urgency: 3
- importance: 2
- confidence: 10
- impact: 1
`;

      fs.writeFileSync(path.join(workingDir, 'active-tasks.md'), tasksContent);

      const result = await cli.execute({
        subcommand: 'suggest',
        projectPath: tempDir
      });

      expect(result).toContain('Top 5 Priority Features');
      expect(result).toContain('Add Auth');
      expect(result).toContain('Chi CTO');

      // Cleanup
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe('handleModeB()', () => {
    test('should fail gracefully with invalid project path', async () => {
      const result = await cli.execute({
        subcommand: 'mode-b run',
        projectPath: '/invalid/path/to/nowhere',
        tokenBudget: 200000
      });

      expect(result).toContain('Error');
    });

    test('should initialize Mode B with default token budget', async () => {
      const result = await cli.execute({
        subcommand: 'mode-b run',
        projectPath: process.cwd()
      });

      expect(result).toContain('Chi CTO');
      expect(typeof result).toBe('string');
    });

    test('should accept custom token budget', async () => {
      const customBudget = 300000;
      const result = await cli.execute({
        subcommand: 'mode-b run',
        projectPath: process.cwd(),
        tokenBudget: customBudget
      });

      expect(result).toContain('300000');
      expect(typeof result).toBe('string');
    });
  });

  describe('handleStatus()', () => {
    test('should report no previous session when no handover exists', async () => {
      const tempDir = '/tmp/chi-cto-test-no-handover';
      fs.mkdirSync(tempDir, { recursive: true });

      const result = await cli.execute({
        subcommand: 'status',
        projectPath: tempDir
      });

      expect(result).toContain('No previous session');

      // Cleanup
      fs.rmSync(tempDir, { recursive: true });
    });

    test('should display handover when it exists', async () => {
      const tempDir = '/tmp/chi-cto-test-with-handover';
      fs.mkdirSync(tempDir, { recursive: true });

      const handoverContent = `# Session Handover
- SessionID: chi-cto-123
- Completed: Feature A
- Blocked: Feature B
`;

      fs.writeFileSync(path.join(tempDir, 'handover.md'), handoverContent);

      const result = await cli.execute({
        subcommand: 'status',
        projectPath: tempDir
      });

      expect(result).toContain('Last Chi CTO Session');
      expect(result).toContain('Session Handover');

      // Cleanup
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe('parseFeatures()', () => {
    test('should extract features from markdown', async () => {
      const markdown = `
# Tasks

## Feature: Build API
- urgency: 8
- importance: 9
- confidence: 7
- impact: 6
- description: REST API endpoints

## Feature: Testing
- urgency: 5
- importance: 5
- confidence: 5
- impact: 5
`;

      // Use CLI to test through suggest command with mock filesystem
      const tempDir = '/tmp/chi-cto-test-features';
      const workingDir = path.join(tempDir, 'working');
      fs.mkdirSync(workingDir, { recursive: true });
      fs.writeFileSync(path.join(workingDir, 'active-tasks.md'), markdown);

      const result = await cli.execute({
        subcommand: 'suggest',
        projectPath: tempDir
      });

      expect(result).toContain('Build API');
      expect(result).toContain('Testing');

      // Cleanup
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe('showHelp()', () => {
    test('should display help for unknown commands', async () => {
      const result = await cli.execute({
        subcommand: 'unknown' as any
      });

      expect(result).toContain('Chi CTO');
      expect(result).toContain('/chi-cto suggest');
      expect(result).toContain('/chi-cto mode-b run');
      expect(result).toContain('/chi-cto status');
    });
  });
});
