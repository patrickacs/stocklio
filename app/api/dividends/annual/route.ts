/**
 * app/api/dividends/annual/route.ts
 * API endpoint for calculating annual dividend income
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import realDataClient from '@/lib/api/real-data-client';
import { DividendSummary, MonthlyDividend, StockDividend } from '@/types';
import { ERROR_MESSAGES } from '@/lib/constants';
import cache from '@/lib/cache';

/**
 * GET /api/dividends/annual
 * Calculate annual dividend income projections
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
    const cacheKey = `dividends:annual:${session.user.id}`;
    const cached = await cache.get<DividendSummary>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
      });
    }
    
    // Fetch user's portfolio assets
    const assets = await prisma.asset.findMany({
      where: { userId: session.user.id },
    });
    
    if (assets.length === 0) {
      const emptySummary: DividendSummary = {
        upcomingDividends: [],
        totalExpected30Days: 0,
        totalExpected90Days: 0,
        annualIncome: 0,
        monthlyAverage: 0,
        monthlyBreakdown: [],
        byMonth: [],
        byStock: [],
      };

      return NextResponse.json({
        success: true,
        data: emptySummary,
      });
    }
    
    // Fetch dividend data for each unique ticker
    const tickers = [...new Set(assets.map(a => a.ticker))];
    const dividendData: Array<{
      ticker: string;
      companyName: string;
      dividends: any[];
      shares: number;
    }> = [];
    
    for (const ticker of tickers) {
      try {
        const [dividends, quote] = await Promise.all([
          realDataClient.getDividends(ticker),
          realDataClient.getQuote(ticker),
        ]);
        
        // Calculate total shares for this ticker
        const tickerAssets = assets.filter(a => a.ticker === ticker);
        const totalShares = tickerAssets.reduce((sum, asset) => sum + asset.shares, 0);
        
        dividendData.push({
          ticker,
          companyName: quote.name,
          dividends,
          shares: totalShares,
        });
      } catch (error) {
        // Error handled silently
      }
    }
    
    // Calculate upcoming dividends for different periods
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    const ninetyDaysFromNow = new Date(today);
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    
    let totalExpected30Days = 0;
    let totalExpected90Days = 0;
    const upcomingDividends: any[] = [];
    
    // Calculate annual projections
    const annualProjections: Map<string, number> = new Map();
    const monthlyProjections: Map<string, number> = new Map();
    const stockDividends: StockDividend[] = [];
    
    for (const { ticker, companyName, dividends, shares } of dividendData) {
      if (dividends.length === 0) continue;
      
      // Get the most recent dividend to determine frequency
      const recentDividends = dividends
        .filter(d => new Date(d.exDate) <= today)
        .sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime())
        .slice(0, 4); // Last 4 dividends to determine pattern
      
      // Determine payment frequency and annual amount
      let annualAmount = 0;
      let frequency = 'quarterly';
      
      if (recentDividends.length >= 2) {
        // Calculate average time between dividends
        const gaps: number[] = [];
        for (let i = 1; i < recentDividends.length; i++) {
          const gap = new Date(recentDividends[i - 1].exDate).getTime() - 
                     new Date(recentDividends[i].exDate).getTime();
          gaps.push(gap);
        }
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const daysGap = avgGap / (1000 * 60 * 60 * 24);
        
        if (daysGap < 35) {
          frequency = 'monthly';
          annualAmount = recentDividends[0].amount * 12 * shares;
        } else if (daysGap < 100) {
          frequency = 'quarterly';
          annualAmount = recentDividends[0].amount * 4 * shares;
        } else if (daysGap < 200) {
          frequency = 'semi-annual';
          annualAmount = recentDividends[0].amount * 2 * shares;
        } else {
          frequency = 'annual';
          annualAmount = recentDividends[0].amount * shares;
        }
      } else if (recentDividends.length === 1) {
        // Assume quarterly if we only have one dividend
        annualAmount = recentDividends[0].amount * 4 * shares;
      }
      
      annualProjections.set(ticker, annualAmount);
      
      // Calculate upcoming dividends
      for (const div of dividends) {
        const exDate = new Date(div.exDate);
        if (exDate >= today) {
          const totalAmount = div.amount * shares;
          
          if (exDate <= thirtyDaysFromNow) {
            totalExpected30Days += totalAmount;
          }
          if (exDate <= ninetyDaysFromNow) {
            totalExpected90Days += totalAmount;
            upcomingDividends.push({
              ...div,
              ticker,
              companyName,
              shares,
              totalAmount,
            });
          }
          
          // Add to monthly projections
          const monthKey = `${exDate.getFullYear()}-${(exDate.getMonth() + 1).toString().padStart(2, '0')}`;
          monthlyProjections.set(monthKey, (monthlyProjections.get(monthKey) || 0) + totalAmount);
        }
      }
      
      // Add to stock dividends array
      if (annualAmount > 0) {
        stockDividends.push({
          ticker,
          companyName,
          annualAmount,
          yield: dividends[0]?.yield || 0,
          frequency,
        });
      }
    }
    
    // Calculate total annual income
    const annualIncome = Array.from(annualProjections.values()).reduce((sum, amount) => sum + amount, 0);
    const monthlyAverage = annualIncome / 12;
    
    // Format monthly breakdown
    const byMonth: MonthlyDividend[] = [];
    const sortedMonths = Array.from(monthlyProjections.keys()).sort();

    for (const monthKey of sortedMonths) {
      const parts = monthKey.split('-');
      const year = parts[0] ?? '';
      const month = parts[1] ?? '';
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      byMonth.push({
        month: monthName,
        year: parseInt(year),
        amount: monthlyProjections.get(monthKey) ?? 0,
        count: upcomingDividends.filter(d => {
          const exDate = new Date(d.exDate);
          return exDate.getFullYear() === parseInt(year) && exDate.getMonth() === parseInt(month) - 1;
        }).length,
      });
    }
    
    // If no future dividends, project based on historical pattern
    if (byMonth.length === 0) {
      const currentMonth = new Date();
      for (let i = 0; i < 12; i++) {
        const projectedMonth = new Date(currentMonth);
        projectedMonth.setMonth(currentMonth.getMonth() + i);
        
        byMonth.push({
          month: projectedMonth.toLocaleDateString('en-US', { month: 'short' }),
          year: projectedMonth.getFullYear(),
          amount: monthlyAverage,
          count: Math.round(stockDividends.filter(s => 
            s.frequency === 'monthly' ? 1 :
            s.frequency === 'quarterly' && i % 3 === 0 ? 1 :
            s.frequency === 'semi-annual' && i % 6 === 0 ? 1 :
            s.frequency === 'annual' && i === 0 ? 1 : 0
          ).length),
        });
      }
    }
    
    // Sort stock dividends by annual amount
    stockDividends.sort((a, b) => b.annualAmount - a.annualAmount);
    
    const monthlyData = byMonth.slice(0, 12); // Next 12 months

    const summary: DividendSummary = {
      upcomingDividends: upcomingDividends.slice(0, 10), // Top 10 upcoming
      totalExpected30Days,
      totalExpected90Days,
      annualIncome,
      monthlyAverage,
      monthlyBreakdown: monthlyData,
      byMonth: monthlyData,
      byStock: stockDividends,
    };
    
    // Cache for 1 hour
    await cache.set(cacheKey, summary, 3600);
    
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