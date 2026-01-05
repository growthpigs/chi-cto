// src/error-recovery.ts

export type ErrorClass =
  | 'TOKEN_LIMIT'
  | 'CORRUPTED_FILE'
  | 'GIT_CONFLICT'
  | 'STALE_MEMORY'
  | 'RATE_LIMIT'
  | 'MISSING_INFRASTRUCTURE'
  | 'TOOL_INFRASTRUCTURE';

export interface RecoveryResult {
  class: ErrorClass;
  detected: boolean;
  action: 'log' | 'block' | 'ask';      // Escalation level
  message: string;
  recovered: boolean;
  details?: string[];
}

export class ErrorRecoveryHandler {
  /**
   * Classify error: determine which error class it belongs to
   */
  classifyError(error: Error | string, context?: any): ErrorClass {
    const msg = typeof error === 'string' ? error : error.message;

    if (msg.includes('token') || msg.includes('budget')) return 'TOKEN_LIMIT';
    if (msg.includes('EACCES') || msg.includes('ENOENT') || msg.includes('LOCK')) return 'CORRUPTED_FILE';
    if (msg.includes('conflict') || msg.includes('CONFLICT')) return 'GIT_CONFLICT';
    if (msg.includes('stale') || msg.includes('memory')) return 'STALE_MEMORY';
    if (msg.includes('429') || msg.includes('rate limit')) return 'RATE_LIMIT';
    if (msg.includes('not found') && (msg.includes('npm') || msg.includes('git') || msg.includes('python'))) {
      return 'MISSING_INFRASTRUCTURE';
    }
    if (msg.includes('not found') && (msg.includes('eslint') || msg.includes('coverage'))) {
      return 'TOOL_INFRASTRUCTURE';
    }

    return 'MISSING_INFRASTRUCTURE'; // Default
  }

  /**
   * Handle Token Limit (exit gracefully at 70%)
   * Action: LOG + ask user before continuing
   */
  async handleTokenLimit(tokensUsed: number, tokensBudget: number): Promise<RecoveryResult> {
    const percentage = tokensBudget > 0 ? (tokensUsed / tokensBudget) * 100 : 0;
    return {
      class: 'TOKEN_LIMIT',
      detected: percentage >= 70,
      action: 'ask',
      message: `Token budget at ${Math.floor(percentage)}%. Graceful exit recommended.`,
      recovered: true,
      details: [
        'Session can continue but less buffer for errors',
        'Consider: commit work, write handover, exit session',
        'Next session will resume from handover.md'
      ]
    };
  }

  /**
   * Handle Corrupted File (attempt repair or escalate)
   * Action: LOG first, then BLOCK if critical
   */
  async handleCorruptedFile(filePath: string, error: Error): Promise<RecoveryResult> {
    const msg = error.message;
    let recovered = false;

    if (msg.includes('EACCES')) {
      return {
        class: 'CORRUPTED_FILE',
        detected: true,
        action: 'block',
        message: `Permission denied: ${filePath}`,
        recovered: false,
        details: ['User must fix file permissions', `Run: chmod 644 ${filePath}`]
      };
    }

    // For locks/ENOENT, retry can help
    return {
      class: 'CORRUPTED_FILE',
      detected: true,
      action: 'log',
      message: `File issue: ${filePath}`,
      recovered: false,
      details: ['Attempting retry...']
    };
  }

  /**
   * Handle Git Conflict (user must resolve manually)
   * Action: BLOCK (requires manual resolution)
   */
  async handleGitConflict(conflictedFiles: string[]): Promise<RecoveryResult> {
    return {
      class: 'GIT_CONFLICT',
      detected: true,
      action: 'block',
      message: `Merge conflicts in ${conflictedFiles.length} file(s)`,
      recovered: false,
      details: [
        `Conflicted files: ${conflictedFiles.join(', ')}`,
        'User must resolve conflicts manually',
        'Next session: continue after resolving'
      ]
    };
  }

  /**
   * Handle Stale Memory (trust session state over mem0)
   * Action: LOG (non-blocking)
   */
  async handleStaleMemory(entry: string): Promise<RecoveryResult> {
    return {
      class: 'STALE_MEMORY',
      detected: true,
      action: 'log',
      message: 'mem0 data appears stale',
      recovered: true,
      details: [
        'Session state takes precedence',
        'Adding fresh memory entry for next session',
        `Stale entry: "${entry}"`
      ]
    };
  }

  /**
   * Handle Rate Limit (exponential backoff + retry)
   * Action: LOG (retryable)
   */
  async handleRateLimit(service: string, retryCount: number = 3): Promise<RecoveryResult> {
    const backoffMS = Math.pow(2, retryCount) * 1000;
    return {
      class: 'RATE_LIMIT',
      detected: true,
      action: 'log',
      message: `${service} rate limited`,
      recovered: retryCount < 3,
      details: [
        `Backing off for ${backoffMS}ms before retry ${retryCount}`,
        'If retries exhausted: queue feature for next session'
      ]
    };
  }

  /**
   * Handle Missing Infrastructure (npm, git, python missing)
   * Action: BLOCK (critical dependencies)
   */
  async handleMissingInfrastructure(tool: string): Promise<RecoveryResult> {
    return {
      class: 'MISSING_INFRASTRUCTURE',
      detected: true,
      action: 'block',
      message: `Critical tool missing: ${tool}`,
      recovered: false,
      details: [
        `${tool} is required but not found`,
        'User must install before feature can proceed',
        `Example: npm install ${tool}`
      ]
    };
  }

  /**
   * Handle Tool Infrastructure Failure (eslint, coverage reporter missing)
   * Action: LOG (optional tools) or BLOCK (critical tools)
   */
  async handleToolInfrastructure(tool: string, critical: boolean = false): Promise<RecoveryResult> {
    return {
      class: 'TOOL_INFRASTRUCTURE',
      detected: true,
      action: critical ? 'block' : 'log',
      message: `Tool not available: ${tool}`,
      recovered: !critical,
      details: critical
        ? [`${tool} is required for this feature`]
        : [`${tool} skipped (optional). Quality gate will be skipped.`]
    };
  }
}
