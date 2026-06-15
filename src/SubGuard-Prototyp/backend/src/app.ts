import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import subscriptionsRouter from './routes/subscriptions.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
  res.json({
    status: 'OK',
    message: 'SubscriptionGuard Backend running',
  });
});

app.use('/api/auth', authRouter);
app.use('/api', dashboardRouter);
app.use('/api/subscriptions', subscriptionsRouter);

app.use((error: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const status = error.status || error.statusCode || 500;
  console.error('Unhandled request error:', error);

  res.status(status).json({
    errors: [
      status === 400
        ? 'Die Anfrage konnte nicht verarbeitet werden. Prüfe das JSON-Format.'
        : 'Interner Server-Fehler.',
    ],
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
