#!/bin/bash
set -e
cd "$(dirname "$0")/.."
echo "Building Cloudflare Worker..."
rm -rf build/worker
echo "Compiling TypeScript..."
npx tsc -p tsconfig.worker.json
echo "Replacing module imports for Cloudflare Workers compatibility..."
find build/worker -name "*.js" -type f -exec sed -i 's/\/outlineClient\.js/\/outlineClientWorker.js/g' {} +
echo "Removing Node.js specific files..."
rm -f build/worker/outline/outlineClient.js
rm -f build/worker/utils/loadAllTools.js
echo "Build complete!"