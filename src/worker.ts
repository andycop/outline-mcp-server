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
  // Set global environment variables from Cloudflare env binding
  (globalThis as any).OUTLINE_API_KEY = env.OUTLINE_API_KEY;
  (globalThis as any).OUTLINE_API_URL = env.OUTLINE_API_URL;

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
 * Exported as a Durable Object for Cloudflare Workers
 */
export class OutlineMCP extends McpAgent<Env> {
  server = new McpServer({
    name: 'outline-mcp-server',
    version: '5.5.0',
    description: 'Outline Model Context Protocol server',
  });

  async init() {
    // Load and register all tools
    await loadAllTools(tool =>
      this.server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
        },
        tool.callback
      )
    );
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

// Create the MCP handler
const mcpHandler = OutlineMCP.serve("/mcp", {
  binding: "MCP_OBJECT"
});

/**
 * Main Cloudflare Workers fetch handler
 * Handles health checks and routes MCP requests to the agent
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
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

    // Delegate all other requests to the MCP handler
    return mcpHandler.fetch(request, env, ctx);
  },
};
