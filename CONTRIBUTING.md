# Contributing to SpecDeck

Thank you for your interest in contributing to SpecDeck! This document provides guidelines for development.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/specdeck.git
cd specdeck

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run the CLI locally
npm run cli -- list stories
```

## Project Structure

```
specdeck/
├── src/
│   ├── cli.ts                 # CLI entry point
│   ├── commands/              # Command implementations
│   │   ├── list.ts
│   │   ├── create.ts
│   │   ├── propose.ts
│   │   ├── sync.ts
│   │   └── validate.ts
│   ├── services/              # Business logic
│   │   ├── story.service.ts
│   │   ├── release.service.ts
│   │   └── feature.service.ts
│   ├── repositories/          # Data access layer
│   │   ├── story.repository.ts
│   │   ├── release.repository.ts
│   │   ├── feature.repository.ts
│   │   └── config.repository.ts
│   ├── parsers/               # Markdown parsing
│   │   └── markdown.parser.ts
│   ├── schemas/               # Zod validation schemas
│   │   ├── story.schema.ts
│   │   ├── release.schema.ts
│   │   ├── feature.schema.ts
│   │   └── config.schema.ts
│   └── utils/                 # Utility functions
├── tests/                     # Unit tests
│   ├── schemas/
│   ├── parsers/
│   ├── repositories/
│   └── fixtures/
└── openspec/                  # Self-documentation
    ├── vision.md
    ├── releases/
    ├── project-plan.md
    └── changes/
```

## Architecture

### Layered Architecture

```
CLI Layer (commands/)
    ↓
Service Layer (services/)
    ↓
Repository Layer (repositories/)
    ↓
Parser Layer (parsers/)
```

### Key Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Repository Pattern**: All file I/O goes through repositories
3. **Schema-First**: Zod schemas drive validation and types
4. **Dependency Injection**: Services receive dependencies in constructors

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use async/await over callbacks
- Avoid `any` - use `unknown` and narrow with type guards

### Naming Conventions

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces: `PascalCase` (no `I` prefix)

### Code Formatting

We use Prettier and ESLint:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Testing

### Unit Tests

- Place tests in `tests/` directory mirroring `src/` structure
- Name test files: `*.test.ts`
- Use Jest for testing
- Aim for 80%+ coverage

### Writing Tests

```typescript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = someFunction(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- story.schema.test.ts
```

## Pull Request Process

### Before Submitting

1. ✅ Write/update tests for your changes
2. ✅ Ensure all tests pass: `npm test`
3. ✅ Lint your code: `npm run lint`
4. ✅ Format your code: `npm run format`
5. ✅ Build successfully: `npm run build`
6. ✅ Update documentation if needed

### PR Guidelines

- **Title**: Use conventional commits format
  - `feat: Add feature X`
  - `fix: Resolve issue with Y`
  - `docs: Update README`
  - `refactor: Improve Z implementation`
  - `test: Add tests for feature X`

- **Description**: 
  - What changes were made?
  - Why were they made?
  - How to test the changes?
  - Link to related issues

- **Size**: Keep PRs focused and reasonably sized
  - Break large changes into multiple PRs
  - One feature/fix per PR

### Review Process

1. Automated checks must pass (tests, linting, build)
2. At least one maintainer approval required
3. Address review feedback
4. Squash and merge when approved

## Adding New Commands

1. Create command file in `src/commands/`
2. Implement command using Commander.js
3. Register in `src/cli.ts`
4. Add tests in `tests/commands/`
5. Update README.md with usage examples

Example command structure:

```typescript
import { Command } from 'commander';
import chalk from 'chalk';

export function createMyCommand(): Command {
  const cmd = new Command('mycommand')
    .description('Description of command')
    .argument('<required>', 'Required argument')
    .option('-o, --optional <value>', 'Optional flag')
    .action(async (required, options) => {
      try {
        // Implementation
        console.log(chalk.green('Success!'));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  return cmd;
}
```

## Adding New Schemas

1. Create schema file in `src/schemas/`
2. Define Zod schema with validation rules
3. Export schema and inferred type
4. Add to `src/schemas/index.ts`
5. Write comprehensive tests

Example schema:

```typescript
import { z } from 'zod';

export const MySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  count: z.number().optional(),
});

export type MyType = z.infer<typeof MySchema>;
```

## Debugging

### CLI Debugging

```bash
# Build and run with verbose output
npm run build && node dist/cli.js --verbose list stories
```

### VSCode Debug Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug CLI",
  "program": "${workspaceFolder}/dist/cli.js",
  "args": ["list", "stories"],
  "preLaunchTask": "npm: build"
}
```

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag v1.0.0`
4. Push with tags: `git push --tags`
5. Publish to npm: `npm publish`

## Questions or Issues?

- Open an issue on GitHub
- Tag with appropriate label (bug, enhancement, question)
- Provide reproduction steps for bugs
- Include environment details (OS, Node version)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
