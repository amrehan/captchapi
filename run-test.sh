#!/bin/bash
set -e

# start server in background
npm run dev &
SERVER_PID=$!

# wait until it's accepting connections
echo "waiting for server..."
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do sleep 0.5; done

# run test
npx tsx test.ts
EXIT_CODE=$?

# cleanup
kill $SERVER_PID 2>/dev/null
exit $EXIT_CODE
