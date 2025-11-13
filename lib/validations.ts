// Validation schemas - to be created in Phase 2
/**
 * lib/validations.ts
 * Zod validation schemas for form inputs and API requests
 */

import { z } from 'zod';
import { VALIDATION } from './constants';

// ============================================
// Common Schemas
// ============================================

/**
 * Stock ticker validation
 */
export const tickerSchema = z
  .string()
  .min(VALIDATION.TICKER.MIN_LENGTH, 'Ticker is required')
  .max(VALIDATION.TICKER.MAX_LENGTH, 'Ticker is too long')
  .transform((val) => val.toUpperCase())
  .refine(
    (val) => VALIDATION.TICKER.PATTERN.test(val),
    VALIDATION.TICKER.MESSAGE,
  );

/**
 * Positive number validation
 */
export const positiveNumberSchema = z
  .number()
  .positive('Value must be positive')
  .finite('Value must be finite');

/**
 * Currency amount validation
 */
export const currencySchema = z
  .number()
  .min(VALIDATION.PRICE.MIN, VALIDATION.PRICE.MESSAGE)
  .max(VALIDATION.PRICE.MAX, VALIDATION.PRICE.MESSAGE)
  .finite('Price must be finite')
  .transform((val) => Math.round(val * 100) / 100); // Round to 2 decimals

/**
 * Share quantity validation
 */
export const sharesSchema = z
  .number()
  .min(VALIDATION.SHARES.MIN, VALIDATION.SHARES.MESSAGE)
  .max(VALIDATION.SHARES.MAX, VALIDATION.SHARES.MESSAGE)
  .finite('Shares must be finite');

/**
 * Optional date validation
 */
export const optionalDateSchema = z
  .union([z.string(), z.date()])
  .optional()
  .transform((val) => (val ? new Date(val) : undefined));

// ============================================
// Portfolio Schemas
// ============================================

/**
 * Add asset to portfolio schema
 */
export const addAssetSchema = z.object({
  ticker: tickerSchema,
  shares: sharesSchema,
  avgPrice: currencySchema,
  purchaseDate: optionalDateSchema,
  notes: z.string().max(500, 'Notes too long').optional(),
});

export type AddAssetInput = z.infer<typeof addAssetSchema>;

/**
 * Update existing asset schema
 */
export const updateAssetSchema = z.object({
  shares: sharesSchema.optional(),
  avgPrice: currencySchema.optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

/**
 * Delete asset schema (ID validation)
 */
export const deleteAssetSchema = z.object({
  id: z.string().cuid('Invalid asset ID'),
});

// ============================================
// Screener Schemas
// ============================================

/**
 * Stock screener filters schema
 */
export const screenerFiltersSchema = z.object({
  // Price filters
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().positive().optional(),
  
  // Market cap filters (in billions)
  minMarketCap: z.number().min(0).optional(),
  maxMarketCap: z.number().positive().optional(),
  
  // P/E ratio filters
  minPE: z.number().optional(),
  maxPE: z.number().optional(),
  
  // Dividend yield filters (as percentage)
  minDividendYield: z.number().min(0).max(100).optional(),
  maxDividendYield: z.number().min(0).max(100).optional(),
  
  // Sector filter
  sectors: z.array(z.string()).optional(),
  
  // Sorting
  sortBy: z.enum(['price', 'marketCap', 'pe', 'dividendYield', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  
  // Pagination
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(100).default(50).optional(),
}).refine(
  (data) => {
    // Validate min/max relationships
    if (data.minPrice && data.maxPrice && data.minPrice > data.maxPrice) {
      return false;
    }
    if (data.minMarketCap && data.maxMarketCap && data.minMarketCap > data.maxMarketCap) {
      return false;
    }
    if (data.minPE && data.maxPE && data.minPE > data.maxPE) {
      return false;
    }
    if (data.minDividendYield && data.maxDividendYield && data.minDividendYield > data.maxDividendYield) {
      return false;
    }
    return true;
  },
  {
    message: 'Min values cannot be greater than max values',
  },
);

export type ScreenerFilters = z.infer<typeof screenerFiltersSchema>;

/**
 * Stock comparison request schema
 */
export const compareStocksSchema = z.object({
  tickers: z
    .array(tickerSchema)
    .min(2, 'Select at least 2 stocks to compare')
    .max(5, 'Cannot compare more than 5 stocks'),
});

// ============================================
// Dividend Schemas
// ============================================

/**
 * Dividend query parameters
 */
export const dividendQuerySchema = z.object({
  days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30)
    .optional(),
});

/**
 * Dividend date range query
 */
export const dividendRangeSchema = z.object({
  startDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  endDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
}).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: 'Start date must be before end date',
  },
);

// ============================================
// API Request Schemas
// ============================================

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  from: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  to: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
}).refine(
  (data) => data.from <= data.to,
  {
    message: 'From date must be before to date',
  },
);

// ============================================
// Cache Schemas
// ============================================

/**
 * Cache key validation
 */
export const cacheKeySchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-zA-Z0-9:_-]+$/, 'Invalid cache key format');

/**
 * Cache entry schema
 */
export const cacheEntrySchema = z.object({
  key: cacheKeySchema,
  value: z.any(),
  ttl: z.number().int().positive().optional(), // Time to live in seconds
});

// ============================================
// User Preference Schemas
// ============================================

/**
 * User preferences schema (for future use)
 */
export const userPreferencesSchema = z.object({
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY']).default('USD'),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).default('MM/DD/YYYY'),
  showDividends: z.boolean().default(true),
  defaultView: z.enum(['portfolio', 'dividends', 'screener']).default('portfolio'),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
});

// ============================================
// Response Validation Schemas
// ============================================

/**
 * API success response schema
 */
export const apiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

/**
 * API error response schema
 */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
});

/**
 * Paginated response schema
 */
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });

// ============================================
// Helper Functions
// ============================================

/**
 * Safely parse data with Zod schema
 * @param schema - Zod schema to use
 * @param data - Data to parse
 * @returns Parsed data or validation errors
 */
export function safeParse<T extends z.ZodType>(
  schema: T,
  data: unknown,
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
  
  return { success: false, errors };
}

/**
 * Format Zod errors for display
 * @param error - Zod error object
 * @returns Formatted error message
 */
export function formatZodError(error: z.ZodError): string {
  const messages = error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
  
  return messages.join(', ');
}

/**
 * Create a validated API handler
 * @param schema - Zod schema for validation
 * @param handler - Request handler function
 */
export function withValidation<T extends z.ZodType>(
  schema: T,
  handler: (data: z.infer<T>) => Promise<Response>,
) {
  return async (request: Request) => {
    try {
      const body = await request.json();
      const result = schema.safeParse(body);
      
      if (!result.success) {
        return Response.json(
          {
            success: false,
            error: 'Validation failed',
            details: formatZodError(result.error),
          },
          { status: 400 },
        );
      }
      
      return handler(result.data);
    } catch (error) {
      return Response.json(
        {
          success: false,
          error: 'Invalid request body',
        },
        { status: 400 },
      );
    }
  };
}