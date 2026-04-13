import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import tripsRoutes from './routes/trips.js';
import metroRoutes from './routes/metro.js';

const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'metroom-server' });
});

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/trips', tripsRoutes);
app.use('/metro', metroRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const error = err as { name?: string; code?: string; message?: string };
  const message = String(error?.message ?? '');

  const isDatabaseConfigError =
    error?.name === 'PrismaClientInitializationError' ||
    message.includes('Authentication failed against database server') ||
    message.includes('Can\'t reach database server') ||
    message.includes('P1000') ||
    message.includes('P1001');

  const isDatabaseLockedError =
    message.includes('P1008') ||
    message.includes('database failed to respond') ||
    message.includes('database is locked');

  if (isDatabaseConfigError) {
    console.error('Database connection error:', message);
    res.status(503).json({
      message: 'Database connection failed. Check DATABASE_URL and PostgreSQL credentials.'
    });
    return;
  }

  if (isDatabaseLockedError) {
    console.error('Database lock/timeout error:', message);
    res.status(503).json({
      message: 'Database is busy or locked. Close external database tools (for example DB Browser) and try again.'
    });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(env.PORT, () => {
  console.log(`Metroom backend listening on http://localhost:${env.PORT}`);
});
