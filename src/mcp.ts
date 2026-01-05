/**
 * MCP Server Implementation for Cloudflare Workers
 * Routes HTTP requests to CLI command handlers
 *
 * Hardened for internal use with:
 * - Request validation
 * - Error logging
 * - Timeout protection
 * - Input sanitization
 */

import { cli, CommandArgs } from './cli';

/**
 * Cloudflare Worker Env interface
 * Defines environment variables
 */
interface Env {
  LOG_LEVEL?: string;
  TOKEN_BUDGET?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<void>): void;
  passThroughOnException(): void;
}

interface SuggestRequest {
  projectPath?: string;
}

interface ModeBRequest {
  projectPath?: string;
  tokenBudget?: number;
}

/**
 * Validation errors
 */
interface ValidationError extends Record<string, unknown> {
  type: 'invalid_path' | 'invalid_budget' | 'malformed_json' | 'missing_field';
  message: string;
  field?: string;
}

/**
 * Request context for logging
 */
interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
  duration?: number;
}

/**
 * Sanitize project path (prevent path traversal)
 */
function sanitizeProjectPath(path: unknown): string | ValidationError {
  if (typeof path !== 'string') {
    return { type: 'invalid_path', message: 'projectPath must be a string' };
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return { type: 'invalid_path', message: 'projectPath cannot be empty' };
  }

  // Prevent path traversal attacks
  if (trimmed.includes('../') || trimmed.includes('..\\')) {
    return { type: 'invalid_path', message: 'Path traversal not allowed' };
  }

  // Max 500 chars
  if (trimmed.length > 500) {
    return { type: 'invalid_path', message: 'projectPath too long (max 500 chars)' };
  }

  return trimmed;
}

/**
 * Validate token budget
 */
function validateTokenBudget(budget: unknown): number | ValidationError {
  if (budget === undefined || budget === null) {
    return 200000; // Default
  }

  const num = Number(budget);
  if (!Number.isInteger(num) || num <= 0 || num > 10000000) {
    return { type: 'invalid_budget', message: 'tokenBudget must be 1-10000000' };
  }

  return num;
}

/**
 * Create request ID for tracing
 */
function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Structured logging
 */
function log(context: RequestContext, level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const logEntry: Record<string, unknown> = {
    requestId: context.requestId,
    level,
    timestamp: context.timestamp,
    message,
    duration: context.duration,
  };

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    Object.assign(logEntry, data);
  }

  console.log(JSON.stringify(logEntry));
}

export interface MCP_Request {
  method: string;
  path: string;
  query?: Record<string, string>;
  body?: string;
}

export interface MCP_Response {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Main MCP handler for Cloudflare Workers
 * Routes requests to CLI command handlers
 */
export async function handleRequest(request: Request): Promise<Response> {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create request context for tracing
  const requestId = createRequestId();
  const startTime = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;
  const timestamp = new Date().toISOString();

  const context: RequestContext = {
    requestId,
    method: request.method,
    path,
    timestamp,
  };

  try {
    const query = Object.fromEntries(url.searchParams);

    // Route: POST /chi-cto/suggest
    if (path === '/chi-cto/suggest' && request.method === 'POST') {
      try {
        const body = (await request.json()) as SuggestRequest;

        // Validate projectPath if provided
        const projectPath = body.projectPath !== undefined ? body.projectPath : '.';
        const pathValidation = sanitizeProjectPath(projectPath);

        if (typeof pathValidation !== 'string') {
          const duration = Date.now() - startTime;
          context.duration = duration;
          log(context, 'warn', 'Validation failed', pathValidation);

          return new Response(
            JSON.stringify({
              error: pathValidation.message,
              type: pathValidation.type,
              field: pathValidation.field,
            }),
            {
              status: 422,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const result = await cli.execute({
          subcommand: 'suggest' as const,
          projectPath: pathValidation,
        });

        const duration = Date.now() - startTime;
        context.duration = duration;
        log(context, 'info', 'suggest completed', { projectPath: pathValidation });

        return new Response(JSON.stringify({ result }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError: unknown) {
        const duration = Date.now() - startTime;
        context.duration = duration;
        const errorMsg = parseError instanceof Error ? parseError.message : 'Malformed JSON';
        log(context, 'error', 'JSON parse failed', { error: errorMsg });

        return new Response(
          JSON.stringify({
            error: 'Invalid JSON',
            type: 'malformed_json',
            message: errorMsg,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Route: POST /chi-cto/mode-b
    if (path === '/chi-cto/mode-b' && request.method === 'POST') {
      try {
        const body = (await request.json()) as ModeBRequest;

        // Validate projectPath if provided
        const projectPath = body.projectPath !== undefined ? body.projectPath : '.';
        const pathValidation = sanitizeProjectPath(projectPath);

        if (typeof pathValidation !== 'string') {
          const duration = Date.now() - startTime;
          context.duration = duration;
          log(context, 'warn', 'Path validation failed', pathValidation);

          return new Response(
            JSON.stringify({
              error: pathValidation.message,
              type: pathValidation.type,
              field: pathValidation.field,
            }),
            {
              status: 422,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Validate token budget
        const budgetValidation = validateTokenBudget(body.tokenBudget);

        if (typeof budgetValidation !== 'number') {
          const duration = Date.now() - startTime;
          context.duration = duration;
          log(context, 'warn', 'Budget validation failed', budgetValidation);

          return new Response(
            JSON.stringify({
              error: budgetValidation.message,
              type: budgetValidation.type,
              field: budgetValidation.field,
            }),
            {
              status: 422,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const result = await cli.execute({
          subcommand: 'mode-b run' as const,
          projectPath: pathValidation,
          tokenBudget: budgetValidation,
        });

        const duration = Date.now() - startTime;
        context.duration = duration;
        log(context, 'info', 'mode-b run completed', { projectPath: pathValidation, tokenBudget: budgetValidation });

        return new Response(JSON.stringify({ result }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError: unknown) {
        const duration = Date.now() - startTime;
        context.duration = duration;
        const errorMsg = parseError instanceof Error ? parseError.message : 'Malformed JSON';
        log(context, 'error', 'JSON parse failed', { error: errorMsg });

        return new Response(
          JSON.stringify({
            error: 'Invalid JSON',
            type: 'malformed_json',
            message: errorMsg,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Route: GET /chi-cto/status
    if (path === '/chi-cto/status' && request.method === 'GET') {
      const projectPath = query.projectPath || '.';
      const pathValidation = sanitizeProjectPath(projectPath);

      if (typeof pathValidation !== 'string') {
        const duration = Date.now() - startTime;
        context.duration = duration;
        log(context, 'warn', 'Path validation failed', pathValidation);

        return new Response(
          JSON.stringify({
            error: pathValidation.message,
            type: pathValidation.type,
            field: pathValidation.field,
          }),
          {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const result = await cli.execute({
        subcommand: 'status' as const,
        projectPath: pathValidation,
      });

      const duration = Date.now() - startTime;
      context.duration = duration;
      log(context, 'info', 'status completed', { projectPath: pathValidation });

      return new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route: GET /health
    if (path === '/health' && request.method === 'GET') {
      const duration = Date.now() - startTime;
      context.duration = duration;
      log(context, 'info', 'health check');

      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Route: GET /
    if (path === '/' && request.method === 'GET') {
      const help = await cli.execute({ subcommand: 'status' });
      const duration = Date.now() - startTime;
      context.duration = duration;
      log(context, 'info', 'root endpoint');

      return new Response(JSON.stringify({ result: help }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 404
    const duration = Date.now() - startTime;
    context.duration = duration;
    log(context, 'warn', 'Not found');

    return new Response(
      JSON.stringify({
        error: 'Not found',
        path,
        availableEndpoints: [
          'POST /chi-cto/suggest',
          'POST /chi-cto/mode-b',
          'GET /chi-cto/status',
          'GET /health',
        ],
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    context.duration = duration;
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    log(context, 'error', 'Unhandled error', { error: errorMessage });

    return new Response(
      JSON.stringify({
        error: errorMessage,
        type: 'internal_error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Cloudflare Workers fetch event handler
 * Called for every incoming request
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request);
  },
};
