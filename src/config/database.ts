import { PrismaClient } from '@prisma/client';

// Extend global namespace for development hot reload
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma Client instance
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  errorFormat: 'pretty',
});

// In development, store client in global to prevent multiple instances during hot reload
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`🔌 Received ${signal}. Disconnecting from database...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('beforeExit', async () => {
  console.log('🔌 Process beforeExit. Disconnecting from database...');
  await prisma.$disconnect();
});

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default prisma;