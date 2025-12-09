import { Command } from 'commander';
import { existsSync } from 'fs';
import { resolve } from 'path';
import open from 'open';
import { startServer } from '../server';
import { ConfigRepository } from '../repositories';

interface ServeOptions {
  port?: string;
  host?: string;
  open?: boolean;
  apiOnly?: boolean;
}

/**
 * Create the serve command
 */
export function createServeCommand(): Command {
  const serve = new Command('serve');

  serve
    .description('Start web UI server for SpecDeck management')
    .option('--port <port>', 'Port to run server on', '3000')
    .option('--host <host>', 'Host to bind to', 'localhost')
    .option('--open', 'Open browser automatically')
    .option('--api-only', 'Run API server without frontend')
    .action(handleServe);

  return serve;
}

/**
 * Handle the serve command
 */
async function handleServe(options: ServeOptions): Promise<void> {
  try {
    const verbose = process.argv.includes('--verbose');
    const port = parseInt(options.port || '3000', 10);
    const host = options.host || 'localhost';

    // Discover specdeck directory from config
    const configRepo = new ConfigRepository(process.cwd());
    const config = await configRepo.read();
    const specdeckDir = config?.specdeckDir || './specdeck';
    const absoluteSpecdeckDir = resolve(process.cwd(), specdeckDir);

    // Validate that specdeck/ directory exists
    if (!existsSync(absoluteSpecdeckDir)) {
      console.error(`Error: specdeck/ directory not found at ${absoluteSpecdeckDir}`);
      console.error(`Run 'specdeck init' first to initialize the project structure.`);
      process.exit(1);
    }

    // Start the server
    await startServer({
      port,
      host,
      specdeckDir: absoluteSpecdeckDir,
      verbose,
      apiOnly: options.apiOnly,
    });

    // Open browser if requested (not in API-only mode)
    if (options.open && !options.apiOnly) {
      const url = `http://${host}:${port}`;
      await open(url);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unexpected error occurred');
    }
    process.exit(1);
  }
}
