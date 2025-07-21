#!/bin/bash

# Test the list_tools request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js 