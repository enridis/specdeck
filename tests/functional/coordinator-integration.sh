#!/usr/bin/env bash
set -e

# Functional tests for coordinator mode integration

echo "🧪 Running functional tests for coordinator mode..."

# Build the project first
echo "Building project..."
npm run build > /dev/null 2>&1

# Setup test environment
TEST_DIR="/tmp/specdeck-coordinator-test"
FIXTURE_DIR="$(pwd)/tests/fixtures/coordinator"
CLI_PATH="$(pwd)/dist/cli.js"

# Set NODE_PATH for the CLI to find node_modules
export NODE_PATH="$(pwd)/node_modules"

# Clean up any previous test
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

# Copy fixture to test directory
cp -r "$FIXTURE_DIR"/* "$TEST_DIR"/
cp "$FIXTURE_DIR/.specdeck.config.json" "$TEST_DIR"/

# Copy node_modules for CLI to work
cp -r "$(pwd)/node_modules" "$TEST_DIR"/

cd "$TEST_DIR"

# Update NODE_PATH to point to the copied node_modules in test directory
export NODE_PATH="./node_modules"

echo "Test environment set up in $TEST_DIR"

# Test 1: Coordinator mode detection (after sync)
echo ""
echo "Test 1: Coordinator mode detection"
cd "$TEST_DIR"
echo "Current directory: $(pwd)"
node "$CLI_PATH" sync > /dev/null 2>&1
output=$(node "$CLI_PATH" list stories | head -2 | tail -1)
echo "Output: '$output'"
if echo "$output" | grep -q "Stories"; then
  echo "✅ PASS: Coordinator mode working (stories listed)"
else
  echo "❌ FAIL: Coordinator mode not working. Got: $output"
  exit 1
fi

# Test 2: Sync command works
echo ""
echo "Test 2: Sync command executes successfully"
output=$(node "$CLI_PATH" sync 2>&1)
if echo "$output" | grep -q "synced\|cache"; then
  echo "✅ PASS: Sync command executed successfully"
else
  echo "❌ FAIL: Sync command failed. Got: $output"
  exit 1
fi

# Test 3: Cache file created
echo ""
echo "Test 3: Cache file created after sync"
if [ -f ".specdeck-cache/stories.json" ]; then
  echo "✅ PASS: Cache file created"
else
  echo "❌ FAIL: Cache file not found"
  exit 1
fi

# Test 4: Cache contains expected stories
echo ""
echo "Test 4: Cache contains expected number of stories"
story_count=$(jq '.stories | length' .specdeck-cache/stories.json 2>/dev/null || echo "0")
if [ "$story_count" -eq 11 ]; then
  echo "✅ PASS: Cache contains 11 stories"
else
  echo "❌ FAIL: Expected 11 stories, got $story_count"
  exit 1
fi

# Test 5: List stories works with cache
echo ""
echo "Test 5: List stories works with cache"
output=$(node "$CLI_PATH" list stories 2>/dev/null | grep -c "API-AUTH-01\|FE-AUTH-01\|ML-TRAIN-01")
if [ "$output" -ge 3 ]; then
  echo "✅ PASS: List stories shows stories from cache"
else
  echo "❌ FAIL: List stories not showing expected stories. Got: $output"
  exit 1
fi

# Test 6: --with-jira flag enriches output
echo ""
echo "Test 6: --with-jira flag enriches output"
output=$(node "$CLI_PATH" list stories --with-jira 2>/dev/null | grep -c "PROJ-")
if [ "$output" -gt 0 ]; then
  echo "✅ PASS: --with-jira shows Jira tickets"
else
  echo "❌ FAIL: --with-jira not showing Jira tickets"
  exit 1
fi

# Test 7: --repo filter works
echo ""
echo "Test 7: --repo filter works"
backend_count=$(node "$CLI_PATH" list stories --repo backend 2>/dev/null | grep -c "API-AUTH-\|API-USERS-")
if [ "$backend_count" -ge 5 ]; then
  echo "✅ PASS: --repo backend shows 5 backend stories"
else
  echo "❌ FAIL: --repo backend filter not working. Got: $backend_count"
  exit 1
fi

# Test 8: --global flag shows repo prefixes
echo ""
echo "Test 8: --global flag shows repo prefixes"
output=$(node "$CLI_PATH" list stories --global 2>/dev/null | grep -c "\[backend\]\|\[frontend\]\|\[models\]")
if [ "$output" -gt 0 ]; then
  echo "✅ PASS: --global shows repo prefixes"
else
  echo "❌ FAIL: --global not showing repo prefixes"
  exit 1
fi

# Test 9: Validate story IDs command works
echo ""
echo "Test 9: Validate story IDs command works"
output=$(node "$CLI_PATH" validate-story-ids 2>&1)
if echo "$output" | grep -q "All story IDs are unique"; then
  echo "✅ PASS: Validate story IDs command executed"
else
  echo "❌ FAIL: Validate story IDs command failed. Got: $output"
  exit 1
fi

# Test 10: Overlay validation works
echo ""
echo "Test 10: Overlay validation works"
output=$(node "$CLI_PATH" overlay validate 2>&1)
if echo "$output" | grep -q "validation\|valid\|complete"; then
  echo "✅ PASS: Overlay validation executed"
else
  echo "❌ FAIL: Overlay validation failed. Got: $output"
  exit 1
fi

# Test 11: Dry-run sync doesn't modify cache
echo ""
echo "Test 11: Dry-run sync doesn't modify cache"
cache_mtime_before=$(stat -f %m .specdeck-cache/stories.json)
sleep 1
node "$CLI_PATH" sync --dry-run > /dev/null 2>&1
cache_mtime_after=$(stat -f %m .specdeck-cache/stories.json)
if [ "$cache_mtime_before" -eq "$cache_mtime_after" ]; then
  echo "✅ PASS: Dry-run doesn't modify cache"
else
  echo "❌ FAIL: Dry-run modified cache file"
  exit 1
fi

# Test 12: Cache staleness detection
echo ""
echo "Test 12: Cache staleness detection"
# Modify cache syncedAt to make it appear old
sed -i.bak 's/"syncedAt": "[^"]*"/"syncedAt": "2023-12-01T00:00:00.000Z"/' .specdeck-cache/stories.json
output=$(node "$CLI_PATH" list stories 2>&1 | grep -c "stale\|Cache is stale\|sync")
if [ "$output" -gt 0 ]; then
  echo "✅ PASS: Cache staleness detected"
else
  echo "❌ FAIL: Cache staleness not detected"
  exit 1
fi

# Clean up
cd /tmp
rm -rf "$TEST_DIR"

echo ""
echo "🎉 All coordinator integration tests passed!"