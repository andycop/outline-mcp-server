import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('update_comment', {
  name: 'update_comment',
  description: 'Update an existing comment',
  inputSchema: {
    id: z.string().describe('ID of the comment to update'),
    text: z.string().describe('New content for the comment in markdown format').optional(),
    data: z.object({}).describe('Additional data for the comment (optional)').optional(),
  },
  async callback(args) {
    try {
      const payload: Record<string, any> = {
        id: args.id,
      };

      if (args.text) {
        payload.text = args.text;
      }

      if (args.data) {
        payload.data = args.data;
      }

      const client = getOutlineClient();
      const response = await client.post('/comments.update', payload);
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error updating comment:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
