import express from 'express';
import { apiRouter } from './routes';

export const app = express();

app.use(express.json());

// Mount API endpoints under /api
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'ORVEXA CRM', timestamp: new Date().toISOString() });
});

export default app;
