// Yahoo Finance API integration - to be created in Phase 2
/**
 * lib/api/yahoo-finance.ts
 * Yahoo Finance API client for fetching stock data
 * Includes mock data fallback for development
 */

import axios from 'axios';
import cache from '@/lib/cache';
import { 
  CACHE_DURATIONS, 
  EXTERNAL_APIS, 
  API_KEYS,
  POPULAR_STOCKS 
} from '@/lib/constants';
import { 
  StockQuote, 
  CompanyInfo, 
  DividendInfo, 
  PriceHistory 
} from '@/types';

/**
 * Yahoo Finance API client class
 * Handles all interactions with Yahoo Finance API
 */
class YahooFinanceClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private useMockData: boolean;
  
  constructor() {
    this.baseUrl = EXTERNAL_APIS.YAHOO_FINANCE.BASE_URL;
    this.headers = {
      'X-RapidAPI-Key': API_KEYS.YAHOO_FINANCE,
      'X-RapidAPI-Host': EXTERNAL_APIS.YAHOO_FINANCE.HOST,
    };
    // Use mock data if no API key is configured
    this.useMockData = !API_KEYS.YAHOO_FINANCE;
  }
  
  /**
   * Fetch real-time stock quote
   * @param ticker - Stock ticker symbol
   * @returns Stock quote data
   */
  async getQuote(ticker: string): Promise<StockQuote> {
    const cacheKey = `quote:${ticker}`;
    
    // Try to get from cache first
    const cached = await cache.get<StockQuote>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Use mock data in development or if no API key
    if (this.useMockData) {
      const mockQuote = this.generateMockQuote(ticker);
      await cache.set(cacheKey, mockQuote, CACHE_DURATIONS.QUOTES);
      return mockQuote;
    }
    
    try {
      // Make real API call
      const response = await axios.get(`${this.baseUrl}/api/v1/markets/quote`, {
        headers: this.headers,
        params: {
          ticker: ticker.toUpperCase(),
          type: 'STOCKS',
        },
      });
      
      const data = response.data?.body;
      if (!data) {
        throw new Error('Invalid response from Yahoo Finance');
      }
      
      const quote: StockQuote = {
        ticker: data.symbol,
        name: data.longName || data.shortName || ticker,
        price: data.regularMarketPrice,
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
        dayHigh: data.regularMarketDayHigh,
        dayLow: data.regularMarketDayLow,
        open: data.regularMarketOpen,
        previousClose: data.regularMarketPreviousClose,
        volume: data.regularMarketVolume,
        marketCap: data.marketCap,
        peRatio: data.trailingPE,
        dividendYield: data.dividendYield,
        week52High: data.fiftyTwoWeekHigh,
        week52Low: data.fiftyTwoWeekLow,
        timestamp: new Date(),
      };
      
      // Cache the result
      await cache.set(cacheKey, quote, CACHE_DURATIONS.QUOTES);
      
      return quote;
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      // Fallback to mock data on error
      const mockQuote = this.generateMockQuote(ticker);
      await cache.set(cacheKey, mockQuote, CACHE_DURATIONS.QUOTES);
      return mockQuote;
    }
  }
  
  /**
   * Fetch multiple stock quotes in parallel
   * @param tickers - Array of stock tickers
   * @returns Array of stock quotes
   */
  async getQuotes(tickers: string[]): Promise<StockQuote[]> {
    const promises = tickers.map((ticker) => this.getQuote(ticker));
    return Promise.all(promises);
  }
  
  /**
   * Fetch company information
   * @param ticker - Stock ticker symbol
   * @returns Company information
   */
  async getCompanyInfo(ticker: string): Promise<CompanyInfo> {
    const cacheKey = `company:${ticker}`;
    
    const cached = await cache.get<CompanyInfo>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Use mock data in development
    if (this.useMockData) {
      const mockInfo = this.generateMockCompanyInfo(ticker);
      await cache.set(cacheKey, mockInfo, CACHE_DURATIONS.COMPANY_INFO);
      return mockInfo;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/markets/stock/profile`, {
        headers: this.headers,
        params: {
          ticker: ticker.toUpperCase(),
        },
      });
      
      const data = response.data?.body;
      if (!data) {
        throw new Error('Invalid response from Yahoo Finance');
      }
      
      const info: CompanyInfo = {
        ticker: data.symbol,
        name: data.longName || data.shortName,
        sector: data.sector,
        industry: data.industry,
        description: data.longBusinessSummary,
        website: data.website,
        logo: `https://logo.clearbit.com/${data.website?.replace(/https?:\/\//, '')}`,
        employees: data.fullTimeEmployees,
        headquarters: `${data.city}, ${data.state}, ${data.country}`,
        founded: data.founded,
      };
      
      await cache.set(cacheKey, info, CACHE_DURATIONS.COMPANY_INFO);
      
      return info;
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      const mockInfo = this.generateMockCompanyInfo(ticker);
      await cache.set(cacheKey, mockInfo, CACHE_DURATIONS.COMPANY_INFO);
      return mockInfo;
    }
  }
  
  /**
   * Fetch dividend information
   * @param ticker - Stock ticker symbol
   * @returns Dividend information
   */
  async getDividends(ticker: string): Promise<DividendInfo[]> {
    const cacheKey = `dividends:${ticker}`;
    
    const cached = await cache.get<DividendInfo[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Use mock data in development
    if (this.useMockData) {
      const mockDividends = this.generateMockDividends(ticker);
      await cache.set(cacheKey, mockDividends, CACHE_DURATIONS.DIVIDENDS);
      return mockDividends;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/markets/stock/dividends`, {
        headers: this.headers,
        params: {
          ticker: ticker.toUpperCase(),
          start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
      
      const data = response.data?.body;
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      const dividends: DividendInfo[] = data.map((div: any) => ({
        ticker,
        exDate: new Date(div.exDividendDate).toISOString(),
        payDate: new Date(div.paymentDate).toISOString(),
        amount: div.amount,
        frequency: this.determineDividendFrequency(data) as 'quarterly' | 'monthly' | 'annual' | 'semi-annual',
        yield: div.yield,
      }));
      
      await cache.set(cacheKey, dividends, CACHE_DURATIONS.DIVIDENDS);
      
      return dividends;
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      const mockDividends = this.generateMockDividends(ticker);
      await cache.set(cacheKey, mockDividends, CACHE_DURATIONS.DIVIDENDS);
      return mockDividends;
    }
  }
  
  /**
   * Fetch historical price data
   * @param ticker - Stock ticker symbol
   * @param period - Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 5y)
   * @returns Historical price data
   */
  async getHistoricalData(
    ticker: string, 
    period: string = '1y'
  ): Promise<PriceHistory[]> {
    const cacheKey = `history:${ticker}:${period}`;
    
    const cached = await cache.get<PriceHistory[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Use mock data in development
    if (this.useMockData) {
      const mockHistory = this.generateMockHistoricalData(ticker, period);
      await cache.set(cacheKey, mockHistory, CACHE_DURATIONS.HISTORICAL);
      return mockHistory;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/markets/stock/history`, {
        headers: this.headers,
        params: {
          ticker: ticker.toUpperCase(),
          period,
          interval: this.getIntervalForPeriod(period),
        },
      });
      
      const data = response.data?.body;
      if (!data || !data.history) {
        return [];
      }
      
      const history: PriceHistory[] = data.history.map((item: any) => ({
        date: new Date(item.date),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        adjustedClose: item.adjClose,
      }));
      
      await cache.set(cacheKey, history, CACHE_DURATIONS.HISTORICAL);
      
      return history;
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      const mockHistory = this.generateMockHistoricalData(ticker, period);
      await cache.set(cacheKey, mockHistory, CACHE_DURATIONS.HISTORICAL);
      return mockHistory;
    }
  }
  
  /**
   * Search for stocks by query
   * @param query - Search query
   * @returns Array of search results
   */
  async searchTicker(query: string): Promise<Array<{ ticker: string; name: string }>> {
    if (this.useMockData) {
      return this.mockSearchTicker(query);
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/markets/search`, {
        headers: this.headers,
        params: {
          query,
          type: 'STOCKS',
        },
      });
      
      const data = response.data?.body;
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      return data.slice(0, 10).map((item: any) => ({
        ticker: item.symbol,
        name: item.longName || item.shortName,
      }));
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      return this.mockSearchTicker(query);
    }
  }
  
  // ============================================
  // Helper Methods
  // ============================================
  
  /**
   * Determine dividend frequency from dividend history
   */
  private determineDividendFrequency(dividends: any[]): string {
    if (!dividends || dividends.length < 2) {
      return 'quarterly';
    }
    
    const sortedDates = dividends
      .map((d: any) => new Date(d.exDividendDate).getTime())
      .sort((a: number, b: number) => a - b);
    
    const gaps = [];
    for (let i = 1; i < sortedDates.length; i++) {
      const curr = sortedDates[i] ?? 0;
      const prev = sortedDates[i - 1] ?? 0;
      gaps.push(curr - prev);
    }
    
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const daysGap = avgGap / (1000 * 60 * 60 * 24);
    
    if (daysGap < 35) return 'monthly';
    if (daysGap < 100) return 'quarterly';
    if (daysGap < 200) return 'semi-annual';
    return 'annual';
  }
  
  /**
   * Get appropriate interval for historical data period
   */
  private getIntervalForPeriod(period: string): string {
    switch (period) {
      case '1d':
      case '5d':
        return '5m';
      case '1mo':
        return '1h';
      case '3mo':
      case '6mo':
        return '1d';
      case '1y':
      case '5y':
      default:
        return '1wk';
    }
  }
  
  // ============================================
  // Mock Data Generation (for development)
  // ============================================
  
  /**
   * Generate mock stock quote for development
   */
  private generateMockQuote(ticker: string): StockQuote {
    const basePrice = 100 + Math.random() * 400;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;
    
    const stock = POPULAR_STOCKS.find(s => s.ticker === ticker.toUpperCase());
    
    return {
      ticker: ticker.toUpperCase(),
      name: stock?.name || `${ticker.toUpperCase()} Corporation`,
      price: Number(basePrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      dayHigh: Number((basePrice + Math.random() * 5).toFixed(2)),
      dayLow: Number((basePrice - Math.random() * 5).toFixed(2)),
      open: Number((basePrice + (Math.random() - 0.5) * 3).toFixed(2)),
      previousClose: Number((basePrice - change).toFixed(2)),
      volume: Math.floor(Math.random() * 50000000),
      marketCap: Math.floor(basePrice * 1000000000 * (Math.random() * 10 + 1)),
      peRatio: Number((15 + Math.random() * 20).toFixed(2)),
      dividendYield: Number((Math.random() * 4).toFixed(2)),
      week52High: Number((basePrice * 1.3).toFixed(2)),
      week52Low: Number((basePrice * 0.7).toFixed(2)),
      timestamp: new Date(),
    };
  }
  
  /**
   * Generate mock company info for development
   */
  private generateMockCompanyInfo(ticker: string): CompanyInfo {
    const stock = POPULAR_STOCKS.find(s => s.ticker === ticker.toUpperCase());
    
    return {
      ticker: ticker.toUpperCase(),
      name: stock?.name || `${ticker.toUpperCase()} Corporation`,
      sector: stock?.sector || 'Technology',
      industry: 'Software',
      description: `${stock?.name || ticker} is a leading company in its sector, providing innovative solutions and services to customers worldwide.`,
      website: `https://www.${ticker.toLowerCase()}.com`,
      logo: `https://logo.clearbit.com/${ticker.toLowerCase()}.com`,
      employees: Math.floor(Math.random() * 100000) + 1000,
      headquarters: 'San Francisco, CA, USA',
      founded: String(1980 + Math.floor(Math.random() * 40)),
    };
  }
  
  /**
   * Generate mock dividend data for development
   */
  private generateMockDividends(ticker: string): DividendInfo[] {
    const dividends: DividendInfo[] = [];
    const now = new Date();
    
    // Generate quarterly dividends for the next year
    for (let i = 0; i < 4; i++) {
      const exDate = new Date(now);
      exDate.setMonth(now.getMonth() + i * 3);
      
      const payDate = new Date(exDate);
      payDate.setDate(payDate.getDate() + 14);

      dividends.push({
        ticker: ticker.toUpperCase(),
        exDate: exDate.toISOString(),
        payDate: payDate.toISOString(),
        amount: Number((0.5 + Math.random() * 1.5).toFixed(2)),
        frequency: 'quarterly',
        yield: Number((1 + Math.random() * 3).toFixed(2)),
      });
    }
    
    return dividends;
  }
  
  /**
   * Generate mock historical data for development
   */
  private generateMockHistoricalData(_ticker: string, period: string): PriceHistory[] {
    const history: PriceHistory[] = [];
    const now = new Date();
    let days = 365;
    
    switch (period) {
      case '1d': days = 1; break;
      case '5d': days = 5; break;
      case '1mo': days = 30; break;
      case '3mo': days = 90; break;
      case '6mo': days = 180; break;
      case '1y': days = 365; break;
      case '5y': days = 1825; break;
    }
    
    let basePrice = 100 + Math.random() * 200;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Random walk
      basePrice += (Math.random() - 0.48) * 5;
      basePrice = Math.max(10, basePrice);
      
      const open = basePrice + (Math.random() - 0.5) * 2;
      const close = open + (Math.random() - 0.5) * 3;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      
      history.push({
        date,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 50000000),
        adjustedClose: Number(close.toFixed(2)),
      });
    }
    
    return history;
  }
  
  /**
   * Mock search ticker for development
   */
  private mockSearchTicker(query: string): Array<{ ticker: string; name: string }> {
    const results = POPULAR_STOCKS
      .filter(stock =>
        stock.ticker.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10)
      .map(stock => ({
        ticker: stock.ticker as string,
        name: stock.name as string,
      }));

    if (results.length === 0 && query.length >= 1 && query.length <= 5) {
      // Return a generic result if no matches
      results.push({
        ticker: query.toUpperCase() as string,
        name: `${query.toUpperCase()} Corporation` as string,
      });
    }
    
    return results;
  }
}

// Create and export singleton instance
const yahooFinanceClient = new YahooFinanceClient();
export default yahooFinanceClient;