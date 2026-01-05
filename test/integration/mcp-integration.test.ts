import { handleRequest } from '../../src/mcp';

describe('MCP Integration', () => {
  test('should handle complete suggest workflow', async () => {
    const request = new Request('http://localhost/chi-cto/suggest', {
      method: 'POST',
      body: JSON.stringify({
        projectPath: 'test/fixtures/integration-test-project',
      }),
    });

    const response = await handleRequest(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');

    const body = await response.json();
    expect(body.result).toBeDefined();
    expect(typeof body.result).toBe('string');
  });

  test('should handle mode-b run workflow', async () => {
    const request = new Request('http://localhost/chi-cto/mode-b', {
      method: 'POST',
      body: JSON.stringify({
        projectPath: 'test/fixtures/integration-test-project',
        tokenBudget: 200000,
      }),
    });

    const response = await handleRequest(request);

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.result).toBeDefined();
  });

  test('should return health status', async () => {
    const request = new Request('http://localhost/health', {
      method: 'GET',
    });

    const response = await handleRequest(request);

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  test('should handle status endpoint with project path', async () => {
    const request = new Request('http://localhost/chi-cto/status?projectPath=test/fixtures/integration-test-project', {
      method: 'GET',
    });

    const response = await handleRequest(request);

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toBeDefined();
  });

  test('should handle CORS preflight requests', async () => {
    const request = new Request('http://localhost/chi-cto/suggest', {
      method: 'OPTIONS',
    });

    const response = await handleRequest(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
  });

  test('should validate request body for suggest endpoint', async () => {
    const request = new Request('http://localhost/chi-cto/suggest', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await handleRequest(request);

    // Should handle missing projectPath gracefully
    expect([200, 400, 422]).toContain(response.status);
  });

  test('should return appropriate error for nonexistent project path', async () => {
    const request = new Request('http://localhost/chi-cto/suggest', {
      method: 'POST',
      body: JSON.stringify({
        projectPath: '/nonexistent/path/that/does/not/exist',
      }),
    });

    const response = await handleRequest(request);

    expect([400, 404, 422]).toContain(response.status);
  });

  test('should handle POST requests with proper response format', async () => {
    const request = new Request('http://localhost/chi-cto/mode-b', {
      method: 'POST',
      body: JSON.stringify({
        projectPath: 'test/fixtures/integration-test-project',
        tokenBudget: 200000,
        options: { verbose: true },
      }),
    });

    const response = await handleRequest(request);

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('result');
  });
});
