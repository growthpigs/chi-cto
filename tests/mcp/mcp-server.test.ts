/**
 * MCP Server Tests
 * Verify HTTP request routing and response formatting
 */

import { handleRequest } from '../../src/mcp';

describe('MCP Server', () => {
  describe('Health Check', () => {
    test('GET /health returns 200 with ok status', async () => {
      const request = new Request('http://localhost/health', {
        method: 'GET',
      });

      const response = await handleRequest(request);

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
      expect(body.version).toBe('1.0.0');
    });
  });

  describe('Root Endpoint', () => {
    test('GET / returns help text', async () => {
      const request = new Request('http://localhost/', {
        method: 'GET',
      });

      const response = await handleRequest(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Suggest Endpoint', () => {
    test('POST /chi-cto/suggest returns result', async () => {
      const request = new Request('http://localhost/chi-cto/suggest', {
        method: 'POST',
        body: JSON.stringify({ projectPath: '.' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(200);

      const body = await response.json() as any;
      expect(body.result).toBeDefined();
      expect(typeof body.result).toBe('string');
    });

    test('POST /chi-cto/suggest with custom project path', async () => {
      const request = new Request('http://localhost/chi-cto/suggest', {
        method: 'POST',
        body: JSON.stringify({ projectPath: '/custom/path' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Mode B Endpoint', () => {
    test('POST /chi-cto/mode-b returns result', async () => {
      const request = new Request('http://localhost/chi-cto/mode-b', {
        method: 'POST',
        body: JSON.stringify({
          projectPath: '.',
          tokenBudget: 200000,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(200);

      const body = await response.json() as any;
      expect(body.result).toBeDefined();
      expect(typeof body.result).toBe('string');
    });

    test('POST /chi-cto/mode-b with default token budget', async () => {
      const request = new Request('http://localhost/chi-cto/mode-b', {
        method: 'POST',
        body: JSON.stringify({ projectPath: '.' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Status Endpoint', () => {
    test('GET /chi-cto/status returns result', async () => {
      const request = new Request('http://localhost/chi-cto/status', {
        method: 'GET',
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(200);

      const body = await response.json() as any;
      expect(body.result).toBeDefined();
    });

    test('GET /chi-cto/status with query parameters', async () => {
      const request = new Request(
        'http://localhost/chi-cto/status?projectPath=/custom/path',
        {
          method: 'GET',
        }
      );

      const response = await handleRequest(request);
      expect(response.status).toBe(200);
    });
  });

  describe('CORS Headers', () => {
    test('OPTIONS request returns CORS headers', async () => {
      const request = new Request('http://localhost/chi-cto/suggest', {
        method: 'OPTIONS',
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'GET, POST, OPTIONS'
      );
    });

    test('All responses include CORS headers', async () => {
      const request = new Request('http://localhost/health', {
        method: 'GET',
      });

      const response = await handleRequest(request);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Error Handling', () => {
    test('GET /nonexistent returns 404', async () => {
      const request = new Request('http://localhost/nonexistent', {
        method: 'GET',
      });

      const response = await handleRequest(request);

      expect(response.status).toBe(404);
      const body = await response.json() as any;
      expect(body.error).toBe('Not found');
      expect(body.availableEndpoints).toBeDefined();
      expect(body.availableEndpoints.length).toBeGreaterThan(0);
    });

    test('POST to non-existent endpoint returns 404', async () => {
      const request = new Request('http://localhost/invalid/endpoint', {
        method: 'POST',
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(404);
    });
  });

  describe('Content-Type Headers', () => {
    test('JSON endpoints return application/json', async () => {
      const request = new Request('http://localhost/health', {
        method: 'GET',
      });

      const response = await handleRequest(request);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Request Routing', () => {
    test('Routes are case-sensitive', async () => {
      const request = new Request('http://localhost/CHI-CTO/suggest', {
        method: 'POST',
        body: JSON.stringify({ projectPath: '.' }),
      });

      const response = await handleRequest(request);
      expect(response.status).toBe(404);
    });

    test('Query parameters are parsed correctly', async () => {
      const request = new Request(
        'http://localhost/chi-cto/status?projectPath=/path&other=value',
        {
          method: 'GET',
        }
      );

      const response = await handleRequest(request);
      expect(response.status).toBe(200);
    });
  });
});
