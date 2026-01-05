# Chi CTO - Autonomous Feature Orchestrator

You are invoking Chi CTO. Execute the following based on arguments:

## If no arguments or "suggest":
Run the suggest command to analyze and rank features:
```bash
npx ts-node /Users/rodericandrews/_PAI/projects/chi-cto/src/cli-local.ts suggest .
```

Show the output to the user. This scores features from active-tasks.md using:
- Score = Urgency + Importance + Confidence + Impact (0-40)
- IMMEDIATE tier: score >= 25
- SOON tier: 15-24
- LATER tier: < 15

## If "run" or "mode-b" or "build":
Execute full orchestration to build top features:
```bash
npx ts-node /Users/rodericandrews/_PAI/projects/chi-cto/src/cli-local.ts mode-b run .
```

This will:
1. Select top 3 IMMEDIATE tier features
2. Create git worktrees for isolation
3. Generate TypeScript implementation + tests
4. Run quality gates (coverage, lint, review, git-safety)
5. Apply error recovery if gates fail
6. Write handover.md with session state

## If "status":
Check last session status:
```bash
npx ts-node /Users/rodericandrews/_PAI/projects/chi-cto/src/cli-local.ts status .
```

## If "help":
Show available commands:
- `/chi-cto` or `/chi-cto suggest` - Analyze and rank features
- `/chi-cto run` or `/chi-cto build` - Execute full orchestration
- `/chi-cto status` - Check last session
- `/chi-cto help` - Show this help

## Requirements
Project needs `active-tasks.md` in root with format:
```markdown
## Feature: Feature name
- urgency: 1-10
- importance: 1-10
- confidence: 1-10
- impact: 1-10
- description: What to build
```

Execute the appropriate command now based on the user's input.
