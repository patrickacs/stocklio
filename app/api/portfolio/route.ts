/**
 * app/api/portfolio/route.ts
 * Portfolio API endpoints - GET all assets, POST new asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import realDataClient from '@/lib/api/real-data-client';
import { addAssetSchema } from '@/lib/validations';
import { EnrichedAsset } from '@/types';
import { calculateProfitLoss } from '@/lib/utils';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';

/**
 * GET /api/portfolio
 * Fetch all portfolio assets with real-time market data
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

    // Fetch user's assets from database
    const assets = await prisma.asset.findMany({
      where: { userId: session.user.id },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    if (assets.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Portfolio is empty',
      });
    }
    
    // Fetch real-time quotes for all assets in parallel
    const tickers = [...new Set(assets.map(a => a.ticker))];
    const quotes = await Promise.all(
      tickers.map(ticker => realDataClient.getQuote(ticker))
    );
    
    // Create a map for quick quote lookup
    const quoteMap = new Map(quotes.map(q => [q.ticker, q]));
    
    // Enrich assets with real-time data
    const enrichedAssets: EnrichedAsset[] = assets.map(asset => {
      const quote = quoteMap.get(asset.ticker);

      // Validate quote and price data
      if (!quote || typeof quote.price !== 'number' || isNaN(quote.price) || quote.price === 0) {
        // If quote fetch failed or price is invalid, return asset with zero values
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
          companyName: `${asset.ticker} Corporation`,
          sector: 'Technology',
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
        totalValue: calculations.currentValue, // Added for compatibility
        currentValue: calculations.currentValue,
        totalCost: calculations.totalCost,
        profitLoss: calculations.profitLoss,
        profitLossPercent: calculations.returnPercent,
        dayChange: (quote.change || 0) * asset.shares,
        dayChangePercent: quote.changePercent || 0,
        companyName: quote.name || `${asset.ticker} Corporation`,
        sector: undefined, // Will be populated if we fetch company info
      };
    });
    
    return NextResponse.json({
      success: true,
      data: enrichedAssets,
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
 * POST /api/portfolio
 * Add a new asset to the portfolio
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

    // Parse and validate request body
    const body = await request.json();
    const validation = addAssetSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.VALIDATION,
          details: validation.error.errors.map(e => e.message).join(', '),
        },
        { status: 400 }
      );
    }
    
    const { ticker, shares, avgPrice, purchaseDate, notes } = validation.data;
    
  // Verify ticker is valid by fetching quote
  try {
    const quote = await realDataClient.getQuote(ticker);
    if (!quote || quote.price === 0) {
      throw new Error('Invalid ticker');
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.INVALID_TICKER,
        message: `Unable to find stock with ticker: ${ticker}`,
      },
      { status: 400 }
    );
  }
    
    // Check if asset already exists for this user (optional - allow multiple positions)
    const existingAsset = await prisma.asset.findFirst({
      where: {
        ticker: ticker.toUpperCase(),
        userId: session.user.id,
      },
    });
    
    if (existingAsset) {
      // Update existing asset - calculate new average price
      const totalShares = existingAsset.shares + shares;
      const totalCost = (existingAsset.shares * existingAsset.avgPrice) + (shares * avgPrice);
      const newAvgPrice = totalCost / totalShares;
      
      const updatedAsset = await prisma.asset.update({
        where: {
          id: existingAsset.id,
        },
        data: {
          shares: totalShares,
          avgPrice: newAvgPrice,
          notes: notes || existingAsset.notes,
        },
      });
      
      return NextResponse.json({
        success: true,
        data: updatedAsset,
        message: `Added ${shares} shares to existing ${ticker} position`,
      });
    }
    
    // Create new asset
    const newAsset = await prisma.asset.create({
      data: {
        ticker: ticker.toUpperCase(),
        shares,
        avgPrice,
        purchaseDate: purchaseDate || new Date(),
        notes,
        userId: session.user.id,
      },
    });
    
    // Fetch real-time data for the new asset
    const quote = await realDataClient.getQuote(ticker);

    // Ensure quote.price is valid
    const currentPrice = (quote && typeof quote.price === 'number' && !isNaN(quote.price))
      ? quote.price
      : avgPrice; // Fallback to purchase price if quote is invalid

    const calculations = calculateProfitLoss(currentPrice, avgPrice, shares);

    const enrichedAsset: EnrichedAsset = {
      ...newAsset,
      currentPrice,
      totalValue: calculations.currentValue, // Added for compatibility
      currentValue: calculations.currentValue,
      totalCost: calculations.totalCost,
      profitLoss: calculations.profitLoss,
      profitLossPercent: calculations.returnPercent,
      dayChange: (quote?.change || 0) * shares,
      dayChangePercent: quote?.changePercent || 0,
      companyName: quote?.name || `${ticker} Corporation`,
    };
    
    return NextResponse.json(
      {
        success: true,
        data: enrichedAsset,
        message: SUCCESS_MESSAGES.ASSET_ADDED,
      },
      { status: 201 }
    );
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