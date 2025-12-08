#!/usr/bin/env bash
set -e

# Functional tests for bug fixes

echo "🧪 Running functional tests for bug fixes..."

# Build the project first
echo "Building project..."
npm run build > /dev/null 2>&1

# Test 1: Inline code preservation in table parsing
echo ""
echo "Test 1: Inline code preservation (backticks in story titles)"
output=$(node dist/cli.js list stories 2>/dev/null | grep "REL-01-03")
if echo "$output" | grep -q "releases list command"; then
  echo "✅ PASS: Inline code preserved in story titles"
else
  echo "❌ FAIL: Inline code not preserved. Got: $output"
  exit 1
fi

# Test 2: JSON output flag works
echo ""
echo "Test 2: --json flag produces valid JSON"
output=$(node dist/cli.js list stories --json 2>/dev/null)
if echo "$output" | jq . > /dev/null 2>&1; then
  echo "✅ PASS: --json produces valid JSON"
else
  echo "❌ FAIL: --json output is not valid JSON"
  exit 1
fi

# Test 3: JSON output contains expected fields
echo ""
echo "Test 3: JSON output contains expected story fields"
output=$(node dist/cli.js list stories --json 2>/dev/null)
if echo "$output" | jq '.[0] | has("id") and has("title") and has("status") and has("complexity")' | grep -q "true"; then
  echo "✅ PASS: JSON output has expected fields"
else
  echo "❌ FAIL: JSON output missing expected fields"
  exit 1
fi

# Test 4: JSON output preserves inline code
echo ""
echo "Test 4: JSON output preserves inline code in titles"
output=$(node dist/cli.js list stories --json 2>/dev/null)
if echo "$output" | jq -r '.[] | select(.id == "REL-01-03") | .title' | grep -q "releases list"; then
  echo "✅ PASS: JSON output preserves inline code"
else
  echo "❌ FAIL: JSON output doesn't preserve inline code"
  exit 1
fi

# Test 5: Stats with JSON flag
echo ""
echo "Test 5: --stats --json produces valid JSON statistics"
output=$(node dist/cli.js list stories --stats --json 2>/dev/null)
if echo "$output" | jq 'has("total") and has("byStatus") and has("byComplexity") and has("totalPoints")' | grep -q "true"; then
  echo "✅ PASS: Stats JSON has expected fields"
else
  echo "❌ FAIL: Stats JSON missing expected fields"
  exit 1
fi

# Test 6: Multiple command types support JSON
echo ""
echo "Test 6: All list commands support --json"
for cmd in "releases" "features"; do
  output=$(node dist/cli.js list $cmd --json 2>/dev/null)
  if echo "$output" | jq . > /dev/null 2>&1; then
    echo "✅ PASS: list $cmd --json works"
  else
    echo "❌ FAIL: list $cmd --json doesn't work"
    exit 1
  fi
done

# Test 7: Features are parsed from bullet list format
echo ""
echo "Test 7: Features extracted from release bullet lists"
output=$(node dist/cli.js list features --json 2>/dev/null)
feature_count=$(echo "$output" | jq 'length' 2>/dev/null)
if [ "$feature_count" -gt 0 ]; then
  echo "✅ PASS: Features extracted ($feature_count features found)"
else
  echo "❌ FAIL: No features extracted from releases"
  exit 1
fi

# Test 8: Feature details include description from nested bullets
echo ""
echo "Test 8: Feature descriptions extracted from nested bullet lists"
output=$(node dist/cli.js list features --json 2>/dev/null)
has_description=$(echo "$output" | jq '.[0] | has("description") and (.description | length > 0)' 2>/dev/null)
if [ "$has_description" = "true" ]; then
  echo "✅ PASS: Feature descriptions extracted"
else
  echo "❌ FAIL: Feature descriptions not extracted"
  exit 1
fi

echo ""
echo "🎉 All functional tests passed!"
