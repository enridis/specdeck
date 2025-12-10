# Submodule Management Commands

SpecDeck provides commands to easily add and remove git submodules while automatically managing your coordinator configuration.

## Add a Submodule

Initialize a git submodule and register it with SpecDeck coordinator:

```bash
specdeck init submodule <repo-url> <path> [options]
```

### Arguments

- `repo-url` - Git repository URL (https or ssh)
- `path` - Local path where the submodule will be cloned

### Options

- `-n, --name <name>` - Submodule name (defaults to directory name)
- `-v, --visibility <type>` - Visibility level: `public`, `private`, or `on-premises` (default: `public`)
- `-b, --branch <branch>` - Clone a specific branch
- `--no-update` - Skip submodule initialization (only add to git config)

### Examples

**Basic usage:**
```bash
specdeck init submodule https://github.com/myorg/backend.git ./backend
```

**With custom name and visibility:**
```bash
specdeck init submodule git@github.com:myorg/api.git ./services/api \
  --name backend-api \
  --visibility private
```

**Clone specific branch:**
```bash
specdeck init submodule https://github.com/myorg/frontend.git ./frontend \
  --branch develop
```

### What it does

1. ✅ Verifies coordinator mode is enabled
2. ✅ Adds git submodule using `git submodule add`
3. ✅ Initializes and updates the submodule
4. ✅ Updates `.specdeck/config.yaml` with submodule configuration
5. ✅ Creates overlay directory structure
6. ✅ Checks for SpecDeck structure in submodule
7. ✅ **Auto-initializes SpecDeck** in submodule if not already present

### Output Example

```
🔍 Checking coordinator mode...
📦 Adding git submodule: https://github.com/myorg/backend.git → ./backend
🔄 Initializing submodule...
⚙️  Updating SpecDeck configuration...
✓ Created overlay directory: specdeck/overlays/backend
⚠ No SpecDeck structure found in ./backend, initializing...
Initializing SpecDeck project structure...

Creating SpecDeck directory structure...
✓ Created specdeck/project-plan.md
✓ Created specdeck/vision.md
✓ Created specdeck/AGENTS.md
✓ Created specdeck/releases/R1-foundation.md

✅ SpecDeck project initialized successfully!
✓ SpecDeck structure initialized in submodule

✓ Submodule initialized successfully!

Next steps:
  1. Commit the changes: git commit -m "Add backend submodule"
  2. Sync stories: specdeck sync
  3. Create overlays in: specdeck/overlays/backend/ (optional)
```

## Remove a Submodule

Remove a git submodule and unregister it from SpecDeck:

```bash
specdeck init remove-submodule <name-or-path>
```

### Arguments

- `name-or-path` - Submodule name or path (as specified in config)

### Examples

```bash
# Remove by name
specdeck init remove-submodule backend

# Remove by path
specdeck init remove-submodule ./backend
```

### What it does

1. ✅ Verifies submodule exists in configuration
2. ✅ Deinitializes the submodule using `git submodule deinit`
3. ✅ Removes submodule from git using `git rm`
4. ✅ Cleans up git modules directory
5. ✅ Updates `.specdeck/config.yaml`

### Output Example

```
🔍 Checking configuration...
🗑️  Removing git submodule: ./backend
⚙️  Updating SpecDeck configuration...

✓ Submodule "backend" removed successfully!

Next step: git commit -m "Remove submodule"
```

## Prerequisites

- Coordinator mode must be initialized: `specdeck init coordinator`
- Git must be installed and configured
- For adding submodules: you must have access to the repository

## Configuration Updates

The command automatically updates your `.specdeck/config.yaml`:

```yaml
coordinator:
  enabled: true
  submodules:
    - name: backend
      path: ./backend
      visibility: public
    - name: frontend
      path: ./frontend
      visibility: private
  overlaysDir: overlays
  cacheDir: .specdeck-cache
```

## Directory Structure

After adding submodules:

```
your-project/
├── .specdeck/
│   └── config.yaml          # Updated with submodule config
├── backend/                 # Git submodule
│   └── specdeck/
│       └── releases/
├── frontend/                # Git submodule
│   └── specdeck/
│       └── releases/
└── specdeck/overlays/
    ├── backend/             # Created automatically
    └── frontend/            # Created automatically
```

## Troubleshooting

**"No SpecDeck configuration found"**
- Run `specdeck init coordinator` first

**"Coordinator mode is not enabled"**
- Edit `.specdeck/config.yaml` and set `coordinator.enabled: true`

**"Submodule already exists"**
- The submodule name or path is already in your configuration
- Use a different name with `--name` or path

**"Failed to add git submodule"**
- Check repository URL is correct
- Verify you have access to the repository
- Ensure the target path doesn't already exist

## See Also

- [Coordinator Mode Setup](../coordinator-setup.md)
- [Multi-Repository Workflows](../multi-repo-workflows.md)
- [Overlay Management](../overlays.md)
