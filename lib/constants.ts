// Application constants - to be created in Phase 2
/**
 * lib/constants.ts
 * Application constants and configuration values
 */

// ============================================
// Application Info
// ============================================

export const APP_NAME = 'STOCKLIO';
export const APP_TAGLINE = 'Your stock portfolio, simplified';
export const APP_DESCRIPTION = 'Premium investment portfolio management platform with real-time tracking, dividend calendar, and stock screening tools.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================
// API Configuration
// ============================================

export const API_BASE_URL = '/api';
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// ============================================
// Cache Configuration
// ============================================

export const CACHE_DURATIONS = {
  QUOTES: 5 * 60, // 5 minutes for real-time quotes
  COMPANY_INFO: 24 * 60 * 60, // 24 hours for company info
  DIVIDENDS: 60 * 60, // 1 hour for dividend data
  HISTORICAL: 15 * 60, // 15 minutes for historical data
  SCREENER: 10 * 60, // 10 minutes for screener results
} as const;

// ============================================
// Rate Limiting
// ============================================

export const RATE_LIMITS = {
  QUOTES_PER_MINUTE: 60,
  SEARCH_PER_MINUTE: 30,
  API_CALLS_PER_MINUTE: 100,
} as const;

// ============================================
// Pagination
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SCREENER_PAGE_SIZE: 50,
} as const;

// ============================================
// Stock Market Configuration
// ============================================

export const MARKET_HOURS = {
  OPEN: { hour: 9, minute: 30 }, // 9:30 AM ET
  CLOSE: { hour: 16, minute: 0 }, // 4:00 PM ET
  TIMEZONE: 'America/New_York',
} as const;

export const MARKET_SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Cyclical',
  'Communication Services',
  'Industrial',
  'Consumer Defensive',
  'Energy',
  'Utilities',
  'Real Estate',
  'Basic Materials',
] as const;

export const MARKET_CAP_RANGES = {
  MEGA: { min: 200_000_000_000, label: 'Mega Cap (>$200B)' },
  LARGE: { min: 10_000_000_000, max: 200_000_000_000, label: 'Large Cap ($10B-$200B)' },
  MID: { min: 2_000_000_000, max: 10_000_000_000, label: 'Mid Cap ($2B-$10B)' },
  SMALL: { min: 300_000_000, max: 2_000_000_000, label: 'Small Cap ($300M-$2B)' },
  MICRO: { max: 300_000_000, label: 'Micro Cap (<$300M)' },
} as const;

// ============================================
// Portfolio Configuration
// ============================================

export const PORTFOLIO_LIMITS = {
  MAX_ASSETS: 100,
  MIN_SHARES: 0.01,
  MAX_SHARES: 1_000_000,
  MIN_PRICE: 0.01,
  MAX_PRICE: 1_000_000,
} as const;

// ============================================
// Chart Configuration
// ============================================

export const CHART_COLORS = {
  PRIMARY: '#1e3a8a', // Navy
  SUCCESS: '#10b981', // Green
  DANGER: '#ef4444', // Red
  WARNING: '#f59e0b', // Amber
  INFO: '#3b82f6', // Blue
  SECTORS: [
    '#1e3a8a', // Navy
    '#10b981', // Green
    '#059669', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#6366f1', // Indigo
    '#84cc16', // Lime
    '#06b6d4', // Cyan
  ],
} as const;

export const CHART_CONFIG = {
  HEIGHT: 400,
  MOBILE_HEIGHT: 300,
  ANIMATION_DURATION: 400,
  GRID_OPACITY: 0.1,
  AXIS_OPACITY: 0.3,
} as const;

// ============================================
// Form Validation
// ============================================

export const VALIDATION = {
  TICKER: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 5,
    PATTERN: /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/,
    MESSAGE: 'Ticker must be 1-5 uppercase letters',
  },
  SHARES: {
    MIN: 0.01,
    MAX: 1_000_000,
    MESSAGE: 'Shares must be between 0.01 and 1,000,000',
  },
  PRICE: {
    MIN: 0.01,
    MAX: 1_000_000,
    MESSAGE: 'Price must be between $0.01 and $1,000,000',
  },
} as const;

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
  INVALID_TICKER: 'Invalid stock ticker. Please verify and try again.',
  API_ERROR: 'Unable to fetch data from external service.',
  DATABASE_ERROR: 'Database operation failed. Please try again.',
} as const;

// ============================================
// Success Messages
// ============================================

export const SUCCESS_MESSAGES = {
  ASSET_ADDED: 'Stock added to portfolio successfully!',
  ASSET_UPDATED: 'Stock updated successfully!',
  ASSET_DELETED: 'Stock removed from portfolio.',
  DATA_REFRESHED: 'Data refreshed successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// ============================================
// Date Formats
// ============================================

export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: 'yyyy-MM-dd',
  MONTH_YEAR: 'MMM yyyy',
  DAY_MONTH: 'MMM d',
} as const;

// ============================================
// Number Formats
// ============================================

export const NUMBER_FORMATS = {
  CURRENCY: {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  PERCENT: {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  NUMBER: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  LARGE_NUMBER: {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  },
} as const;

// ============================================
// External API Keys (Development Fallbacks)
// ============================================

export const API_KEYS = {
  YAHOO_FINANCE: process.env.YAHOO_FINANCE_API_KEY || '',
  ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_API_KEY || '',
  FMP: process.env.FMP_API_KEY || '',
} as const;

// ============================================
// External API Endpoints
// ============================================

export const EXTERNAL_APIS = {
  YAHOO_FINANCE: {
    BASE_URL: 'https://yahoo-finance15.p.rapidapi.com',
    HOST: 'yahoo-finance15.p.rapidapi.com',
  },
  ALPHA_VANTAGE: {
    BASE_URL: 'https://www.alphavantage.co/query',
  },
  FMP: {
    BASE_URL: 'https://financialmodelingprep.com/api/v3',
  },
  CLEARBIT_LOGO: {
    BASE_URL: 'https://logo.clearbit.com',
  },
} as const;

// ============================================
// Popular Stocks for Seeding
// ============================================

export const POPULAR_STOCKS = [
  // Tech Giants
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
  { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical' },
  
  // Financial
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
  { ticker: 'BAC', name: 'Bank of America Corp', sector: 'Financial Services' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Financial Services' },
  { ticker: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financial Services' },
  
  // Healthcare
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { ticker: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
  { ticker: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
  
  // Consumer
  { ticker: 'KO', name: 'Coca-Cola Company', sector: 'Consumer Defensive' },
  { ticker: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Defensive' },
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Defensive' },
  { ticker: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Cyclical' },
  { ticker: 'MCD', name: 'McDonald\'s Corp', sector: 'Consumer Cyclical' },
  { ticker: 'NKE', name: 'Nike Inc.', sector: 'Consumer Cyclical' },
  { ticker: 'DIS', name: 'Walt Disney Company', sector: 'Communication Services' },
  
  // Energy
  { ticker: 'XOM', name: 'Exxon Mobil Corp', sector: 'Energy' },
  { ticker: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  
  // Industrial
  { ticker: 'BA', name: 'Boeing Company', sector: 'Industrial' },
  { ticker: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrial' },
] as const;

// ============================================
// Dividend Frequencies
// ============================================

export const DIVIDEND_FREQUENCIES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  SEMI_ANNUAL: 'semi-annual',
  ANNUAL: 'annual',
} as const;

// ============================================
// Feature Flags
// ============================================

export const FEATURES = {
  REAL_TIME_QUOTES: process.env.ENABLE_REAL_TIME_QUOTES !== 'false',
  DIVIDEND_TRACKING: process.env.ENABLE_DIVIDEND_TRACKING !== 'false',
  STOCK_SCREENER: process.env.ENABLE_STOCK_SCREENER !== 'false',
  DARK_MODE: false, // Future feature
  EXPORT_DATA: false, // Future feature
  ADVANCED_CHARTS: false, // Future feature
} as const;