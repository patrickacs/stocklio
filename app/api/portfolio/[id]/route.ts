/**
 * app/api/portfolio/[id]/route.ts
 * Portfolio API endpoints for individual assets - DELETE & PATCH
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { z } from 'zod';

const updateAssetSchema = z.object({
  shares: z.number().min(0.0001).max(1000000).optional(),
  avgPrice: z.number().min(0.01).max(1000000).optional(),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * DELETE /api/portfolio/[id]
 * Remove an asset from the portfolio
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate ID format (should be a cuid)
    if (!id || id.length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid asset ID',
        },
        { status: 400 }
      );
    }
    
    // Check if asset exists and belongs to user
    const asset = await prisma.asset.findFirst({
      where: { 
        id,
        userId: session.user.id,
      },
    });
    
    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND,
          message: 'Asset not found in portfolio',
        },
        { status: 404 }
      );
    }
    
    // Delete the asset
    await prisma.asset.delete({
      where: { id },
    });
    
    // Also delete any related dividends
    await prisma.dividend.deleteMany({
      where: { assetId: id },
    });
    
    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGES.ASSET_DELETED,
      data: {
        id,
        ticker: asset.ticker,
      },
    });
  } catch (error) {
    
    // Handle Prisma specific errors
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND,
        },
        { status: 404 }
      );
    }
    
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
 * PATCH /api/portfolio/[id]
 * Update an existing asset in the portfolio
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate ID format
    if (!id || id.length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid asset ID',
        },
        { status: 400 }
      );
    }

    // Validate request body with Zod
    const validation = updateAssetSchema.safeParse(body);
    if (!validation.success) {
      const message = validation.error.errors[0]?.message ?? 'Validation error';
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.VALIDATION,
          message,
        },
        { status: 400 }
      );
    }

    const { shares, avgPrice, notes } = validation.data;

    // Check if asset exists and belongs to user
    const asset = await prisma.asset.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND,
          message: 'Asset not found in portfolio',
        },
        { status: 404 }
      );
    }
    
    // Update the asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        ...(shares !== undefined && { shares }),
        ...(avgPrice !== undefined && { avgPrice }),
        ...(notes !== undefined && { notes }),
      },
    });
    
    return NextResponse.json({
      success: true,
      data: updatedAsset,
      message: SUCCESS_MESSAGES.ASSET_UPDATED,
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