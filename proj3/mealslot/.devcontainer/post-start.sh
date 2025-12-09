#!/usr/bin/env bash

echo "🚀 Starting dev servers..."

# Start Next.js in background
pnpm dev &

# Start WebSocket server (if exists)
if [ -d "ws-server" ]; then
  cd ws-server
  pnpm install
  pnpm dev &
  cd ..
fi

echo "✔️ Servers running!"
