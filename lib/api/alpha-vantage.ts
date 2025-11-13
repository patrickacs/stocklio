/**
 * lib/api/alpha-vantage.ts
 * Alpha Vantage API client for real financial data
 */

import axios from 'axios';
import { StockQuote, CompanyInfo, DividendInfo, PriceHistory } from '@/types';
import { API_KEYS, EXTERNAL_APIS } from '@/lib/constants';
import cache from '@/lib/cache';

/**
 * Alpha Vantage API client class
 * Uses real API calls with your API key
 */
class AlphaVantageClient {
  private baseUrl: string;
  private apiKey: string;
  
  constructor() {
    this.baseUrl = EXTERNAL_APIS.ALPHA_VANTAGE.BASE_URL;
    this.apiKey = API_KEYS.ALPHA_VANTAGE;
  }
  
  /**
   * Fetch real-time stock quote from Alpha Vantage
   */
  async getQuote(ticker: string): Promise<StockQuote> {
    const cacheKey = `quote:${ticker}`;
    
    // Try cache first
    const cached = await cache.get<StockQuote>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: ticker.toUpperCase(),
          apikey: this.apiKey,
        },
      });
      
      const data = response.data['Global Quote'];
      if (!data || data['01. symbol'] === '') {
        throw new Error('Invalid ticker or no data available');
      }
      
      const quote: StockQuote = {
        ticker: data['01. symbol'],
        name: `${ticker.toUpperCase()} Corporation`, // Alpha Vantage doesn't provide company name in quote
        price: parseFloat(data['05. price']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent'].replace('%', '')) / 100,
        dayHigh: parseFloat(data['03. high']),
        dayLow: parseFloat(data['04. low']),
        open: parseFloat(data['02. open']),
        previousClose: parseFloat(data['08. previous close']),
        volume: parseInt(data['06. volume']),
        timestamp: new Date(),
      };
      
      // Cache for 5 minutes
      await cache.set(cacheKey, quote, 300);
      
      return quote;
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      throw error;
    }
  }
  
  /**
   * Fetch company overview from Alpha Vantage
   */
  async getCompanyInfo(ticker: string): Promise<CompanyInfo> {
    const cacheKey = `company:${ticker}`;
    
    const cached = await cache.get<CompanyInfo>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'OVERVIEW',
          symbol: ticker.toUpperCase(),
          apikey: this.apiKey,
        },
      });
      
      const data = response.data;
      if (!data || data.Symbol === '') {
        throw new Error('Company info not found');
      }
      
      const info: CompanyInfo = {
        ticker: data.Symbol,
        name: data.Name,
        sector: data.Sector,
        industry: data.Industry,
        description: data.Description,
        website: data.Website,
        employees: parseInt(data.FullTimeEmployees) || undefined,
        headquarters: `${data.Address}, ${data.Country}`,
        founded: data.Founded,
      };
      
      // Cache for 24 hours
      await cache.set(cacheKey, info, 86400);
      
      return info;
    } catch (error) {
      console.error('Alpha Vantage company info error:', error);
      throw error;
    }
  }
  
  /**
   * Fetch dividend data from Alpha Vantage
   */
  async getDividends(ticker: string): Promise<DividendInfo[]> {
    const cacheKey = `dividends:${ticker}`;
    
    const cached = await cache.get<DividendInfo[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_MONTHLY_ADJUSTED',
          symbol: ticker.toUpperCase(),
          apikey: this.apiKey,
        },
      });
      
      const data = response.data['Monthly Adjusted Time Series'];
      if (!data) {
        return [];
      }
      
      const dividends: DividendInfo[] = [];
      const dates = Object.keys(data).sort().reverse().slice(0, 12); // Last 12 months
      
      for (const date of dates) {
        const monthlyData = data[date];
        const dividendAmount = parseFloat(monthlyData['7. dividend amount']);
        
        if (dividendAmount > 0) {
          const exDate = new Date(date);
          const payDate = new Date(exDate);
          payDate.setDate(payDate.getDate() + 14); // Assume 14 days between ex-date and pay-date

          dividends.push({
            ticker: ticker.toUpperCase(),
            exDate: exDate.toISOString(),
            payDate: payDate.toISOString(),
            amount: dividendAmount,
            frequency: 'monthly', // Alpha Vantage provides monthly data
          });
        }
      }
      
      // Cache for 1 hour
      await cache.set(cacheKey, dividends, 3600);
      
      return dividends;
    } catch (error) {
      console.error('Alpha Vantage dividends error:', error);
      return [];
    }
  }
  
  /**
   * Fetch historical data from Alpha Vantage
   */
  async getHistoricalData(ticker: string, period: string = '1y'): Promise<PriceHistory[]> {
    const cacheKey = `history:${ticker}:${period}`;
    
    const cached = await cache.get<PriceHistory[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: ticker.toUpperCase(),
          outputsize: 'compact',
          apikey: this.apiKey,
        },
      });
      
      const data = response.data['Time Series (Daily)'];
      if (!data) {
        return [];
      }
      
      const history: PriceHistory[] = Object.entries(data)
        .map(([date, values]: [string, any]) => ({
          date: new Date(date),
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
          adjustedClose: parseFloat(values['5. adjusted close']),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Cache for 15 minutes
      await cache.set(cacheKey, history, 900);
      
      return history;
    } catch (error) {
      console.error('Alpha Vantage historical data error:', error);
      return [];
    }
  }
}

// Create and export singleton instance
const alphaVantageClient = new AlphaVantageClient();
export default alphaVantageClient;