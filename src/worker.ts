/**
 * Cloudflare Workers entry point for Outline MCP Server
 * This file adapts the existing MCP server to work with Cloudflare Workers
 */

import { getMcpServer } from './utils/getMcpServer.js';
import { RequestContext } from './utils/toolRegistry.js';

// Cloudflare Workers globals are available
declare global {
  const console: Console;
}

/**
 * Extracts API key from request headers
 */
function extractApiKey(request: Request): string | undefined {
  return (
    request.headers.get('x-outline-api-key') ||
    request.headers.get('outline-api-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  );
}

/**
 * Sets up request context with API key
 */
function setupRequestContext(request: Request, env: Env): void {
  const apiKey = extractApiKey(request);
  const envApiKey = env.OUTLINE_API_KEY;

  if (apiKey) {
    const context = RequestContext.getInstance();
    context.setApiKey(apiKey);
    console.log('Using API key from request headers');
  } else if (envApiKey) {
    const context = RequestContext.getInstance();
    context.setApiKey(envApiKey);
    console.log('Using API key from environment variable');
  } else {
    console.log('No API key provided in headers and no default environment variable set.');
    throw new Error(
      'API key required: Set OUTLINE_API_KEY environment variable or provide x-outline-api-key header'
    );
  }
}

/**
 * Creates a proper error response
 */
function createErrorResponse(code: number, message: string, id: any = null): Response {
  const statusCode = code === -32603 ? 500 : code === -32000 ? 405 : 400;
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code, message },
      id,
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-outline-api-key, outline-api-key, authorization',
      },
    }
  );
}

/**
 * Handles CORS preflight requests
 */
function handleCORS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-outline-api-key, outline-api-key, authorization',
    },
  });
}

/**
 * Environment interface for type safety
 */
interface Env {
  OUTLINE_API_KEY?: string;
  OUTLINE_API_URL?: string;
}

/**
 * Handles MCP requests by processing JSON-RPC calls directly
 */
async function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  try {
    setupRequestContext(request, env);
    
    const body = await request.json() as any;
    const mcpServer = await getMcpServer();
    
    // Handle JSON-RPC method calls directly
    let result: any;
    
    switch (body.method) {
      case 'initialize':
        result = await mcpServer.initialize(body.params || {});
        break;
      case 'tools/list':
        result = await mcpServer.list_tools();
        break;
      case 'tools/call':
        if (!body.params?.name) {
          throw new Error('Tool name is required');
        }
        result = await mcpServer.call_tool(body.params.name, body.params.arguments || {});
        break;
      default:
        throw new Error(`Unknown method: ${body.method}`);
    }

    const response = {
      jsonrpc: '2.0',
      result,
      id: body.id,
    };

    RequestContext.resetInstance();
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Error in MCP request:', error.message);
    RequestContext.resetInstance();
    return createErrorResponse(-32603, error.message || 'Internal server error', null);
  }
}

/**
 * Main Cloudflare Workers fetch handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Handle MCP endpoint
    if (url.pathname === '/mcp' && request.method === 'POST') {
      return handleMcpRequest(request, env);
    }

    // Handle health check
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          service: 'outline-mcp-server'
        }), 
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Handle root path with info
    if (url.pathname === '/') {
      return new Response(
        JSON.stringify({
          name: 'Outline MCP Server',
          description: 'A Model Context Protocol server for Outline API',
          endpoints: {
            '/mcp': 'POST - MCP JSON-RPC endpoint',
            '/health': 'GET - Health check',
          },
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Default 404 response
    return new Response('Not Found', { 
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
