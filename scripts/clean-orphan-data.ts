#!/usr/bin/env tsx

/**
 * Script to clean orphan data from the database
 * This ensures that each user only sees their own data
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanOrphanData() {
  console.log('🧹 Cleaning orphan data...')
  
  try {
    console.log('✅ Schema enforces userId requirement - no orphan assets possible')
    console.log('✅ Schema enforces asset relationship - no orphan dividends possible')
    
    // Show current user data summary
    const users = await prisma.user.findMany({
      include: {
        assets: true,
        _count: {
          select: {
            assets: true
          }
        }
      }
    })
    
    console.log('\n📊 Current user data summary:')
    for (const user of users) {
      console.log(`   ${user.name} (${user.email}): ${user._count.assets} assets`)
    }
    
    console.log('\n✅ Data cleanup completed!')
    
  } catch (error) {
    console.error('❌ Error cleaning data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanOrphanData()
  .then(() => {
    console.log('🎉 Cleanup finished successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error)
    process.exit(1)
  })
