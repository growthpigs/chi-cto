/**
 * MCP Server Implementation for Cloudflare Workers
 * Routes HTTP requests to CLI command handlers
 */
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
export declare function handleRequest(request: Request): Promise<Response>;
/**
 * Cloudflare Workers fetch event handler
 * Called for every incoming request
 */
declare const _default: {
    fetch(request: Request): Promise<Response>;
};
export default _default;
//# sourceMappingURL=mcp.d.ts.map