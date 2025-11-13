// Database configuration - already provided
/**
 * lib/db.ts
 * Prisma Client Singleton Pattern
 * 
 * This file ensures we only create one instance of PrismaClient
 * in development to avoid connection exhaustion due to hot reloading.
 * In production, we create a single instance for the entire application.
 */

import { PrismaClient } from '@prisma/client';

// Add prisma to the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create PrismaClient instance with optimal configuration
 * Includes query logging in development for debugging
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'pretty',
  });
};

// Prevent multiple instances of Prisma Client in development
const prisma = global.prisma ?? prismaClientSingleton();

// Store instance in global for development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

/**
 * Helper function to handle Prisma errors gracefully
 * @param error - The error object from Prisma
 * @returns A user-friendly error message
 */
export const handlePrismaError = (error: any): string => {
  // Handle known Prisma errors
  if (error?.code === 'P2002') {
    return 'A record with this value already exists.';
  }
  if (error?.code === 'P2025') {
    return 'The requested record was not found.';
  }
  if (error?.code === 'P2003') {
    return 'Invalid reference. The related record does not exist.';
  }
  if (error?.code === 'P2014') {
    return 'The change would violate a required relation.';
  }
  
  // Generic database error
  if (error?.code?.startsWith('P')) {
    return 'A database error occurred. Please try again.';
  }
  
  // Return the original error message for non-Prisma errors
  return error?.message || 'An unexpected error occurred.';
};

/**
 * Utility function to safely disconnect Prisma
 * Useful for graceful shutdown in serverless environments
 */
export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};