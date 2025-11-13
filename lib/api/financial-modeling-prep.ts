/**
 * lib/api/financial-modeling-prep.ts
 * Financial Modeling Prep API client for real financial data
 */

import axios from 'axios';
import { StockQuote, CompanyInfo, DividendInfo, PriceHistory } from '@/types';
import { API_KEYS, EXTERNAL_APIS } from '@/lib/constants';
import cache from '@/lib/cache';

/**
 * Financial Modeling Prep API client class
 * Uses real API calls with your API key
 */
class FinancialModelingPrepClient {
  private baseUrl: string;
  private apiKey: string;
  
  constructor() {
    this.baseUrl = EXTERNAL_APIS.FMP.BASE_URL;
    this.apiKey = API_KEYS.FMP;
  }
  
  /**
   * Fetch real-time stock quote from FMP
   */
  async getQuote(ticker: string): Promise<StockQuote> {
    const cacheKey = `quote:${ticker}`;
    
    // Try cache first
    const cached = await cache.get<StockQuote>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/quote/${ticker.toUpperCase()}`, {
        params: {
          apikey: this.apiKey,
        },
      });
      
      const data = response.data[0];
      if (!data) {
        throw new Error('Invalid ticker or no data available');
      }
      
      const quote: StockQuote = {
        ticker: data.symbol,
        name: data.name,
        price: data.price,
        change: data.change,
        changePercent: data.changesPercentage / 100,
        dayHigh: data.dayHigh,
        dayLow: data.dayLow,
        open: data.open,
        previousClose: data.previousClose,
        volume: data.volume,
        timestamp: new Date(),
      };
      
      // Cache for 5 minutes
      await cache.set(cacheKey, quote, 300);
      
      return quote;
    } catch (error) {
      console.error('FMP API error:', error);
      throw error;
    }
  }
  
  /**
   * Fetch company profile from FMP
   */
  async getCompanyInfo(ticker: string): Promise<CompanyInfo> {
    const cacheKey = `company:${ticker}`;
    
    const cached = await cache.get<CompanyInfo>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/profile/${ticker.toUpperCase()}`, {
        params: {
          apikey: this.apiKey,
        },
      });
      
      const data = response.data[0];
      if (!data) {
        throw new Error('Company info not found');
      }
      
      const info: CompanyInfo = {
        ticker: data.symbol,
        name: data.companyName,
        sector: data.sector,
        industry: data.industry,
        description: data.description,
        website: data.website,
        employees: data.fullTimeEmployees,
        headquarters: `${data.address}, ${data.city}, ${data.state} ${data.zip}, ${data.country}`,
        founded: data.ipoDate,
      };
      
      // Cache for 24 hours
      await cache.set(cacheKey, info, 86400);
      
      return info;
    } catch (error) {
      console.error('FMP company info error:', error);
      throw error;
    }
  }
  
  /**
   * Fetch dividend calendar from FMP
   */
  async getDividends(ticker: string): Promise<DividendInfo[]> {
    const cacheKey = `dividends:${ticker}`;
    
    const cached = await cache.get<DividendInfo[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/dividend_calendar`, {
        params: {
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
          to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ahead
          apikey: this.apiKey,
        },
      });
      
      const data = response.data;
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      const dividends: DividendInfo[] = data
        .filter((item: any) => item.symbol === ticker.toUpperCase())
        .map((item: any) => ({
          ticker: item.symbol,
          exDate: new Date(item.date).toISOString(),
          payDate: new Date(item.paymentDate).toISOString(),
          amount: item.dividend,
          frequency: item.frequency || 'quarterly',
        }))
        .sort((a, b) => new Date(a.exDate).getTime() - new Date(b.exDate).getTime());
      
      // Cache for 1 hour
      await cache.set(cacheKey, dividends, 3600);
      
      return dividends;
    } catch (error) {
      console.error('FMP dividends error:', error);
      return [];
    }
  }
  
  /**
   * Fetch historical data from FMP
   */
  async getHistoricalData(ticker: string, period: string = '1y'): Promise<PriceHistory[]> {
    const cacheKey = `history:${ticker}:${period}`;
    
    const cached = await cache.get<PriceHistory[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/historical-price-full/${ticker.toUpperCase()}`, {
        params: {
          apikey: this.apiKey,
        },
      });
      
      const data = response.data.historical;
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      const history: PriceHistory[] = data
        .map((item: any) => ({
          date: new Date(item.date),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          adjustedClose: item.adjClose,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Cache for 15 minutes
      await cache.set(cacheKey, history, 900);
      
      return history;
    } catch (error) {
      console.error('FMP historical data error:', error);
      return [];
    }
  }
  
  /**
   * Search for stocks by symbol or name
   */
  async searchTicker(query: string): Promise<Array<{ ticker: string; name: string; exchange: string }>> {
    const cacheKey = `search:${query}`;
    
    const cached = await cache.get<Array<{ ticker: string; name: string; exchange: string }>>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          query: query,
          limit: 10,
          apikey: this.apiKey,
        },
      });
      
      const data = response.data;
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      const results = data.map((item: any) => ({
        ticker: item.symbol,
        name: item.name,
        exchange: item.exchangeShortName,
      }));
      
      // Cache for 1 hour
      await cache.set(cacheKey, results, 3600);
      
      return results;
    } catch (error) {
      console.error('FMP search error:', error);
      return [];
    }
  }
}

// Create and export singleton instance
const fmpClient = new FinancialModelingPrepClient();
export default fmpClient;
