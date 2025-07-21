import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('list_users', {
  name: 'list_users',
  description: 'List all users in the Outline workspace',
  inputSchema: {
    offset: z.number().describe('Pagination offset (optional)').optional(),
    limit: z.number().describe('Maximum number of users to return (optional)').optional(),
    sort: z
      .string()
      .describe('Field to sort by (e.g. "name", "email", "createdAt") (optional)')
      .optional(),
    direction: z
      .enum(['ASC', 'DESC'])
      .describe('Sort direction, either "ASC" or "DESC" (optional)')
      .optional(),
    query: z.string().describe('Search query to filter users (optional)').optional(),
    emails: z.array(z.string()).describe('Filter by email addresses (optional)').optional(),
    filter: z
      .enum(['all', 'invited', 'active', 'suspended'])
      .describe('Filter by user status (optional)')
      .optional(),
    role: z
      .enum(['admin', 'member', 'viewer', 'guest'])
      .describe('Filter by user role (optional)')
      .optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {};

      if (args.offset !== undefined) {
        payload.offset = args.offset;
      }

      if (args.limit !== undefined) {
        payload.limit = args.limit;
      }

      if (args.sort) {
        payload.sort = args.sort;
      }

      if (args.direction) {
        payload.direction = args.direction;
      }

      if (args.query) {
        payload.query = args.query;
      }

      if (args.emails && args.emails.length > 0) {
        payload.emails = args.emails;
      }

      if (args.filter) {
        payload.filter = args.filter;
      }

      if (args.role) {
        payload.role = args.role;
      }

      const client = getOutlineClient();
      const response = await client.post('/users.list', payload);
      return {
        content: [
          { type: 'text', text: `users: ${JSON.stringify(response.data.data)}` },
          { type: 'text', text: `pagination: ${JSON.stringify(response.data.pagination)}` },
        ],
      };
    } catch (error: any) {
      console.error('Error listing users:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
