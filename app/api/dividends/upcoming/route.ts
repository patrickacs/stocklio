/**
 * app/api/dividends/upcoming/route.ts
 * API endpoint for fetching upcoming dividend payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import realDataClient from '@/lib/api/real-data-client';
import { UpcomingDividend } from '@/types';
import { ERROR_MESSAGES } from '@/lib/constants';
import cache from '@/lib/cache';

/**
 * GET /api/dividends/upcoming
 * Fetch upcoming dividend payments for portfolio assets
 * Query params: ?days=30 (default: 30 days)
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        {
          success: false,
          error: 'Days parameter must be between 1 and 365',
        },
        { status: 400 }
      );
    }
    
    // Try cache first
    const cacheKey = `dividends:upcoming:${days}`;
    const cached = await cache.get<UpcomingDividend[]>(cacheKey);
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
      return NextResponse.json({
        success: true,
        data: {
          dividends: [],
          totalExpected: 0,
        },
        message: 'No assets in portfolio',
      });
    }
    
    // Fetch dividend data for each unique ticker
    const tickers = [...new Set(assets.map(a => a.ticker))];
    const dividendPromises = tickers.map(async (ticker) => {
      try {
        const dividends = await realDataClient.getDividends(ticker);
        const quote = await realDataClient.getQuote(ticker);
        return { ticker, dividends, companyName: quote.name };
      } catch (error) {
        return { ticker, dividends: [], companyName: ticker };
      }
    });
    
    const dividendResults = await Promise.all(dividendPromises);
    
    // Calculate date range
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);
    
    // Filter and enrich dividend data
    const upcomingDividends: UpcomingDividend[] = [];
    
    for (const { ticker, dividends, companyName } of dividendResults) {
      // Get all assets for this ticker (user might have multiple positions)
      const tickerAssets = assets.filter(a => a.ticker === ticker);
      const totalShares = tickerAssets.reduce((sum, asset) => sum + asset.shares, 0);
      
      if (totalShares === 0) continue;
      
      // Filter dividends within date range
      const upcomingForTicker = dividends.filter(div => {
        const exDate = new Date(div.exDate);
        return exDate >= today && exDate <= endDate;
      });
      
      // Create enriched dividend entries
      for (const div of upcomingForTicker) {
        // Validate dividend amount
        const dividendAmount = typeof div.amount === 'number' && !isNaN(div.amount) ? div.amount : 0;
        const totalAmount = dividendAmount * totalShares;

        // Store or update dividend in database
        const exDate = new Date(div.exDate);
        const payDate = new Date(div.payDate);
        const exDateString = typeof div.exDate === 'string' ? div.exDate : exDate.toISOString();
        const payDateString = typeof div.payDate === 'string' ? div.payDate : payDate.toISOString();
        const frequency = div.frequency ?? null;

        const existingDividend = await prisma.dividend.findFirst({
          where: {
            ticker,
            exDate: exDate,
          },
        });

        if (!existingDividend) {
          await prisma.dividend.create({
            data: {
              ticker,
              exDate: exDate,
              payDate: payDate,
              amount: dividendAmount,
              frequency: frequency,
              assetId: tickerAssets[0]?.id, // Link to first asset for this ticker
            },
          });
        }

        upcomingDividends.push({
          id: existingDividend?.id || '',
          ticker,
          exDate: exDateString,
          payDate: payDateString,
          amount: dividendAmount,
          frequency: frequency,
          createdAt: existingDividend?.createdAt || new Date(),
          assetId: tickerAssets[0]?.id || null,
          companyName,
          shares: totalShares,
          totalAmount,
        });
      }
    }
    
    // Sort by ex-dividend date
    upcomingDividends.sort((a, b) => 
      new Date(a.exDate).getTime() - new Date(b.exDate).getTime()
    );
    
    // Calculate total expected dividends
    const totalExpected = upcomingDividends.reduce(
      (sum, div) => sum + div.totalAmount, 
      0
    );
    
    const response = {
      dividends: upcomingDividends,
      totalExpected,
      period: {
        days,
        startDate: today,
        endDate,
      },
    };
    
    // Cache for 1 hour
    await cache.set(cacheKey, response, 3600);
    
    return NextResponse.json({
      success: true,
      data: response,
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