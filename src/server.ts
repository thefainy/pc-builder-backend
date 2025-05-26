import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import authRoutes from './auth/auth.routes';
import componentsRoutes from './components/components.routes';
import prisma, { testConnection } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbStatus = await testConnection();

  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? 'OK' : 'Service Unavailable',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

// Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  res.json({
    message: '🚀 PC Builder API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Database test endpoint
app.get('/api/db-test', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const componentCount = await prisma.component.count();

    res.json({
      message: '✅ Database connection successful!',
      data: {
        users: userCount,
        components: componentCount
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: '❌ Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Auth routes
app.use('/api/auth', authRoutes);

// Components routes
app.use('/api/components', componentsRoutes);

// Global error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Global error handler:', error);

  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`💾 Database test: http://localhost:${PORT}/api/db-test`);
});

export default app;