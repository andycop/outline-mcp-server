#!/usr/bin/env node

/**
 * Outline MCP Desktop Extension (DXT) Server
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import toolRegistry from './utils/toolRegistry.js';
import { getMcpServer } from './utils/getMcpServer.js';
import logger from './utils/logger.js';

// Configuration - Note: environment variables are set by the DXT runtime
const CONFIG = {
  OUTLINE_API_KEY: process.env.OUTLINE_API_KEY,
  OUTLINE_API_URL: process.env.OUTLINE_API_URL || 'https://app.getoutline.com/api',
};

// Error handling for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the server
async function startServer() {
  try {
    logger.info('Starting Outline MCP DXT Server...');

    const server = await getMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('Outline MCP DXT Server started successfully');
    logger.info('Server configuration:', {
      apiUrl: CONFIG.OUTLINE_API_URL,
      toolsLoaded: `${toolRegistry.tools.length} tools loaded: ${toolRegistry.tools.map(t => t.name).join(', ')}`,
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
