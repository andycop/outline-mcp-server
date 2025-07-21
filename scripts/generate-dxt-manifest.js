#!/usr/bin/env node

/**
 * Generate DXT Manifest Script
 * Creates a complete DXT manifest from package.json as single source of truth
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Read package.json as single source of truth
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

// Get tools from the compiled tools directory
const toolsDir = path.join(projectRoot, 'build/tools');
const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js'));

// Extract tool information from the compiled files
const tools = [];
for (const file of toolFiles) {
  const toolPath = path.join(toolsDir, file);
  const toolContent = fs.readFileSync(toolPath, 'utf8');

  // Extract tool name and description using regex
  const nameMatch = toolContent.match(/register\(['"]([^'"]+)['"],/);
  const descMatch = toolContent.match(/description:\s*['"]([^'"]+)['"]/);

  if (nameMatch && descMatch) {
    tools.push({
      name: nameMatch[1],
      description: descMatch[1],
    });
  }
}

// Sort tools by name for consistency
tools.sort((a, b) => a.name.localeCompare(b.name));

// Generate complete manifest from package.json
const manifest = {
  dxt_version: '0.1',
  name: packageJson.name + '-dxt',
  display_name: 'Outline MCP Extension',
  version: packageJson.version,
  description: packageJson.description,
  long_description: `This Desktop Extension enables AI agents to manage documents, collections, comments, and users in Outline workspaces. It provides comprehensive tools for document creation, editing, searching, and organization, allowing for seamless integration between AI assistants and Outline's knowledge management platform. The extension supports all major Outline API operations including natural language document queries, template creation, and collaborative features.`,
  author: packageJson.author,
  repository: packageJson.repository,
  homepage: packageJson.homepage || packageJson.repository?.url,
  documentation: packageJson.repository?.url
    ? `${packageJson.repository.url}/blob/main/README.md`
    : undefined,
  support: packageJson.repository?.url ? `${packageJson.repository.url}/issues` : undefined,
  icon: 'assets/icon.png',
  server: {
    type: 'node',
    entry_point: 'dxt-server/index.js',
    mcp_config: {
      command: 'node',
      args: ['${__dirname}/dxt-server/index.js'],
      env: {
        OUTLINE_API_KEY: '${user_config.api_key}',
        OUTLINE_API_URL: '${user_config.api_url}',
        NODE_ENV: 'production',
      },
    },
  },
  tools: tools,
  keywords: packageJson.keywords || [],
  license: packageJson.license,
  compatibility: {
    claude_desktop: '>=0.10.0',
    platforms: ['darwin', 'win32', 'linux'],
    runtimes: {
      node: packageJson.engines?.node || '>=20.0.0',
    },
  },
  user_config: {
    api_key: {
      type: 'string',
      title: 'Outline API Key',
      description:
        'Your Outline API key for authentication. Get this from your Outline workspace settings.',
      sensitive: true,
      required: true,
    },
    api_url: {
      type: 'string',
      title: 'Outline API URL',
      description:
        'The base URL for your Outline API. Use the default for Outline.com hosted instances.',
      default: 'https://app.getoutline.com/api',
      required: false,
    },
  },
};

// Remove undefined values to clean up the manifest
const cleanManifest = JSON.parse(
  JSON.stringify(manifest, (key, value) => {
    return value === undefined ? undefined : value;
  })
);

// Ensure dist directory exists
const distDir = path.join(projectRoot, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Write the manifest to dist directory
const manifestPath = path.join(distDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(cleanManifest, null, 2));

console.log(`✅ Generated DXT manifest at ${manifestPath}`);
console.log(`📊 Version: ${packageJson.version}`);
console.log(`📋 Tools: ${tools.length} tools - ${tools.map(t => t.name).join(', ')}`);
console.log(`🏷️  Keywords: ${packageJson.keywords?.join(', ') || 'none'}`);
console.log(
  `👤 Author: ${typeof packageJson.author === 'object' ? packageJson.author.name : packageJson.author}`
);
console.log(`📦 Package: ${packageJson.name} -> ${cleanManifest.name}`);
