// Utility functions - already provided
/**
 * lib/utils.ts
 * Utility functions and helpers for STOCKLIO
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with tailwind-merge to avoid conflicts
 * Essential for Shadcn/ui components
 * @param inputs - Class names to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency (USD)
 * @param value - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Formats a number as a percentage
 * @param value - Number to format (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formats a large number with abbreviation (K, M, B, T)
 * @param value - Number to format
 * @returns Formatted string with abbreviation
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return formatCurrency(value);
}

/**
 * Calculates profit/loss and return percentage
 * @param currentPrice - Current stock price
 * @param avgPrice - Average purchase price
 * @param shares - Number of shares
 * @returns Object with calculated values
 */
export function calculateProfitLoss(
  currentPrice: number,
  avgPrice: number,
  shares: number,
) {
  const currentValue = currentPrice * shares;
  const totalCost = avgPrice * shares;
  const profitLoss = currentValue - totalCost;
  const returnPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  return {
    currentValue: Math.round(currentValue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    profitLoss: Math.round(profitLoss * 100) / 100,
    returnPercent: Math.round(returnPercent * 100) / 100,
  };
}

/**
 * Determines color class based on value (positive/negative)
 * @param value - Number to check
 * @param type - Type of color to return
 * @returns Tailwind class name
 */
export function getValueColorClass(
  value: number,
  type: 'text' | 'bg' = 'text',
): string {
  if (value > 0) {
    return type === 'text' ? 'text-green-600' : 'bg-green-50';
  }
  if (value < 0) {
    return type === 'text' ? 'text-red-500' : 'bg-red-50';
  }
  return type === 'text' ? 'text-slate-600' : 'bg-slate-50';
}

/**
 * Formats a date to a readable string
 * @param date - Date to format
 * @param format - Format type
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'relative' = 'short',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'relative') {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    }
    if (days === 1) {
      return 'Yesterday';
    }
    if (days < 7) {
      return `${days} days ago`;
    }
    if (days < 30) {
      return `${Math.floor(days / 7)} weeks ago`;
    }
    if (days < 365) {
      return `${Math.floor(days / 30)} months ago`;
    }
    return `${Math.floor(days / 365)} years ago`;
  }

  const options: Intl.DateTimeFormatOptions =
    format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' };

  return d.toLocaleDateString('en-US', options);
}

/**
 * Debounce function to limit API calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Sleep/delay function for testing loading states
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validates if a stock ticker is in correct format
 * @param ticker - Stock ticker to validate
 * @returns Boolean indicating if valid
 */
export function isValidTicker(ticker: string): boolean {
  // Ticker should be 1-5 uppercase letters, optionally followed by a dot and more letters
  const tickerRegex = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;
  return tickerRegex.test(ticker.toUpperCase());
}

/**
 * Generates a random ID for testing/development
 * @param length - Length of ID to generate
 * @returns Random string ID
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Safely parses JSON with error handling
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T = any>(json: string, fallback: T | null = null): T | null {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}


/**
 * Groups an array of objects by a key
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Grouped object
 */
export function groupBy<T extends Record<string, any>>(
  array: T[],
  key: keyof T,
): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Calculates the sum of an array of numbers
 * @param array - Array of objects
 * @param key - Key to sum
 * @returns Sum of values
 */
export function sumBy<T extends Record<string, any>>(
  array: T[],
  key: keyof T,
): number {
  return array.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
}