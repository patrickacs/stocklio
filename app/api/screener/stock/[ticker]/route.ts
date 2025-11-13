/**
 * app/api/screener/stock/[ticker]/route.ts
 * API endpoint for fetching detailed stock information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import realDataClient from '@/lib/api/real-data-client';
import { ERROR_MESSAGES } from '@/lib/constants';
import cache from '@/lib/cache';

/**
 * GET /api/screener/stock/[ticker]
 * Get detailed information about a specific stock
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ticker } = await params;
    
    // Validate ticker format
    if (!ticker || ticker.length > 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ticker symbol',
        },
        { status: 400 }
      );
    }
    
    const upperTicker = ticker.toUpperCase();
    
    // Try cache first
    const cacheKey = `stock:detail:${upperTicker}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
      });
    }
    
    // Check if stock exists in database
    let stock = await prisma.stock.findUnique({
      where: { ticker: upperTicker },
    });
    
    // Fetch real-time data from Yahoo Finance
    const [quote, companyInfo, dividends, historicalData] = await Promise.all([
      realDataClient.getQuote(upperTicker),
      realDataClient.getCompanyInfo(upperTicker).catch(() => null),
      realDataClient.getDividends(upperTicker).catch(() => []),
      realDataClient.getHistoricalData(upperTicker, '1y').catch(() => []),
    ]);
    
    // Update or create stock in database
    if (stock) {
      // Update existing stock with latest data
      stock = await prisma.stock.update({
        where: { ticker: upperTicker },
        data: {
          name: quote.name,
          currentPrice: quote.price,
          peRatio: quote.peRatio,
          dividendYield: quote.dividendYield,
          marketCap: quote.marketCap,
          week52High: quote.week52High,
          week52Low: quote.week52Low,
          sector: companyInfo?.sector || stock.sector,
          industry: companyInfo?.industry || stock.industry,
          lastUpdated: new Date(),
        },
      });
    } else {
      // Create new stock entry
      stock = await prisma.stock.create({
        data: {
          ticker: upperTicker,
          name: quote.name,
          currentPrice: quote.price,
          peRatio: quote.peRatio,
          dividendYield: quote.dividendYield,
          marketCap: quote.marketCap,
          week52High: quote.week52High,
          week52Low: quote.week52Low,
          sector: companyInfo?.sector,
          industry: companyInfo?.industry,
        },
      });
    }
    
    // Calculate additional metrics
    const yearAgoPrice = historicalData.length > 250
      ? historicalData[historicalData.length - 250]?.close ?? quote.price
      : historicalData[0]?.close ?? quote.price;
    const yearReturn = ((quote.price - yearAgoPrice) / yearAgoPrice);
    
    // Calculate volatility (simplified)
    let volatility = 0;
    if (historicalData.length > 20) {
      const returns = [];
      for (let i = 1; i < Math.min(historicalData.length, 30); i++) {
        const dailyReturn = ((historicalData[i]?.close ?? 0) - (historicalData[i - 1]?.close ?? 0)) / (historicalData[i - 1]?.close ?? 1);
        returns.push(dailyReturn);
      }
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      volatility = Math.sqrt(variance * 252); // Annualized
    }
    
    // Calculate dividend metrics
    const annualDividend = dividends
      .filter(d => new Date(d.exDate) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .reduce((sum, d) => sum + d.amount, 0);
    
    const dividendGrowth = 0; // Would need more historical data to calculate properly
    
    // Prepare comprehensive response
    const detailedInfo = {
      // Basic info from database
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      industry: stock.industry,
      
      // Real-time quote data
      currentPrice: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      open: quote.open,
      previousClose: quote.previousClose,
      volume: quote.volume,
      
      // Valuation metrics
      marketCap: quote.marketCap,
      peRatio: quote.peRatio,
      pegRatio: null, // Would need earnings growth data
      priceToBook: null, // Would need book value data
      priceToSales: null, // Would need revenue data
      
      // Performance metrics
      week52High: quote.week52High,
      week52Low: quote.week52Low,
      week52Range: {
        low: quote.week52Low,
        high: quote.week52High,
        current: quote.price,
        position: quote.week52High && quote.week52Low 
          ? (quote.price - quote.week52Low) / (quote.week52High - quote.week52Low)
          : 0.5,
      },
      yearReturn,
      volatility,
      
      // Dividend information
      dividendYield: quote.dividendYield,
      annualDividend,
      dividendFrequency: dividends.length > 0 ? dividends[0]?.frequency ?? null : null,
      exDividendDate: dividends.length > 0 && (dividends[0]?.exDate ? new Date(dividends[0].exDate) > new Date() : false)
        ? dividends[0]?.exDate ?? null
        : null,
      dividendGrowth,
      
      // Company information
      description: companyInfo?.description,
      website: companyInfo?.website,
      logo: companyInfo?.logo,
      employees: companyInfo?.employees,
      headquarters: companyInfo?.headquarters,
      founded: companyInfo?.founded,
      
      // Chart data (last 30 days for mini chart)
      chartData: historicalData.slice(-30).map(h => ({
        date: h.date,
        price: h.close,
      })),
      
      // Metadata
      lastUpdated: new Date(),
      dataSource: 'Yahoo Finance',
    };
    
    // Cache for 5 minutes
    await cache.set(cacheKey, detailedInfo, 300);
    
    return NextResponse.json({
      success: true,
      data: detailedInfo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.API_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}