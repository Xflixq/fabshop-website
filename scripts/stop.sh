#!/bin/bash

echo "🛑 Stopping all services..."
echo ""

# Kill pnpm dev processes (all three services)
pkill -f "pnpm.*dev" 2>/dev/null || true

# Kill node processes (API server executable)
if pkill -f "node.*dist/index.mjs" 2>/dev/null; then
    echo "✓ API Server stopped"
else
    echo "  API Server not running"
fi

# Kill vite processes (frontends)
if pkill -f "vite" 2>/dev/null; then
    echo "✓ Frontend dev servers stopped"
else
    echo "  Frontend servers not running"
fi

echo ""
echo "✅ All services stopped."
