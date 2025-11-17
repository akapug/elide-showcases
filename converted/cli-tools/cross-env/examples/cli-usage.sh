#!/bin/bash
# Cross-Env CLI Usage Examples
# Demonstrates various ways to use cross-env from the command line

echo "=== Cross-Env CLI Usage Examples ==="
echo ""

# Example 1: Set single environment variable
echo "1. Setting NODE_ENV to production:"
cross-env NODE_ENV=production node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
echo ""

# Example 2: Set multiple environment variables
echo "2. Setting multiple environment variables:"
cross-env NODE_ENV=test PORT=3000 DEBUG=true node -e "console.log('NODE_ENV:', process.env.NODE_ENV, 'PORT:', process.env.PORT, 'DEBUG:', process.env.DEBUG)"
echo ""

# Example 3: Using with npm scripts
echo "3. Using with npm commands:"
cross-env NODE_ENV=production npm run build
echo ""

# Example 4: Quoted values
echo "4. Using quoted values with spaces:"
cross-env MESSAGE="Hello World" APP_NAME="My Application" node -e "console.log(process.env.MESSAGE, '-', process.env.APP_NAME)"
echo ""

# Example 5: API keys and secrets
echo "5. Setting API keys:"
cross-env API_KEY="sk-1234567890" API_URL="https://api.example.com" node -e "console.log('API_KEY:', process.env.API_KEY, 'API_URL:', process.env.API_URL)"
echo ""

# Example 6: Database configuration
echo "6. Database configuration:"
cross-env \
  DB_HOST=localhost \
  DB_PORT=5432 \
  DB_NAME=myapp \
  DB_USER=admin \
  node -e "console.log('DB Config:', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME)"
echo ""

# Example 7: Build configurations
echo "7. Build configurations:"
cross-env \
  NODE_ENV=production \
  BUILD_TARGET=es2020 \
  MINIFY=true \
  SOURCE_MAPS=false \
  node -e "console.log('Build:', process.env.NODE_ENV, 'Target:', process.env.BUILD_TARGET)"
echo ""

# Example 8: Testing with different environments
echo "8. Running tests with test environment:"
cross-env NODE_ENV=test COVERAGE=true npm test
echo ""

# Example 9: Development server
echo "9. Starting development server:"
cross-env \
  NODE_ENV=development \
  PORT=3000 \
  HOT_RELOAD=true \
  node server.js &
SERVER_PID=$!
sleep 2
kill $SERVER_PID 2>/dev/null
echo ""

# Example 10: CI/CD environment
echo "10. CI/CD environment variables:"
cross-env \
  CI=true \
  NODE_ENV=production \
  BUILD_NUMBER=123 \
  GIT_COMMIT=abc123 \
  node -e "console.log('CI Build:', process.env.BUILD_NUMBER, 'Commit:', process.env.GIT_COMMIT)"
echo ""

# Example 11: Feature flags
echo "11. Feature flags:"
cross-env \
  FEATURE_NEW_UI=true \
  FEATURE_ANALYTICS=false \
  FEATURE_BETA=true \
  node -e "console.log('Features:', process.env.FEATURE_NEW_UI, process.env.FEATURE_ANALYTICS, process.env.FEATURE_BETA)"
echo ""

# Example 12: Cross-platform path handling
echo "12. Cross-platform paths:"
cross-env \
  CONFIG_PATH="/etc/myapp/config.json" \
  LOG_PATH="/var/log/myapp/app.log" \
  node -e "console.log('Config:', process.env.CONFIG_PATH, 'Logs:', process.env.LOG_PATH)"
echo ""

# Example 13: Chaining with other commands
echo "13. Chaining commands:"
cross-env NODE_ENV=production node build.js && \
cross-env NODE_ENV=production node test.js
echo ""

# Example 14: Using with different runtimes
echo "14. Using with different Node.js versions:"
cross-env NODE_VERSION=18 node -e "console.log('Running with Node version:', process.env.NODE_VERSION)"
echo ""

# Example 15: Performance testing
echo "15. Performance comparison:"
echo "Node.js cross-env:"
time cross-env NODE_ENV=production node -e "console.log('Done')"
echo ""

echo "=== All examples completed ==="
