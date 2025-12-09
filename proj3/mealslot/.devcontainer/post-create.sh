#!/usr/bin/env bash

echo "🔧 Setting up environment..."

# Enable pnpm through corepack
corepack enable
corepack prepare pnpm@latest --activate

echo "📦 Installing dependencies..."
pnpm install

echo "🔌 Setting up environment variables..."
cp -n .env.example .env.local || true

# 🔥 Load .env.local into current shell (important!)
set -a
source .env.local
set +a

echo "🗄 Running Prisma migrations..."
pnpm prisma db push

echo "🌱 Seeding database..."
pnpm prisma db seed

echo "✔️ post-create complete!"