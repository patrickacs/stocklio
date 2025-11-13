/**
 * lib/rate-limit.ts
 * Simple in-memory rate limiting for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, consider using Redis or Vercel KV
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Rate limit middleware
 * @param request - Next.js request object
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns NextResponse if rate limit exceeded, null otherwise
 */
export function rateLimit(
  request: NextRequest,
  limit: number = 60,
  windowMs: number = 60000 // 1 minute default
): NextResponse | null {
  // Get client identifier (IP address or session ID)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  // If no entry exists or window has expired, create new entry
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });

    // Clean up old entries periodically
    if (rateLimitMap.size > 10000) {
      cleanupExpiredEntries();
    }

    return null;
  }

  // If limit exceeded, return 429 error
  if (userLimit.count >= limit) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);

    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString(),
        },
      }
    );
  }

  // Increment counter
  userLimit.count++;

  // Return null to indicate request should proceed
  return null;
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitMap.forEach((value, key) => {
    if (now > value.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => rateLimitMap.delete(key));
}

/**
 * Get rate limit status for debugging
 */
export function getRateLimitStatus(ip: string): {
  count: number;
  limit: number;
  remaining: number;
  resetTime: number;
} | null {
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    return null;
  }

  return {
    count: entry.count,
    limit: 60, // Default limit
    remaining: Math.max(0, 60 - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Clear all rate limit entries (for testing)
 */
export function clearRateLimits(): void {
  rateLimitMap.clear();
}

// Periodic cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredEntries();
  }, 10 * 60 * 1000);
}
