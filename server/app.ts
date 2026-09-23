import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from './routes';

export const app = express();

// Safe JSON body parser that handles both raw streams and pre-parsed bodies (e.g. Vercel Serverless)
app.use((req: Request, res: Response, next: NextFunction) => {
  // If the serverless environment or upstream proxy already parsed the body into an object
  if (req.body && typeof req.body === 'object') {
    return next();
  }

  // Otherwise, use express.json() to read from the stream
  express.json()(req, res, next);
});

// Also support URL-encoded if applicable
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

// Mount API endpoints under /api
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'ORVEXA CRM', timestamp: new Date().toISOString() });
});

export default app;
