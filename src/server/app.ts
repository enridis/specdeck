import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { releasesRouter } from './routes/releases';
import { featuresRouter } from './routes/features';
import { storiesRouter } from './routes/stories';
import { statsRouter } from './routes/stats';
import { configRouter } from './routes/config';
import { syncRouter } from './routes/sync';
import { overlaysRouter } from './routes/overlays';

export interface AppOptions {
  apiOnly?: boolean;
}

/**
 * Create and configure Express application
 */
export function createApp(options: AppOptions = {}): Application {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'], // Vite dev server
      credentials: true,
    })
  );

  app.use(express.json());

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/config', configRouter);
  app.use('/api/sync', syncRouter);
  app.use('/api/overlays', overlaysRouter);
  app.use('/api/releases', releasesRouter);
  app.use('/api/features', featuresRouter);
  app.use('/api/stories', storiesRouter);
  app.use('/api/stats', statsRouter);

  // Serve static files from UI build (only if not in API-only mode)
  if (!options.apiOnly) {
    const uiPath = path.join(__dirname, '../ui');
    app.use(express.static(uiPath));

    // SPA fallback - serve index.html for all non-API routes
    app.get(/^\/(?!api).*/, (_req: Request, res: Response) => {
      res.sendFile(path.join(uiPath, 'index.html'));
    });
  }

  // Error handling middleware (must be last)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err.message);
    if (process.env.NODE_ENV === 'development' || process.env.VERBOSE) {
      console.error(err.stack);
    }

    // Zod validation errors
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: (err as unknown as { errors: unknown }).errors,
        },
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
      },
    });
  });

  return app;
}
