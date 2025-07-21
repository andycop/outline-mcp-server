import toolRegistry, { ToolDefinition } from './toolRegistry.js';

// Manually import all tools for Cloudflare Workers compatibility
import '../tools/archiveDocument.js';
import '../tools/askDocuments.js';
import '../tools/createCollection.js';
import '../tools/createComment.js';
import '../tools/createDocument.js';
import '../tools/createTemplateFromDocument.js';
import '../tools/deleteComment.js';
import '../tools/deleteDocument.js';
import '../tools/getCollection.js';
import '../tools/getDocument.js';
import '../tools/listCollections.js';
import '../tools/listDocuments.js';
import '../tools/listUsers.js';
import '../tools/moveDocument.js';
import '../tools/searchDocuments.js';
import '../tools/updateCollection.js';
import '../tools/updateComment.js';
import '../tools/updateDocument.js';

/**
 * Loads all tools for Cloudflare Workers environment
 * Uses static imports instead of dynamic file system operations
 */
export async function loadAllTools(onToolLoaded?: (tool: ToolDefinition<any, any>) => unknown) {
  // All tools have been imported statically above
  // Now configure McpServer with all definitions
  for (const tool of toolRegistry.tools) {
    await onToolLoaded?.(tool);
  }
}