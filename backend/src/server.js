// backend/src/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import departmentsRoutes from './routes/departments.routes.js';
import dispatchesRoutes from './routes/dispatches.routes.js';
import assignmentsRoutes from './routes/assignments.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import permissionsRoutes from './routes/permissions.routes.js';
import attachmentsRoutes from './routes/attachments.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import statsRoutes from './routes/stats.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import sseRoutes from './routes/sse.routes.js';
import pushRoutes from './routes/push.routes.js';

import { errorHandler, notFound } from './middlewares/error.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (mobile native, curl)
    if (!origin) return callback(null, true);

    // Cho phép: Cloudflare + localhost + LAN
    const allowed =
      origin.endsWith('.trycloudflare.com') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost') ||
      /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin) ||
      origin === 'http://vksqlcv.com' ||
      origin === 'https://vksqlcv.com' ||
      origin === 'http://www.vksqlcv.com' ||
      origin === 'https://www.vksqlcv.com' ||
      origin === 'http://app.vksqlcv.com' ||
      origin === 'https://app.vksqlcv.com' ||
      origin === 'http://api.vksqlcv.com' ||
      origin === 'https://api.vksqlcv.com';

    if (allowed) {
      return callback(null, true);
    }
    console.warn('⚠️  CORS blocked:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const color = res.statusCode >= 500 ? '\x1b[31m'
      : res.statusCode >= 400 ? '\x1b[33m'
        : '\x1b[32m';
    console.log(`${color}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} - ${Date.now() - start}ms`);
  });
  next();
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'QLCV VKSND API',
}));

// Health
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend đang chạy' });
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/dispatches', dispatchesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/push', pushRoutes);
app.use('/api', attachmentsRoutes);
app.use('/api', assignmentsRoutes);
app.use('/api', reportsRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log('======================================================');
  console.log('   HỆ THỐNG QUẢN LÝ CÔNG VIỆC VKSND TP.HCM');
  console.log('======================================================');
  console.log(`🚀 Backend:  http://localhost:${PORT}`);
  console.log(`📚 Swagger:  http://localhost:${PORT}/api-docs`);
  console.log('======================================================');
});