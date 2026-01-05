/**
 * MCP Server Implementation for Cloudflare Workers
 * Routes HTTP requests to CLI command handlers
 */

import { cli, CommandArgs } from './cli';

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

  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const query = Object.fromEntries(url.searchParams);

    // Log request (development)
    console.log(`[${new Date().toISOString()}] ${request.method} ${path}`, {
      query,
    });

    // Route: POST /chi-cto/suggest
    if (path === '/chi-cto/suggest' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const result = await cli.execute({
        subcommand: 'suggest' as const,
        projectPath: body.projectPath,
      });

      return new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route: POST /chi-cto/mode-b
    if (path === '/chi-cto/mode-b' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const result = await cli.execute({
        subcommand: 'mode-b run' as const,
        projectPath: body.projectPath,
        tokenBudget: body.tokenBudget || 200000,
      });

      return new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route: GET /chi-cto/status
    if (path === '/chi-cto/status' && request.method === 'GET') {
      const projectPath = query.projectPath || '.';
      const result = await cli.execute({
        subcommand: 'status' as const,
        projectPath,
      });

      return new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route: GET /health
    if (path === '/health' && request.method === 'GET') {
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
      return new Response(help, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 404
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
  } catch (error: any) {
    console.error('Error handling request:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
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
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
