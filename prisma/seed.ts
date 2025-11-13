// Database seed file - to be created in Phase 2
/**
 * prisma/seed.ts
 * Database seeding script to populate stocks for screener
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import { POPULAR_STOCKS } from '../lib/constants';

const prisma = new PrismaClient();

/**
 * S&P 500 stocks sample (top 100 by market cap)
 * In production, you'd fetch this from an API
 */
const SP500_STOCKS = [
  // Technology
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software' },
  { ticker: 'GOOGL', name: 'Alphabet Inc. Class A', sector: 'Technology', industry: 'Internet Services' },
  { ticker: 'GOOG', name: 'Alphabet Inc. Class C', sector: 'Technology', industry: 'Internet Services' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', industry: 'Semiconductors' },
  { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', industry: 'Social Media' },
  { ticker: 'TSM', name: 'Taiwan Semiconductor', sector: 'Technology', industry: 'Semiconductors' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', industry: 'Semiconductors' },
  { ticker: 'ORCL', name: 'Oracle Corporation', sector: 'Technology', industry: 'Software' },
  { ticker: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', industry: 'Software' },
  { ticker: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', industry: 'Software' },
  { ticker: 'CSCO', name: 'Cisco Systems Inc.', sector: 'Technology', industry: 'Networking' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', industry: 'Semiconductors' },
  { ticker: 'INTC', name: 'Intel Corporation', sector: 'Technology', industry: 'Semiconductors' },
  { ticker: 'IBM', name: 'IBM Corporation', sector: 'Technology', industry: 'IT Services' },
  { ticker: 'QCOM', name: 'Qualcomm Inc.', sector: 'Technology', industry: 'Semiconductors' },
  { ticker: 'TXN', name: 'Texas Instruments', sector: 'Technology', industry: 'Semiconductors' },
  
  // Consumer Cyclical
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', industry: 'E-Commerce' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers' },
  { ticker: 'HD', name: 'The Home Depot Inc.', sector: 'Consumer Cyclical', industry: 'Home Improvement' },
  { ticker: 'MCD', name: "McDonald's Corporation", sector: 'Consumer Cyclical', industry: 'Restaurants' },
  { ticker: 'NKE', name: 'Nike Inc.', sector: 'Consumer Cyclical', industry: 'Footwear & Accessories' },
  { ticker: 'LOW', name: "Lowe's Companies Inc.", sector: 'Consumer Cyclical', industry: 'Home Improvement' },
  { ticker: 'SBUX', name: 'Starbucks Corporation', sector: 'Consumer Cyclical', industry: 'Restaurants' },
  { ticker: 'TGT', name: 'Target Corporation', sector: 'Consumer Cyclical', industry: 'Department Stores' },
  { ticker: 'BKNG', name: 'Booking Holdings Inc.', sector: 'Consumer Cyclical', industry: 'Travel Services' },
  
  // Financial Services
  { ticker: 'BRK.B', name: 'Berkshire Hathaway Class B', sector: 'Financial Services', industry: 'Insurance' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', industry: 'Banks' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Financial Services', industry: 'Payment Processing' },
  { ticker: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services', industry: 'Payment Processing' },
  { ticker: 'BAC', name: 'Bank of America Corp', sector: 'Financial Services', industry: 'Banks' },
  { ticker: 'WFC', name: 'Wells Fargo & Company', sector: 'Financial Services', industry: 'Banks' },
  { ticker: 'GS', name: 'Goldman Sachs Group', sector: 'Financial Services', industry: 'Investment Banking' },
  { ticker: 'MS', name: 'Morgan Stanley', sector: 'Financial Services', industry: 'Investment Banking' },
  { ticker: 'AXP', name: 'American Express', sector: 'Financial Services', industry: 'Credit Services' },
  { ticker: 'BLK', name: 'BlackRock Inc.', sector: 'Financial Services', industry: 'Asset Management' },
  { ticker: 'C', name: 'Citigroup Inc.', sector: 'Financial Services', industry: 'Banks' },
  { ticker: 'SCHW', name: 'Charles Schwab Corp', sector: 'Financial Services', industry: 'Investment Services' },
  
  // Healthcare
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', industry: 'Health Insurance' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { ticker: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { ticker: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { ticker: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { ticker: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { ticker: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare', industry: 'Medical Devices' },
  { ticker: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare', industry: 'Medical Devices' },
  { ticker: 'CVS', name: 'CVS Health Corporation', sector: 'Healthcare', industry: 'Healthcare Plans' },
  { ticker: 'DHR', name: 'Danaher Corporation', sector: 'Healthcare', industry: 'Medical Devices' },
  { ticker: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare', industry: 'Biotechnology' },
  { ticker: 'MDT', name: 'Medtronic plc', sector: 'Healthcare', industry: 'Medical Devices' },
  
  // Consumer Defensive
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Defensive', industry: 'Discount Stores' },
  { ticker: 'PG', name: 'Procter & Gamble', sector: 'Consumer Defensive', industry: 'Household Products' },
  { ticker: 'KO', name: 'Coca-Cola Company', sector: 'Consumer Defensive', industry: 'Beverages' },
  { ticker: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Defensive', industry: 'Beverages' },
  { ticker: 'COST', name: 'Costco Wholesale', sector: 'Consumer Defensive', industry: 'Discount Stores' },
  { ticker: 'PM', name: 'Philip Morris International', sector: 'Consumer Defensive', industry: 'Tobacco' },
  { ticker: 'MDLZ', name: 'Mondelez International', sector: 'Consumer Defensive', industry: 'Packaged Foods' },
  { ticker: 'CL', name: 'Colgate-Palmolive', sector: 'Consumer Defensive', industry: 'Household Products' },
  
  // Communication Services
  { ticker: 'DIS', name: 'Walt Disney Company', sector: 'Communication Services', industry: 'Entertainment' },
  { ticker: 'VZ', name: 'Verizon Communications', sector: 'Communication Services', industry: 'Telecom Services' },
  { ticker: 'CMCSA', name: 'Comcast Corporation', sector: 'Communication Services', industry: 'Telecom Services' },
  { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', industry: 'Entertainment' },
  { ticker: 'T', name: 'AT&T Inc.', sector: 'Communication Services', industry: 'Telecom Services' },
  { ticker: 'TMUS', name: 'T-Mobile US Inc.', sector: 'Communication Services', industry: 'Telecom Services' },
  { ticker: 'CHTR', name: 'Charter Communications', sector: 'Communication Services', industry: 'Telecom Services' },
  
  // Energy
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', industry: 'Oil & Gas' },
  { ticker: 'CVX', name: 'Chevron Corporation', sector: 'Energy', industry: 'Oil & Gas' },
  { ticker: 'COP', name: 'ConocoPhillips', sector: 'Energy', industry: 'Oil & Gas' },
  { ticker: 'SLB', name: 'Schlumberger Limited', sector: 'Energy', industry: 'Oil & Gas Equipment' },
  { ticker: 'EOG', name: 'EOG Resources Inc.', sector: 'Energy', industry: 'Oil & Gas' },
  { ticker: 'MPC', name: 'Marathon Petroleum', sector: 'Energy', industry: 'Oil & Gas Refining' },
  
  // Industrial
  { ticker: 'BA', name: 'Boeing Company', sector: 'Industrial', industry: 'Aerospace & Defense' },
  { ticker: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrial', industry: 'Farm & Construction' },
  { ticker: 'GE', name: 'General Electric', sector: 'Industrial', industry: 'Industrial Conglomerate' },
  { ticker: 'UNP', name: 'Union Pacific Corporation', sector: 'Industrial', industry: 'Railroads' },
  { ticker: 'HON', name: 'Honeywell International', sector: 'Industrial', industry: 'Industrial Conglomerate' },
  { ticker: 'UPS', name: 'United Parcel Service', sector: 'Industrial', industry: 'Integrated Shipping' },
  { ticker: 'RTX', name: 'RTX Corporation', sector: 'Industrial', industry: 'Aerospace & Defense' },
  { ticker: 'LMT', name: 'Lockheed Martin', sector: 'Industrial', industry: 'Aerospace & Defense' },
  { ticker: 'DE', name: 'Deere & Company', sector: 'Industrial', industry: 'Farm & Construction' },
  { ticker: 'MMM', name: '3M Company', sector: 'Industrial', industry: 'Industrial Conglomerate' },
  
  // Real Estate
  { ticker: 'AMT', name: 'American Tower Corp', sector: 'Real Estate', industry: 'REIT - Infrastructure' },
  { ticker: 'PLD', name: 'Prologis Inc.', sector: 'Real Estate', industry: 'REIT - Industrial' },
  { ticker: 'CCI', name: 'Crown Castle Inc.', sector: 'Real Estate', industry: 'REIT - Infrastructure' },
  { ticker: 'SPG', name: 'Simon Property Group', sector: 'Real Estate', industry: 'REIT - Retail' },
  
  // Materials
  { ticker: 'LIN', name: 'Linde plc', sector: 'Basic Materials', industry: 'Specialty Chemicals' },
  { ticker: 'APD', name: 'Air Products & Chemicals', sector: 'Basic Materials', industry: 'Specialty Chemicals' },
  { ticker: 'SHW', name: 'Sherwin-Williams', sector: 'Basic Materials', industry: 'Specialty Chemicals' },
  { ticker: 'FCX', name: 'Freeport-McMoRan', sector: 'Basic Materials', industry: 'Copper' },
  { ticker: 'NEM', name: 'Newmont Corporation', sector: 'Basic Materials', industry: 'Gold' },
  
  // Utilities
  { ticker: 'NEE', name: 'NextEra Energy Inc.', sector: 'Utilities', industry: 'Electric Utilities' },
  { ticker: 'SO', name: 'Southern Company', sector: 'Utilities', industry: 'Electric Utilities' },
  { ticker: 'DUK', name: 'Duke Energy Corporation', sector: 'Utilities', industry: 'Electric Utilities' },
  { ticker: 'D', name: 'Dominion Energy Inc.', sector: 'Utilities', industry: 'Electric Utilities' },
];

/**
 * Generate random but realistic stock data
 */
function generateStockData(stock: typeof SP500_STOCKS[0]) {
  // Base price based on sector
  const sectorBasePrices: Record<string, number> = {
    'Technology': 150,
    'Consumer Cyclical': 120,
    'Financial Services': 100,
    'Healthcare': 130,
    'Consumer Defensive': 80,
    'Communication Services': 90,
    'Energy': 70,
    'Industrial': 140,
    'Real Estate': 65,
    'Basic Materials': 110,
    'Utilities': 55,
  };
  
  const basePrice = sectorBasePrices[stock.sector] || 100;
  const price = basePrice + (Math.random() - 0.5) * basePrice;
  
  // Market cap based on well-known companies
  const isLargeCap = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'BRK.B', 'TSM'].includes(stock.ticker);
  const isMegaCap = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'].includes(stock.ticker);
  
  let marketCap = (10 + Math.random() * 90) * 1_000_000_000; // 10-100B default
  if (isMegaCap) {
    marketCap = (500 + Math.random() * 2000) * 1_000_000_000; // 500B-2.5T
  } else if (isLargeCap) {
    marketCap = (200 + Math.random() * 300) * 1_000_000_000; // 200-500B
  }
  
  // P/E ratio based on sector
  const sectorPERatios: Record<string, number> = {
    'Technology': 25,
    'Consumer Cyclical': 22,
    'Financial Services': 15,
    'Healthcare': 20,
    'Consumer Defensive': 18,
    'Communication Services': 19,
    'Energy': 12,
    'Industrial': 20,
    'Real Estate': 25,
    'Basic Materials': 17,
    'Utilities': 16,
  };
  
  const basePE = sectorPERatios[stock.sector] || 20;
  const peRatio = Math.max(5, basePE + (Math.random() - 0.5) * 15);
  
  // Dividend yield (some sectors pay more dividends)
  const highDividendSectors = ['Utilities', 'Consumer Defensive', 'Real Estate', 'Energy', 'Financial Services'];
  const baseDividendYield = highDividendSectors.includes(stock.sector) ? 0.03 : 0.015;
  const dividendYield = Math.random() > 0.3 ? baseDividendYield + Math.random() * 0.02 : 0;
  
  // 52-week range
  const week52Low = price * (0.7 + Math.random() * 0.2);
  const week52High = price * (1.1 + Math.random() * 0.3);
  
  // Generate day change data
  const dayChangePercent = (Math.random() - 0.5) * 10; // -5% to +5%
  const dayChange = price * (dayChangePercent / 100);
  const volume = Math.floor(Math.random() * 10000000) + 100000; // 100K to 10M

  return {
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    industry: stock.industry,
    currentPrice: Number(price.toFixed(2)),
    peRatio: Number(peRatio.toFixed(2)),
    dividendYield: Number(dividendYield.toFixed(4)),
    marketCap: Math.floor(marketCap),
    week52High: Number(week52High.toFixed(2)),
    week52Low: Number(week52Low.toFixed(2)),
    dayChange: Number(dayChange.toFixed(2)),
    dayChangePercent: Number(dayChangePercent.toFixed(2)),
    volume: volume,
  };
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Clear existing stocks
    console.log('🗑️  Clearing existing stocks...');
    await prisma.stock.deleteMany();
    
    // Generate stock data
    const stockData = SP500_STOCKS.map(generateStockData);
    
    // Insert stocks in batches
    console.log(`📊 Inserting ${stockData.length} stocks...`);
    const batchSize = 50;
    
    for (let i = 0; i < stockData.length; i += batchSize) {
      const batch = stockData.slice(i, i + batchSize);
      await prisma.stock.createMany({
        data: batch,
        skipDuplicates: true,
      });
      console.log(`   Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(stockData.length / batchSize)}`);
    }
    
    // Verify insertion
    const count = await prisma.stock.count();
    console.log(`✅ Successfully seeded ${count} stocks!`);
    
    // Show sample stocks
    const samples = await prisma.stock.findMany({
      take: 5,
      orderBy: { marketCap: 'desc' },
    });
    
    console.log('\n📈 Sample stocks (top 5 by market cap):');
    samples.forEach(stock => {
      console.log(`   ${stock.ticker}: ${stock.name} - $${stock.currentPrice} (Market Cap: $${(stock.marketCap! / 1_000_000_000).toFixed(2)}B)`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('\n🎉 Database seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database seeding failed:', error);
    process.exit(1);
  });