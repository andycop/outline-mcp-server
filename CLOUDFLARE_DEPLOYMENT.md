# Cloudflare Workers Deployment

This repository includes configuration for deploying the Outline MCP Server to Cloudflare Workers for global, serverless hosting.

## Setup

### 1. Install Dependencies

First, install the additional Cloudflare Workers dependencies:

```bash
npm install
```

### 2. Install Wrangler CLI

If you don't have Wrangler installed globally:

```bash
npm install -g wrangler
```

### 3. Authenticate with Cloudflare

```bash
wrangler login
```

### 4. Configure Environment Variables

Set up your environment variables as secrets in Cloudflare:

```bash
# Required: Your Outline API key
wrangler secret put OUTLINE_API_KEY

# Required: Your Outline API URL (usually https://app.getoutline.com/api)
wrangler secret put OUTLINE_API_URL
```

### 5. Update Wrangler Configuration

Edit `wrangler.toml` to customize:

- `name`: Your worker name
- `routes`: Custom domains (if needed)
- `vars`: Non-sensitive environment variables

## Development

### Local Development

Start the development server:

```bash
npm run dev:worker
```

This will start a local Cloudflare Workers environment at `http://localhost:8787`

### Build for Production

Build the worker version:

```bash
npm run build:worker
```

## Deployment

### Deploy to Production

```bash
npm run deploy
```

### Deploy to Staging

```bash
npm run deploy:staging
```

## Usage

Once deployed, your MCP server will be available at:

- Production: `https://outline-mcp-server.<your-subdomain>.workers.dev/mcp`
- Staging: `https://outline-mcp-server-staging.<your-subdomain>.workers.dev/mcp`

### Endpoints

- `POST /mcp` - Main MCP JSON-RPC endpoint
- `GET /health` - Health check endpoint
- `GET /` - Service information

### Authentication

The worker supports multiple authentication methods:

1. **Environment Variable**: Set `OUTLINE_API_KEY` as a Cloudflare secret
2. **Request Headers**: 
   - `x-outline-api-key: your-api-key`
   - `outline-api-key: your-api-key`
   - `authorization: Bearer your-api-key`

### Example Request

```bash
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "x-outline-api-key: your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

## Configuration

### Environment Variables

Set these as Cloudflare secrets:

- `OUTLINE_API_KEY` (required): Your Outline API key
- `OUTLINE_API_URL` (required): Your Outline API URL

### Wrangler Configuration

Key configuration options in `wrangler.toml`:

```toml
# Worker settings
name = "outline-mcp-server"
main = "build/worker/worker.js"
compatibility_date = "2024-07-15"
node_compat = true

# Environment-specific settings
[env.production]
name = "outline-mcp-server"

[env.staging]  
name = "outline-mcp-server-staging"

# Custom domains (optional)
[env.production]
routes = [
  { pattern = "mcp.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

## Limitations

The Cloudflare Workers version has some differences from the Node.js version:

1. **No SSE Support**: Only the JSON-RPC HTTP endpoint is supported
2. **Stateless**: Each request creates a new MCP server instance
3. **Size Limits**: Code size must be under 1MB compressed
4. **Execution Time**: Requests must complete within 30 seconds

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Run `npm run build:worker` before deploying
2. **API key errors**: Ensure secrets are set with `wrangler secret put`
3. **CORS issues**: The worker includes CORS headers for cross-origin requests

### Debugging

View logs in real-time:

```bash
wrangler tail
```

Check deployment status:

```bash
wrangler deployments list
```

### Performance Monitoring

The worker includes basic observability:

- Health check endpoint at `/health`
- Error logging to Cloudflare dashboard
- Request metrics in Cloudflare Analytics

## Migration from Node.js

To migrate from the Node.js version:

1. Your existing MCP tools will work unchanged
2. Update client URLs to point to the Workers endpoint
3. Set environment variables as Cloudflare secrets instead of `.env` files
4. Use the `/mcp` endpoint instead of separate `/sse` and `/messages` endpoints

## Cost Considerations

Cloudflare Workers offers:

- 100,000 requests/day on free tier
- $5/month for 10M requests on paid tier
- No cold start delays
- Global edge deployment

Perfect for production MCP server hosting!
