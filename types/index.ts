// Type definitions - to be created in Phase 2
/**
 * types/index.ts
 * Global TypeScript type definitions for STOCKLIO
 */

import { Asset, Stock } from '@prisma/client';

// ============================================
// API Response Types
// ============================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Stock Market Data Types
// ============================================

/**
 * Real-time stock quote from external API
 */
export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  week52High?: number;
  week52Low?: number;
  timestamp: Date;
}

/**
 * Company information
 */
export interface CompanyInfo {
  ticker: string;
  name: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  logo?: string;
  employees?: number;
  headquarters?: string;
  founded?: string;
}

/**
 * Historical price data point
 */
export interface PriceHistory {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

/**
 * Dividend information
 */
export interface DividendInfo {
  ticker: string;
  exDate: string; // ISO date string
  payDate: string; // ISO date string
  amount: number;
  frequency?: 'quarterly' | 'monthly' | 'annual' | 'semi-annual';
  yield?: number;
}

// ============================================
// Portfolio Types
// ============================================

/**
 * Asset with enriched market data
 */
export interface EnrichedAsset extends Asset {
  name?: string;
  currentPrice: number;
  totalValue: number;
  currentValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  companyName?: string;
  sector?: string;
}

/**
 * Portfolio summary statistics
 */
export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  assetCount: number;
  topGainers: EnrichedAsset[];
  topLosers: EnrichedAsset[];
  allocation: AllocationData[];
  allocationByAsset: AllocationData[];
}

/**
 * Allocation data for charts
 */
export interface AllocationData {
  sector: string;
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

// ============================================
// Dividend Types
// ============================================

/**
 * Upcoming dividend payment
 */
export interface UpcomingDividend {
  id: string;
  ticker: string;
  exDate: string; // ISO date string
  payDate: string; // ISO date string
  amount: number;
  frequency: string | null;
  assetId: string | null;
  createdAt: Date;
  companyName: string;
  shares: number;
  totalAmount: number;
}

/**
 * Dividend summary statistics
 */
export interface DividendSummary {
  upcomingDividends: UpcomingDividend[];
  totalExpected30Days: number;
  totalExpected90Days: number;
  annualIncome: number;
  monthlyAverage: number;
  monthlyBreakdown: MonthlyDividend[];
  byMonth: MonthlyDividend[];
  byStock: StockDividend[];
}

/**
 * Monthly dividend breakdown
 */
export interface MonthlyDividend {
  month: string;
  year: number;
  amount: number;
  count: number;
}

/**
 * Per-stock dividend breakdown
 */
export interface StockDividend {
  ticker: string;
  companyName: string;
  annualAmount: number;
  yield: number;
  frequency: string;
}

// ============================================
// Screener Types
// ============================================

/**
 * Stock screener filters
 */
export interface ScreenerFilters {
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPE?: number;
  maxPE?: number;
  minDividendYield?: number;
  maxDividendYield?: number;
  sectors?: string[];
  sortBy?: 'price' | 'marketCap' | 'pe' | 'dividendYield' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Screener result
 */
export interface ScreenerResult extends Stock {
  rank?: number;
  score?: number;
  change?: number;
  changePercent?: number;
}

/**
 * Stock comparison data
 */
export interface StockComparison {
  tickers: string[];
  metrics: ComparisonMetric[];
  priceHistory: PriceHistory[][];
}

/**
 * Comparison metric
 */
export interface ComparisonMetric {
  label: string;
  values: (string | number | null)[];
  format?: 'currency' | 'percent' | 'number' | 'text';
}

// ============================================
// Form Input Types
// ============================================

/**
 * Add asset form data
 */
export interface AddAssetInput {
  ticker: string;
  shares: number;
  avgPrice: number;
  purchaseDate?: Date | string;
  notes?: string;
}

/**
 * Update asset form data
 */
export interface UpdateAssetInput {
  shares?: number;
  avgPrice?: number;
  notes?: string;
}

// ============================================
// Cache Types
// ============================================

/**
 * Cache entry structure
 */
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================
// External API Types
// ============================================

/**
 * Yahoo Finance API response
 */
export interface YahooFinanceQuote {
  quoteResponse: {
    result: Array<{
      symbol: string;
      longName?: string;
      regularMarketPrice: number;
      regularMarketChange: number;
      regularMarketChangePercent: number;
      regularMarketDayHigh: number;
      regularMarketDayLow: number;
      regularMarketOpen: number;
      regularMarketPreviousClose: number;
      regularMarketVolume: number;
      marketCap?: number;
      trailingPE?: number;
      dividendYield?: number;
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekLow?: number;
    }>;
    error: any;
  };
}

/**
 * Alpha Vantage API response
 */
export interface AlphaVantageQuote {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

// ============================================
// Chart Data Types
// ============================================

/**
 * Chart data point
 */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Portfolio performance data
 */
export interface PerformanceData {
  daily: ChartDataPoint[];
  weekly: ChartDataPoint[];
  monthly: ChartDataPoint[];
  yearly: ChartDataPoint[];
}

// ============================================
// Utility Types
// ============================================

/**
 * Sort configuration
 */
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
}

/**
 * Table column definition
 */
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: T) => React.ReactNode;
}

// ============================================
// Response Status Types
// ============================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface QueryState<T = any> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

// ============================================
// Export Type Guards
// ============================================

/**
 * Type guard to check if value is EnrichedAsset
 */
export const isEnrichedAsset = (asset: any): asset is EnrichedAsset => {
  return (
    asset &&
    typeof asset.currentPrice === 'number' &&
    typeof asset.profitLoss === 'number'
  );
};

/**
 * Type guard to check if response is successful
 */
export const isSuccessResponse = <T>(
  response: ApiResponse<T>,
): response is ApiResponse<T> & { data: T } => {
  return response.success === true && response.data !== undefined;
};