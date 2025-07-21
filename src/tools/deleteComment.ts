import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Register this tool
toolRegistry.register('delete_comment', {
  name: 'delete_comment',
  description: 'Delete a comment from a document',
  inputSchema: {
    id: z.string().describe('ID of the comment to delete'),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/comments.delete', {
        id: args.id,
      });
      return { content: [{ type: 'text', text: JSON.stringify(response.data.success) }] };
    } catch (error: any) {
      console.error('Error deleting comment:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
