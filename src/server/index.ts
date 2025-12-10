import { createApp } from './app';

export interface ServerOptions {
  port: number;
  host: string;
  specdeckDir: string;
  verbose?: boolean;
  apiOnly?: boolean;
}

/**
 * Start the Express server
 */
export async function startServer(options: ServerOptions): Promise<void> {
  const { port, host, specdeckDir, apiOnly } = options;

  // Store specdeckDir and root path in process.env for routes to access
  process.env.SPECDECK_DIR = specdeckDir;
  process.env.SPECDECK_ROOT = process.cwd(); // Store the root path where config is located
  if (options.verbose) {
    process.env.VERBOSE = 'true';
  }

  const app = createApp({ apiOnly });

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      console.log(`✓ SpecDeck server running at http://${host}:${port}`);
      console.log(`  Serving data from: ${specdeckDir}`);
      console.log(`  Press Ctrl+C to stop`);
      resolve();
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Try a different port with --port`));
      } else {
        reject(err);
      }
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\nShutting down server...');
      server.close(() => {
        console.log('Server stopped');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
}

export { createApp };
