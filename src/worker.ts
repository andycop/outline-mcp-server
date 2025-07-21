/**
 * Cloudflare Workers entry point for Outline MCP Server
 * This file adapts the existing MCP server to work with Cloudflare Workers using the Cloudflare Agents SDK
 */

import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadAllTools } from './utils/loadAllToolsWorker.js';
import { RequestContext } from './utils/toolRegistry.js';

// Define types for Cloudflare Workers environment
interface Env {
  OUTLINE_API_KEY?: string;
  OUTLINE_API_URL?: string;
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
 * Outline MCP Agent implementation using Cloudflare Agents SDK
 */
export class OutlineMCP extends McpAgent<Env> {
  server = (async () => {
    const mcpServer = new McpServer({
      name: process.env.npm_package_name || 'outline-mcp-server',
      version: process.env.npm_package_version || 'unknown',
      description: 'Outline Model Context Protocol server',
    });

    // Load and register all tools
    await loadAllTools(tool =>
      mcpServer.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
        },
        tool.callback
      )
    );

    // Type cast to resolve version mismatch between SDK versions
    return mcpServer as any;
  })();

  async init() {
    // Server initialization is handled in the server property
    // Set up request context based on the current request
    // Note: This will need to be handled per-request
  }

  async fetch(request: Request): Promise<Response> {
    try {
      setupRequestContext(request, this.env);
      return await super.fetch(request);
    } catch (error: any) {
      console.error('Error setting up request context:', error.message);
      // Clean up context on error
      RequestContext.resetInstance();
      throw error;
    } finally {
      // Always clean up context after request
      RequestContext.resetInstance();
    }
  }
}

/**
 * Main Cloudflare Workers fetch handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-outline-api-key, outline-api-key, authorization',
        },
      });
    }

    // Handle MCP endpoint using the Agents SDK
    if (url.pathname === '/mcp') {
      const mcpHandler = OutlineMCP.serve('/mcp', {
        corsOptions: {
          origin: '*',
          methods: 'POST, OPTIONS',
          headers: 'Content-Type, x-outline-api-key, outline-api-key, authorization',
        }
      });
      return await mcpHandler.fetch(request, env, ctx);
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
