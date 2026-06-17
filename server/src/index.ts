import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import rateLimit from 'express-rate-limit';
import config from './config';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import documentRoutes from './routes/documents';
import transactionRoutes from './routes/transactions';
import anomalyRoutes from './routes/anomalies';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import auditLogRoutes from './routes/auditLog';
import pcmRoutes from './routes/pcm';
import demoRoutes from './routes/demo';
import ownerRoutes from './routes/owner';
import clientRoutes from './routes/client';
import financialRoutes from './routes/financials';

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Trop de requêtes. Réessayez plus tard.' },
});
app.use(globalLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', documentRoutes);
app.use('/api', transactionRoutes);
app.use('/api', anomalyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', reportRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/pcm-accounts', pcmRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/client', clientRoutes);
app.use('/api', financialRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Fichier trop volumineux. Maximum 25MB.' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

if (!config.isDev) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`Cabinet Laatig API running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
