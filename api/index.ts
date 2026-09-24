import type { IncomingMessage, ServerResponse } from 'http';
import { app } from '../server/app';

// Vercel Serverless Function entry point for all /api/* routes
export default async function handler(req: IncomingMessage, res: ServerResponse) {
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

  return new Promise<void>((resolve) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', (err) => {
      console.error('[Vercel API Stream Error]:', err?.message || err);
      resolve();
    });

    try {
      (app as any)(req, res, (err: any) => {
        if (err) {
          console.error('[Vercel API Uncaught Middleware Error]:', err?.message || err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal Server Error', details: err?.message || 'Unexpected failure' }));
          }
        }
        resolve();
      });
    } catch (err: any) {
      console.error('[Vercel API Synchronous Error]:', err?.message || err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error', details: err?.message || 'Unexpected failure' }));
      }
      resolve();
    }
  });
}

