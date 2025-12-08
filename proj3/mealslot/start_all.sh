#!/usr/bin/env bash

# ==========================================================

# start_all.sh

# Simple startup script for Codespaces & local dev

# ==========================================================

# --- Helper Functions ---

is_port_in_use() {
lsof -i:"$1" >/dev/null 2>&1 || fuser "$1/tcp" >/dev/null 2>&1
}

kill_port() {
local port=$1
local pids
pids=$(lsof -t -i:"$port" 2>/dev/null || fuser "$port/tcp" 2>/dev/null || true)
if [ -n "$pids" ]; then
echo "⚠️ Port $port in use, killing process(es): $pids"
kill -9 $pids 2>/dev/null || true
sleep 0.2
fi
}

# --- Main Script ---

echo "🔹 Checking ports and killing any running servers..."
kill_port 3000
kill_port 4001

echo "🔹 Making scripts executable..."
chmod +x .devcontainer/post-create.sh .devcontainer/post-start.sh

echo "🔹 Setting up environment and database..."
DB_FILE="./dev.db"
if [ ! -f "$DB_FILE" ]; then
echo "🗄 Database missing, running migrations + seed..."
bash .devcontainer/post-create.sh || true
else
echo "✅ Database exists, skipping migrations"
fi

echo "🔹 Starting servers..."
if ! is_port_in_use 3000; then
echo "🚀 Starting Next.js on port 3000..."
pnpm dev &
else
echo "⚠️ Port 3000 in use, skipping Next.js start"
fi

if [ -d "ws-server" ]; then
if ! is_port_in_use 4001; then
echo "🚀 Starting WS Server on port 4001..."
(cd ws-server && pnpm dev &) || true
else
echo "⚠️ Port 4001 in use, skipping WS Server start"
fi
fi

echo "✅ Startup complete!"
echo "Next.js → [http://localhost:3000](http://localhost:3000)"
echo "WS Server → [http://localhost:4001](http://localhost:4001) (if used)"
