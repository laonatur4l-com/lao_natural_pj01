import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productsRoutes from './routes/products.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import adminRoutes from './routes/admin.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import bannersRoutes from './routes/banners.routes.js';
import distributorsRoutes from './routes/distributors.routes.js';
import promotionsRoutes from './routes/promotions.routes.js';
import exchangeRatesRoutes from './routes/exchangeRates.routes.js';
import { handleUploadError } from './middleware/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security & Core Middleware ─────────────────────────────────
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or any Vercel domain
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app')) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300', 10),
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// ─── API Routes ──────────────────────────────────────────────────
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/user', '/user'], userRoutes);
app.use(['/api/products', '/products'], productsRoutes);
app.use(['/api/orders', '/orders'], ordersRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/categories', '/categories'], categoriesRoutes);
app.use(['/api/banners', '/banners'], bannersRoutes);
app.use(['/api/distributors', '/distributors'], distributorsRoutes);
app.use(['/api/promotions', '/promotions'], promotionsRoutes);
app.use(['/api/exchange-rates', '/exchange-rates'], exchangeRatesRoutes);

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ─── Error Handlers ──────────────────────────────────────────────
app.use(handleUploadError);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Lao Natural Essentials API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

export default app;
