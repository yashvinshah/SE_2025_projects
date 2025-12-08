#!/bin/bash
# Setup script for Codespaces - creates .env file if it doesn't exist

if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
  echo "✅ .env file created"
else
  echo "✅ .env file already exists"
fi

# Verify DATABASE_URL is set
if grep -q "DATABASE_URL" .env; then
  echo "✅ DATABASE_URL is configured"
else
  echo "⚠️  DATABASE_URL not found in .env"
fi

