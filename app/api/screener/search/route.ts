import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

const screenerFiltersSchema = z.object({
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minMarketCap: z.number().optional(),
  maxMarketCap: z.number().optional(),
  minPE: z.number().optional(),
  maxPE: z.number().optional(),
  minDividendYield: z.number().optional(),
  maxDividendYield: z.number().optional(),
  sectors: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(50),
})

export async function GET(_request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get popular stocks (top by market cap)
    const stocks = await prisma.stock.findMany({
      orderBy: {
        marketCap: 'desc',
      },
      take: 50,
      select: {
        ticker: true,
        name: true,
        currentPrice: true,
        marketCap: true,
        sector: true,
        peRatio: true,
        dividendYield: true,
        dayChange: true,
        dayChangePercent: true,
        volume: true,
      },
    })

    const results = stocks.map(stock => ({
      ticker: stock.ticker,
      name: stock.name,
      currentPrice: stock.currentPrice || 0,
      price: stock.currentPrice || 0,
      change: stock.dayChange || 0,
      changePercent: stock.dayChangePercent || 0,
      volume: stock.volume || 0,
      marketCap: stock.marketCap || 0,
      sector: stock.sector || 'Unknown',
      peRatio: stock.peRatio,
      dividendYield: stock.dividendYield,
    }))

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: results.length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popular stocks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const filters = screenerFiltersSchema.parse(body)

    // Build where clause based on filters
    const where: any = {}

    if (filters.minPrice !== undefined) {
      where.currentPrice = { ...where.currentPrice, gte: filters.minPrice }
    }
    if (filters.maxPrice !== undefined) {
      where.currentPrice = { ...where.currentPrice, lte: filters.maxPrice }
    }
    if (filters.minMarketCap !== undefined) {
      where.marketCap = { ...where.marketCap, gte: filters.minMarketCap }
    }
    if (filters.maxMarketCap !== undefined) {
      where.marketCap = { ...where.marketCap, lte: filters.maxMarketCap }
    }
    if (filters.minPE !== undefined) {
      where.peRatio = { ...where.peRatio, gte: filters.minPE }
    }
    if (filters.maxPE !== undefined) {
      where.peRatio = { ...where.peRatio, lte: filters.maxPE }
    }
    if (filters.minDividendYield !== undefined) {
      where.dividendYield = { ...where.dividendYield, gte: filters.minDividendYield }
    }
    if (filters.maxDividendYield !== undefined) {
      where.dividendYield = { ...where.dividendYield, lte: filters.maxDividendYield }
    }
    if (filters.sectors && filters.sectors.length > 0) {
      where.sector = { in: filters.sectors }
    }

    const stocks = await prisma.stock.findMany({
      where,
      orderBy: {
        marketCap: 'desc',
      },
      take: filters.limit,
      select: {
        ticker: true,
        name: true,
        currentPrice: true,
        marketCap: true,
        sector: true,
        peRatio: true,
        dividendYield: true,
        dayChange: true,
        dayChangePercent: true,
        volume: true,
      },
    })

    const results = stocks.map(stock => ({
      ticker: stock.ticker,
      name: stock.name,
      currentPrice: stock.currentPrice || 0,
      price: stock.currentPrice || 0,
      change: stock.dayChange || 0,
      changePercent: stock.dayChangePercent || 0,
      volume: stock.volume || 0,
      marketCap: stock.marketCap || 0,
      sector: stock.sector || 'Unknown',
      peRatio: stock.peRatio,
      dividendYield: stock.dividendYield,
    }))

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: results.length,
        filters,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid filters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to search stocks' },
      { status: 500 }
    )
  }
}