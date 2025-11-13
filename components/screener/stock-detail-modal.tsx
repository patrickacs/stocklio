'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Building2,
  Globe,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Percent
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { ScreenerStock } from './results-table'

interface StockDetailData {
  ticker: string
  name: string
  sector: string
  industry: string
  description: string
  website: string
  employees: number
  headquarters: string
  founded: string
  currentPrice: number
  change: number
  changePercent: number
  dayHigh: number
  dayLow: number
  week52High: number
  week52Low: number
  volume: number
  peRatio?: number
  dividendYield?: number
  marketCap?: number
}

interface StockDetailModalProps {
  stock: ScreenerStock | null
  onClose: () => void
  onAddToPortfolio?: (stock: ScreenerStock) => void
}

async function fetchStockDetail(ticker: string): Promise<StockDetailData> {
  const response = await fetch(`/api/screener/stock/${ticker}`)
  if (!response.ok) {
    throw new Error('Failed to fetch stock details')
  }
  const data = await response.json()
  return data.data
}

export function StockDetailModal({ stock, onClose, onAddToPortfolio }: StockDetailModalProps) {
  const { data: details, isLoading, error } = useQuery({
    queryKey: ['stock-detail', stock?.ticker],
    queryFn: () => fetchStockDetail(stock!.ticker),
    enabled: !!stock,
  })

  if (!stock) return null

  const isPositive = details ? details.changePercent >= 0 : (stock.changePercent || 0) >= 0

  return (
    <Dialog open={!!stock} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              {stock.ticker.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{stock.ticker}</h2>
              <p className="text-sm text-slate-600">{stock.name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <StockDetailSkeleton />
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">Failed to load stock details</p>
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Price Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-slate-50 rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-slate-800">
                    {formatCurrency(details.currentPrice)}
                  </p>
                  <div className={`flex items-center gap-1 mt-1 ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {isPositive ? '+' : ''}{formatCurrency(details.change)} 
                      ({formatPercentage(Math.abs(details.changePercent))})
                    </span>
                  </div>
                </div>
                
                <Badge variant="outline" className="text-sm">
                  {details.sector}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Day Range</p>
                  <p className="font-medium text-slate-800">
                    {formatCurrency(details.dayLow)} - {formatCurrency(details.dayHigh)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">52W Range</p>
                  <p className="font-medium text-slate-800">
                    {formatCurrency(details.week52Low)} - {formatCurrency(details.week52High)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <BarChart3 className="h-5 w-5 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">P/E Ratio</p>
                <p className="font-semibold text-slate-800">
                  {details.peRatio ? details.peRatio.toFixed(1) : 'N/A'}
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <Percent className="h-5 w-5 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Div Yield</p>
                <p className="font-semibold text-slate-800">
                  {details.dividendYield ? formatPercentage(details.dividendYield) : 'N/A'}
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <DollarSign className="h-5 w-5 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Market Cap</p>
                <p className="font-semibold text-slate-800">
                  {details.marketCap ? formatMarketCap(details.marketCap) : 'N/A'}
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <BarChart3 className="h-5 w-5 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-1">Volume</p>
                <p className="font-semibold text-slate-800">
                  {formatVolume(details.volume)}
                </p>
              </div>
            </motion.div>

            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-slate-800">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Industry</p>
                    <p className="font-medium text-slate-800">{details.industry}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Employees</p>
                    <p className="font-medium text-slate-800">
                      {details.employees?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Headquarters</p>
                    <p className="font-medium text-slate-800">{details.headquarters}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Founded</p>
                    <p className="font-medium text-slate-800">{details.founded}</p>
                  </div>
                </div>
              </div>

              {details.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-500" />
                  <a 
                    href={details.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {details.website}
                  </a>
                </div>
              )}

              {details.description && (
                <div>
                  <p className="text-slate-500 mb-2">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {details.description}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Actions */}
            {onAddToPortfolio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-3 pt-4 border-t border-slate-200"
              >
                <Button
                  onClick={() => onAddToPortfolio(stock)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Portfolio
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </motion.div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(1)}T`
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(1)}B`
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(1)}M`
  } else {
    return formatCurrency(marketCap)
  }
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(1)}B`
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(1)}M`
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(1)}K`
  } else {
    return volume.toLocaleString()
  }
}

function StockDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
