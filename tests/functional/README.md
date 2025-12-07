# Functional Tests

This directory contains functional/integration tests that run the actual CLI commands and verify their behavior.

## Why Functional Tests?

The SpecDeck CLI uses several ESM-only dependencies (unified, remark, chalk) that have compatibility issues with Jest's CommonJS environment. While we could configure Jest to handle ESM modules, functional tests provide several advantages:

1. **Real-world validation**: Tests run against the actual built CLI, not mocked components
2. **End-to-end coverage**: Validates the entire pipeline from CLI input to output
3. **Simpler setup**: No need to mock complex dependency chains
4. **Easier to maintain**: Tests read like actual usage examples

## Running Tests

Run all functional tests:
```bash
./tests/functional/bug-fixes.sh
```

Or run individual test files:
```bash
./tests/functional/bug-fixes.sh
```

## Test Coverage

### bug-fixes.sh
Tests for specific bug fixes and regressions:
- Inline code preservation in Markdown table parsing (backticks)
- JSON output flag functionality across all commands
- Sync status detection of archived changes
- Status suggestion logic for archived vs active changes

## Adding New Tests

To add a new functional test:

1. Create a new `.sh` file in this directory
2. Make it executable: `chmod +x tests/functional/your-test.sh`
3. Follow the pattern in `bug-fixes.sh`:
   - Build the project first
   - Run CLI commands and capture output
   - Use grep, jq, or other tools to validate output
   - Exit with code 1 on failure, 0 on success

Example:
```bash
#!/usr/bin/env bash
set -e

npm run build > /dev/null 2>&1

output=$(node dist/cli.js your command)
if echo "$output" | grep -q "expected text"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  exit 1
fi
```
