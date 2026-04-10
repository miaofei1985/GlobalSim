import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { connectRedis } from './config/redis.js';
import pool from './config/database.js';
import authRoutes from './routes/auth.js';
import marketRoutes from './routes/market.js';
import walletRoutes from './routes/wallet.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import marketIndexSyncService from './services/marketIndexSyncService.js';
import winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

app.use('/api', apiLimiter);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/api', (req, res) => {
  res.json({
    name: 'GlobalSim API',
    version: '1.0.0',
    description: 'Virtual Financial Trading Sandbox Platform',
    endpoints: {
      health: 'GET /health',
      auth: {
        captcha: 'GET /api/auth/captcha',
        sendCode: 'POST /api/auth/send-code',
        register: 'POST /api/auth/register',
        verify: 'POST /api/auth/verify',
        resendCode: 'POST /api/auth/resend-code',
        login: 'POST /api/auth/login',
      },
      wallet: {
        balance: 'GET /api/wallet/balance',
        transactions: 'GET /api/wallet/transactions',
        transfer: 'POST /api/wallet/transfer',
      },
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

app.use((err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connected');

    await connectRedis();
    logger.info('Redis connected');

    try {
      await marketIndexSyncService.initialize(logger);
    } catch (error) {
      logger.warn('Market index sync initialization skipped', {
        error: error.message,
      });
    }

    app.listen(PORT, () => {
      logger.info(`GlobalSim Backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      marketIndexSyncService.start(logger);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  marketIndexSyncService.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  marketIndexSyncService.stop();
  process.exit(0);
});

startServer();

export default app;
