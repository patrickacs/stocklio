'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
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
  Trash2, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { EnrichedAsset } from '@/types'
import { AddAssetDialog } from './add-asset-dialog'
import { DeleteAssetDialog } from './delete-asset-dialog'
import { useToast } from '@/hooks/use-toast'

type SortField = 'ticker' | 'shares' | 'avgPrice' | 'currentPrice' | 'totalValue' | 'profitLoss' | 'profitLossPercent'
type SortDirection = 'asc' | 'desc'

async function fetchPortfolio(): Promise<EnrichedAsset[]> {
  const response = await fetch('/api/portfolio')
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio')
  }
  const data = await response.json()
  return data.data
}

async function deleteAsset(id: string): Promise<void> {
  const response = await fetch(`/api/portfolio/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete asset')
  }
}

export function PortfolioTable() {
  const [sortField, setSortField] = useState<SortField>('totalValue')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deleteAssetState, setDeleteAssetState] = useState<EnrichedAsset | null>(null)
  
  const { data: session } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ['portfolio', session?.user?.id],
    queryFn: fetchPortfolio,
    refetchInterval: 60000, // Refetch every minute
    enabled: !!session?.user?.id, // Only run when user is authenticated
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] })
      toast({
        title: 'Asset deleted',
        description: 'The asset has been removed from your portfolio.',
      })
      setDeleteAssetState(null)
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete asset. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedAssets = [...assets].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortField) {
      case 'ticker':
        aValue = a.ticker
        bValue = b.ticker
        break
      case 'shares':
        aValue = a.shares
        bValue = b.shares
        break
      case 'avgPrice':
        aValue = a.avgPrice
        bValue = b.avgPrice
        break
      case 'currentPrice':
        aValue = a.currentPrice
        bValue = b.currentPrice
        break
      case 'totalValue':
        aValue = a.totalValue
        bValue = b.totalValue
        break
      case 'profitLoss':
        aValue = a.profitLoss
        bValue = b.profitLoss
        break
      case 'profitLossPercent':
        aValue = a.profitLossPercent
        bValue = b.profitLossPercent
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

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600 mb-4">Failed to load portfolio data</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Portfolio Holdings</h2>
              <p className="text-slate-600 mt-1">
                {assets.length} {assets.length === 1 ? 'asset' : 'assets'} • Updated just now
              </p>
            </div>
            
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-navy-600 hover:bg-navy-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <PortfolioTableSkeleton />
          ) : assets.length === 0 ? (
            <EmptyPortfolio onAddAsset={() => setShowAddDialog(true)} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200/50">
                  <SortableHeader 
                    field="ticker" 
                    currentField={sortField} 
                    direction={sortDirection}
                    onClick={handleSort}
                  >
                    Asset
                  </SortableHeader>
                  <SortableHeader 
                    field="shares" 
                    currentField={sortField} 
                    direction={sortDirection}
                    onClick={handleSort}
                  >
                    Shares
                  </SortableHeader>
                  <SortableHeader 
                    field="avgPrice" 
                    currentField={sortField} 
                    direction={sortDirection}
                    onClick={handleSort}
                  >
                    Avg Price
                  </SortableHeader>
                  <SortableHeader 
                    field="currentPrice" 
                    currentField={sortField} 
                    direction={sortDirection}
                    onClick={handleSort}
                  >
                    Current Price
                  </SortableHeader>
                  <SortableHeader 
                    field="totalValue" 
                    currentField={sortField} 
                    direction={sortDirection}
                    onClick={handleSort}
                  >
                    Total Value
                  </SortableHeader>
                  <SortableHeader 
                    field="profitLoss" 
                    currentField={sortField} 
                    direction={sortDirection}
                    onClick={handleSort}
                  >
                    P&L
                  </SortableHeader>
                  <SortableHeader 
                    field="profitLossPercent" 
                    currentField={sortField} 
                    direction={sortDirection}
                    onClick={handleSort}
                  >
                    Return %
                  </SortableHeader>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {sortedAssets.map((asset, index) => (
                    <motion.tr
                      key={asset.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-slate-200/50 hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-navy-500 to-navy-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {asset.ticker.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{asset.ticker}</div>
                            <div className="text-sm text-slate-500">{asset.name || 'Unknown Company'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{asset.shares.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(asset.avgPrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {formatCurrency(asset.currentPrice)}
                          <Badge 
                            variant="outline"
                            className={`
                              ${asset.dayChange >= 0 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-red-50 border-red-200 text-red-700'
                              }
                            `}
                          >
                            {asset.dayChange >= 0 ? '+' : ''}{formatPercentage(asset.dayChangePercent)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(asset.totalValue)}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${
                          asset.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {asset.profitLoss >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {formatCurrency(asset.profitLoss)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`
                            ${asset.profitLoss >= 0 
                              ? 'bg-green-50 border-green-200 text-green-700' 
                              : 'bg-red-50 border-red-200 text-red-700'
                            }
                          `}
                        >
                          {formatPercentage(asset.profitLossPercent)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteAssetState(asset)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Dialogs */}
      <AddAssetDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
      />
      
      <DeleteAssetDialog
        asset={deleteAssetState}
        onClose={() => setDeleteAssetState(null)}
        onConfirm={(asset) => deleteMutation.mutate(asset.id)}
        isLoading={deleteMutation.isPending}
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
          isActive ? 'text-navy-600' : 'text-slate-400'
        }`} />
      </div>
    </TableHead>
  )
}

function PortfolioTableSkeleton() {
  return (
    <div className="p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-200/50 last:border-0">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  )
}

interface EmptyPortfolioProps {
  onAddAsset: () => void
}

function EmptyPortfolio({ onAddAsset }: EmptyPortfolioProps) {
  return (
    <div className="p-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-20 h-20 bg-gradient-to-br from-navy-500 to-navy-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="h-10 w-10 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          Start Building Your Portfolio
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Add your first stock to start tracking your investments and see real-time performance data.
        </p>
        
        <Button 
          onClick={onAddAsset}
          size="lg"
          className="bg-navy-600 hover:bg-navy-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Your First Stock
        </Button>
      </motion.div>
    </div>
  )
}
