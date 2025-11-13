#!/usr/bin/env tsx

/**
 * Script to clear all cache data to ensure fresh data for users
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearCache() {
  console.log('🧹 Clearing all cache data...')
  
  try {
    // Clear all cache entries
    const deleteResult = await prisma.cache.deleteMany({})
    
    console.log(`🗑️  Cleared ${deleteResult.count} cache entries`)
    console.log('✅ Cache cleared successfully!')
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
clearCache()
  .then(() => {
    console.log('🎉 Cache cleanup finished successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Cache cleanup failed:', error)
    process.exit(1)
  })
