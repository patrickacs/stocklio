'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
  Eye,
  Building2
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { StockDetailModal } from './stock-detail-modal'

export interface ScreenerStock {
  ticker: string
  name: string
  sector: string
  currentPrice: number
  peRatio?: number
  dividendYield?: number
  marketCap?: number
  week52High?: number
  week52Low?: number
  change?: number
  changePercent?: number
}

interface ResultsTableProps {
  stocks: ScreenerStock[]
  isLoading?: boolean
  onAddToPortfolio?: (stock: ScreenerStock) => void
}

type SortField = 'ticker' | 'currentPrice' | 'peRatio' | 'dividendYield' | 'marketCap'
type SortDirection = 'asc' | 'desc'

export function ResultsTable({ stocks, isLoading = false, onAddToPortfolio }: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedStock, setSelectedStock] = useState<ScreenerStock | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedStocks = [...stocks].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortField) {
      case 'ticker':
        aValue = a.ticker
        bValue = b.ticker
        break
      case 'currentPrice':
        aValue = a.currentPrice
        bValue = b.currentPrice
        break
      case 'peRatio':
        aValue = a.peRatio || 0
        bValue = b.peRatio || 0
        break
      case 'dividendYield':
        aValue = a.dividendYield || 0
        bValue = b.dividendYield || 0
        break
      case 'marketCap':
        aValue = a.marketCap || 0
        bValue = b.marketCap || 0
        break
      default:
        return 0
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  if (isLoading) {
    return <ResultsTableSkeleton />
  }

  if (stocks.length === 0) {
    return <EmptyResults />
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Search Results</h2>
              <p className="text-slate-600 mt-1">
                {stocks.length} stock{stocks.length !== 1 ? 's' : ''} match your criteria
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200/50">
                <SortableHeader 
                  field="ticker" 
                  currentField={sortField} 
                  direction={sortDirection}
                  onClick={handleSort}
                >
                  Stock
                </SortableHeader>
                <TableHead>Sector</TableHead>
                <SortableHeader 
                  field="currentPrice" 
                  currentField={sortField} 
                  direction={sortDirection}
                  onClick={handleSort}
                >
                  Price
                </SortableHeader>
                <SortableHeader 
                  field="peRatio" 
                  currentField={sortField} 
                  direction={sortDirection}
                  onClick={handleSort}
                >
                  P/E Ratio
                </SortableHeader>
                <SortableHeader 
                  field="dividendYield" 
                  currentField={sortField} 
                  direction={sortDirection}
                  onClick={handleSort}
                >
                  Div Yield
                </SortableHeader>
                <SortableHeader 
                  field="marketCap" 
                  currentField={sortField} 
                  direction={sortDirection}
                  onClick={handleSort}
                >
                  Market Cap
                </SortableHeader>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {sortedStocks.map((stock, index) => (
                  <motion.tr
                    key={stock.ticker}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className="border-slate-200/50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedStock(stock)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {stock.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{stock.ticker}</div>
                          <div className="text-sm text-slate-500 truncate max-w-32">
                            {stock.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {stock.sector}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatCurrency(stock.currentPrice)}
                        {stock.changePercent !== undefined && (
                          <div className={`flex items-center gap-1 text-xs ${
                            stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stock.changePercent >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatPercentage(Math.abs(stock.changePercent))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {stock.peRatio ? stock.peRatio.toFixed(1) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {stock.dividendYield ? formatPercentage(stock.dividendYield) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {stock.marketCap ? formatMarketCap(stock.marketCap) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedStock(stock)
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {onAddToPortfolio && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onAddToPortfolio(stock)
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Stock Detail Modal */}
      <StockDetailModal
        stock={selectedStock}
        onClose={() => setSelectedStock(null)}
        onAddToPortfolio={onAddToPortfolio}
      />
    </>
  )
}

interface SortableHeaderProps {
  field: SortField
  currentField: SortField
  direction: SortDirection
  onClick: (field: SortField) => void
  children: React.ReactNode
}

function SortableHeader({ field, currentField, direction: _direction, onClick, children }: SortableHeaderProps) {
  const isActive = currentField === field
  
  return (
    <TableHead 
      className="cursor-pointer hover:bg-slate-50 transition-colors select-none"
      onClick={() => onClick(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className={`h-4 w-4 transition-colors ${
          isActive ? 'text-blue-600' : 'text-slate-400'
        }`} />
      </div>
    </TableHead>
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

function ResultsTableSkeleton() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
      <div className="p-6 border-b border-slate-200/50">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      <div className="p-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-200/50 last:border-0">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function EmptyResults() {
  return (
    <Card className="p-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="h-10 w-10 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          No Stocks Found
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Try adjusting your filters to find stocks that match your criteria.
        </p>
      </motion.div>
    </Card>
  )
}
