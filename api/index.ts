import type { IncomingMessage, ServerResponse } from 'http';
import { app } from '../server/app';

// Vercel Serverless Function entry point for all /api/* routes
export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Normalize req.url so Express router matches correctly regardless of rewrite headers
  const url = req.url || '';
  if (!url.startsWith('/api')) {
    const originalUrl = (req.headers['x-now-route-matches'] as string) || (req.headers['x-matched-path'] as string);
    if (originalUrl && originalUrl.startsWith('/api')) {
      req.url = originalUrl;
    }
  }

  // Diagnostic safe logger for Vercel functions (never logs passwords or tokens)
  if (process.env.NODE_ENV !== 'test') {
    const safeBodyKeys = (req as any).body && typeof (req as any).body === 'object' ? Object.keys((req as any).body) : 'unparsed';
    console.log(`[Vercel API] ${req.method} ${req.url} - bodyKeys: ${JSON.stringify(safeBodyKeys)}`);
  }

  try {
    return app(req as any, res as any);
  } catch (err: any) {
    console.error('[Vercel API Uncaught Error]:', err?.stack || err?.message || err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error', details: err?.message || 'Unexpected failure' }));
    }
  }
}
