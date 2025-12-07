# Bug Fixes and Test Coverage

This document summarizes the bug fixes and their test coverage.

## Bug #1: Inline Code Stripped from Table Cells

**Issue**: Story titles containing backticks (inline code) were being stripped during Markdown table parsing. For example, `` `releases list` command`` would display as just `` command``.

**Root Cause**: The `extractTextFromNode` function in `markdown.parser.ts` only handled `text` nodes and recursively processed `children`, but didn't handle `inlineCode` nodes which have a `value` property.

**Fix**: Added handling for `inlineCode` node type in `extractTextFromNode`:
```typescript
if (node.type === 'inlineCode') {
  return (node as any).value;
}
```

**Test Coverage**:
- **Functional Tests** (`tests/functional/bug-fixes.sh`):
  - Test 1: Verifies inline code is preserved in story titles
  - Test 4: Verifies inline code is preserved in JSON output
- **Manual Verification**: `specdeck list stories | grep "REL-01-03"` shows "releases list command"

**Files Changed**:
- `src/parsers/markdown.parser.ts` - Added inlineCode handling

---

## Bug #2: --json Flag Not Working

**Issue**: The global `--json` flag was not producing JSON output. Commands continued to output formatted text even when `--json` was specified.

**Root Cause**: The code was trying to access global options using `options.parent?.parent?.opts().json`, which doesn't work with Commander.js's nested command structure. The `parent` property chain was undefined.

**Fix**: Changed action callbacks to accept both `options` and `cmd` parameters, then used `cmd.optsWithGlobals()` to access global options (the correct Commander.js API):
```typescript
.action(async (options, cmd) => {
  const globalOpts = cmd.optsWithGlobals();
  if (globalOpts.json) {
    // output JSON
  }
})
```

**Test Coverage**:
- **Functional Tests** (`tests/functional/bug-fixes.sh`):
  - Test 2: Verifies `--json` produces valid JSON
  - Test 3: Verifies JSON has expected fields
  - Test 5: Verifies `--stats --json` produces valid JSON statistics
  - Test 8: Verifies all list commands support `--json`
- **Manual Verification**: All `specdeck list * --json` commands produce valid JSON

**Files Changed**:
- `src/commands/list.ts` - Fixed JSON flag access in all three subcommands (releases, features, stories)

---

## Bug #3: Sync Status Not Detecting Archived Changes

**Issue**: The `specdeck sync status` command reported "all stories in sync" even though the OpenSpec change was archived and stories were still marked as "planned".

**Root Cause**: Two issues:
1. The code only scanned the direct children of `changes/` directory, treating `archive/` as a single change instead of recursively scanning it
2. The code tried to extract story IDs from proposal.md content (which had example IDs), instead of matching stories by their `openspec` field

**Fix**: 
1. Added recursive scanning of both active and archived changes:
```typescript
// Scan active changes (excluding archive dir)
// Scan archived changes in changes/archive/
```
2. Changed matching logic to filter stories by their `openspec` field:
```typescript
const linkedStories = stories.filter(s => s.openspec === changeId);
```

**Test Coverage**:
- **Functional Tests** (`tests/functional/bug-fixes.sh`):
  - Test 6: Verifies sync detects archived changes
  - Test 7: Verifies sync suggests correct status (done for archived)
- **Manual Verification**: `specdeck sync status` now shows 42 stories needing updates

**Files Changed**:
- `src/commands/sync.ts` - Fixed change detection and story matching logic

---

## Test Strategy

Due to ESM module compatibility issues with Jest (unified, remark, chalk are ESM-only), we adopted a **functional testing** approach:

### Why Functional Tests?
1. **Real-world validation**: Tests run against actual built CLI
2. **No mocking needed**: Validates entire pipeline
3. **Easier maintenance**: Tests read like usage examples
4. **ESM compatibility**: No Jest configuration complexity

### Test Structure
- **Unit Tests** (`tests/schemas/`): 11 tests for Zod schemas
- **Functional Tests** (`tests/functional/`): 8 tests for bug fixes and CLI behavior

### Running Tests
```bash
npm test              # Unit tests only
npm run test:functional   # Functional tests only  
npm run test:all      # Both unit and functional
```

---

## Coverage Summary

| Bug | Root Cause | Fix Location | Tests |
|-----|-----------|--------------|-------|
| Inline code stripped | Missing inlineCode node handling | `markdown.parser.ts` | 2 functional |
| --json not working | Wrong Commander.js API usage | `list.ts` | 4 functional |
| Sync not detecting archives | Wrong directory scan + matching | `sync.ts` | 2 functional |

**Total Tests**: 11 unit + 8 functional = **19 tests passing** ✅
