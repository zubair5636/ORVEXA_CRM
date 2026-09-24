import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from './routes';

export const app = express();

// Safe JSON body parser that handles raw streams, pre-parsed bodies, and handles syntax/stream errors gracefully
app.use((req: Request, res: Response, next: NextFunction) => {
  // If the serverless environment or upstream proxy already parsed the body into an object
  if (req.body && typeof req.body === 'object') {
    return next();
  }

  // Otherwise, use express.json() with explicit error handling
  express.json()(req, res, (err) => {
    if (err) {
      console.error('[API Body Parse Error]:', err.message);
      return res.status(400).json({ error: 'Invalid JSON payload in request body.' });
    }
    next();
  });
});

// URL-encoded body parser with error handling
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, (err) => {
    if (err) {
      console.error('[API UrlEncoded Parse Error]:', err.message);
      return res.status(400).json({ error: 'Invalid URL-encoded payload.' });
    }
    next();
  });
});

// Mount API endpoints under /api
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'ORVEXA CRM', timestamp: new Date().toISOString() });
});

// Global Express error handler middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Express Global Error]:', err?.stack || err?.message || err);
  if (!res.headersSent) {
    const status = typeof err?.status === 'number' ? err.status : 500;
    res.status(status).json({
      error: status === 400 ? (err.message || 'Bad Request') : 'An unexpected server error occurred.',
    });
  }
});

export default app;
