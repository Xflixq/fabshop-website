#!/bin/bash

set -e

# Check if .env file exists
if [ ! -f "$(dirname "$0")/../.env" ]; then
    echo "Error: .env file not found. Please create .env with required variables."
    echo "Required: MYSQL_*, GOOGLE_*, SESSION_SECRET, etc."
    exit 1
fi

echo "🔥 FabShop Development Server"
echo ""
echo "Starting services with Google OAuth authentication..."
echo ""

# Enable error handling for background processes
trap 'echo "\nShutting down..." && kill $API_PID $STORE_PID $ADMIN_PID 2>/dev/null || true' EXIT INT

# Start all services in parallel
# Each service loads .env via dotenv-cli in package.json scripts
pnpm -F @workspace/api-server dev &
API_PID=$!

pnpm -F @workspace/weld-supply-store dev &
STORE_PID=$!

pnpm -F @workspace/fabshop-admin dev &
ADMIN_PID=$!

echo "✓ API Server started (PID: $API_PID)"
echo "  → API: http://localhost:8080"
echo "  → Auth endpoints: /api/auth/google, /api/auth/status, /api/auth/logout"
echo ""
echo "✓ Weld Supply Store started (PID: $STORE_PID)"
echo "  → Store: http://localhost:22689"
echo "  → Auth: /sign-in, /sign-up, /profile"
echo ""
echo "✓ Admin Dashboard started (PID: $ADMIN_PID)"
echo "  → Admin: http://localhost:20227/admin/"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: Development with Google OAuth"
echo "Database: Connected to MySQL"
echo "Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for all background processes
wait