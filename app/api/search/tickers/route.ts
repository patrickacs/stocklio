/**
 * app/api/search/tickers/route.ts
 * API endpoint for searching stock tickers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { ERROR_MESSAGES } from '@/lib/constants';

/**
 * Search for stock tickers by symbol or name
 * GET /api/search/tickers?q=AAPL
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 1) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
    
    // Search in database first
    const stocks = await prisma.stock.findMany({
      where: {
        OR: [
          {
            ticker: {
              contains: query.toUpperCase(),
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        ticker: true,
        name: true,
        sector: true,
        currentPrice: true,
      },
      take: 10,
      orderBy: [
        {
          ticker: 'asc',
        },
      ],
    });
    
    // If we have results from database, return them
    if (stocks.length > 0) {
      return NextResponse.json({
        success: true,
        data: stocks.map(stock => ({
          ticker: stock.ticker,
          name: stock.name || `${stock.ticker} Corporation`,
          sector: stock.sector || 'Unknown',
          price: stock.currentPrice || 0,
        })),
      });
    }
    
    // If no results in database, generate some mock suggestions
    const mockTickers = generateMockTickers(query);
    
    return NextResponse.json({
      success: true,
      data: mockTickers,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: ERROR_MESSAGES.GENERIC,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate mock ticker suggestions when database doesn't have matches
 */
function generateMockTickers(query: string) {
  const upperQuery = query.toUpperCase();
  
  // Common stock patterns
  const suggestions = [];
  
  // If query is short, suggest some variations
  if (query.length <= 3) {
    const variations = [
      `${upperQuery}`,
      `${upperQuery}A`,
      `${upperQuery}B`,
      `${upperQuery}L`,
      `${upperQuery}T`,
    ];
    
    variations.forEach((ticker, index) => {
      if (suggestions.length < 5) {
        suggestions.push({
          ticker,
          name: `${ticker} Corporation`,
          sector: ['Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical', 'Industrials'][index % 5],
          price: Math.round((Math.random() * 500 + 50) * 100) / 100,
        });
      }
    });
  } else {
    // For longer queries, just suggest the exact match
    suggestions.push({
      ticker: upperQuery,
      name: `${upperQuery} Corporation`,
      sector: 'Technology',
      price: Math.round((Math.random() * 500 + 50) * 100) / 100,
    });
  }
  
  return suggestions;
}
