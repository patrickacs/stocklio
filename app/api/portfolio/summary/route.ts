/**
 * app/api/portfolio/summary/route.ts
 * Portfolio summary API endpoint - aggregate statistics and allocation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import realDataClient from '@/lib/api/real-data-client';
import { PortfolioSummary, EnrichedAsset, AllocationData } from '@/types';
import { calculateProfitLoss, groupBy } from '@/lib/utils';
import { ERROR_MESSAGES, CHART_COLORS } from '@/lib/constants';
import cache from '@/lib/cache';

/**
 * GET /api/portfolio/summary
 * Get portfolio summary statistics and allocation data
 */
export async function GET(_request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Try cache first (user-specific)
    const cacheKey = `portfolio:summary:${session.user.id}`;
    const cached = await cache.get<PortfolioSummary>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
      });
    }
    
    // Fetch user's assets from database
    const assets = await prisma.asset.findMany({
      where: { userId: session.user.id },
    });
    
    if (assets.length === 0) {
      const emptySummary: PortfolioSummary = {
        totalValue: 0,
        totalCost: 0,
        totalProfitLoss: 0,
        totalProfitLossPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        assetCount: 0,
        topGainers: [],
        topLosers: [],
        allocation: [],
        allocationByAsset: [],
      };

      // Cache empty summary for shorter time (1 minute) to ensure fresh data for new users
      await cache.set(cacheKey, emptySummary, 60);
      
      return NextResponse.json({
        success: true,
        data: emptySummary,
      });
    }
    
    // Fetch real-time quotes for all assets
    const tickers = [...new Set(assets.map(a => a.ticker))];
    const [quotes, companyInfos] = await Promise.all([
      Promise.all(tickers.map(ticker => realDataClient.getQuote(ticker))),
      Promise.all(tickers.map(ticker => 
        realDataClient.getCompanyInfo(ticker).catch(() => null)
      )),
    ]);
    
    // Create maps for quick lookup
    const quoteMap = new Map(quotes.map(q => [q.ticker, q]));
    const companyMap = new Map(
      companyInfos
        .filter(info => info !== null)
        .map(info => [info!.ticker, info!])
    );
    
    // Helper function to get sector for ticker
    const getSectorForTicker = (ticker: string): string => {
      const sectorMap: { [key: string]: string } = {
        'AAPL': 'Technology',
        'GOOGL': 'Communication Services',
        'MSFT': 'Technology',
        'AMZN': 'Consumer Discretionary',
        'TSLA': 'Consumer Discretionary',
        'NVDA': 'Technology',
        'META': 'Communication Services',
        'NFLX': 'Communication Services',
        'V': 'Financial Services',
        'JPM': 'Financial Services',
        'JNJ': 'Healthcare',
        'WMT': 'Consumer Defensive',
        'PG': 'Consumer Defensive',
        'UNH': 'Healthcare',
        'HD': 'Consumer Discretionary',
        'BAC': 'Financial Services',
        'XOM': 'Energy',
        'CVX': 'Energy',
        'LLY': 'Healthcare',
        'ABBV': 'Healthcare',
        'BLK': 'Financial Services',
        'ADBE': 'Technology',
        'AXP': 'Financial Services',
      };
      return sectorMap[ticker.toUpperCase()] || 'Technology';
    };

    // Enrich assets with real-time data
    const enrichedAssets: EnrichedAsset[] = assets.map(asset => {
      const quote = quoteMap.get(asset.ticker);
      const company = companyMap.get(asset.ticker);
      
      if (!quote) {
        return {
          ...asset,
          currentPrice: 0,
          totalValue: 0,
          currentValue: 0,
          totalCost: asset.shares * asset.avgPrice,
          profitLoss: 0,
          profitLossPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
          companyName: asset.ticker,
          sector: getSectorForTicker(asset.ticker),
        };
      }
      
      const calculations = calculateProfitLoss(
        quote.price,
        asset.avgPrice,
        asset.shares,
      );
      
      return {
        ...asset,
        currentPrice: quote.price,
        totalValue: calculations.currentValue,
        currentValue: calculations.currentValue,
        totalCost: calculations.totalCost,
        profitLoss: calculations.profitLoss,
        profitLossPercent: calculations.returnPercent,
        dayChange: quote.change * asset.shares,
        dayChangePercent: quote.changePercent,
        companyName: quote.name,
        sector: company?.sector || getSectorForTicker(asset.ticker),
      };
    });
    
    // Calculate totals
    const totalValue = enrichedAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalCost = enrichedAssets.reduce((sum, asset) => sum + asset.totalCost, 0);
    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) : 0;
    const dayChange = enrichedAssets.reduce((sum, asset) => sum + asset.dayChange, 0);
    const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) : 0;
    
    // Get top gainers and losers
    const sortedByReturn = [...enrichedAssets].sort(
      (a, b) => b.profitLossPercent - a.profitLossPercent
    );
    const topGainers = sortedByReturn
      .filter(a => a.profitLossPercent > 0)
      .slice(0, 5);
    const topLosers = sortedByReturn
      .filter(a => a.profitLossPercent < 0)
      .slice(-5)
      .reverse();
    
    // Calculate allocation by sector
    const bySector = groupBy(enrichedAssets, 'sector');
    const allocation: AllocationData[] = Object.entries(bySector).map(
      ([sector, assets], index) => {
        const sectorValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
        return {
          sector: sector || 'Other',
          name: sector || 'Other',
          value: sectorValue,
          percentage: (sectorValue / totalValue) * 100, // Convert to percentage
          color: CHART_COLORS.SECTORS[index % CHART_COLORS.SECTORS.length],
        };
      }
    ).sort((a, b) => b.value - a.value);
    
    // Alternative allocation by asset
    const allocationByAsset: AllocationData[] = enrichedAssets
      .map((asset, index) => ({
        sector: asset.sector || 'Other',
        name: asset.ticker,
        value: asset.currentValue,
        percentage: (asset.currentValue / totalValue) * 100, // Convert to percentage
        color: CHART_COLORS.SECTORS[index % CHART_COLORS.SECTORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 for cleaner chart
    
    const summary: PortfolioSummary = {
      totalValue,
      totalCost,
      totalProfitLoss,
      totalProfitLossPercent,
      dayChange,
      dayChangePercent,
      assetCount: assets.length,
      topGainers,
      topLosers,
      allocation, // By sector
      allocationByAsset, // By individual asset
    };
    
    // Cache the summary for 5 minutes
    await cache.set(cacheKey, summary, 300);
    
    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.DATABASE_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portfolio/summary/refresh
 * Force refresh portfolio summary (clear cache)
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clear cache with correct user-specific key
    const cacheKey = `portfolio:summary:${session.user.id}`;
    await cache.delete(cacheKey);

    // Fetch fresh summary
    const response = await GET(request);
    const data = await response.json();

    return NextResponse.json({
      ...data,
      message: 'Portfolio summary refreshed',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.GENERIC,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}