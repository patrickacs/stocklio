'use client'

import { motion } from 'framer-motion'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { EnrichedAsset } from '@/types'

interface DeleteAssetDialogProps {
  asset: EnrichedAsset | null
  onClose: () => void
  onConfirm: (asset: EnrichedAsset) => void
  isLoading: boolean
}

export function DeleteAssetDialog({ asset, onClose, onConfirm, isLoading }: DeleteAssetDialogProps) {
  if (!asset) return null

  const isProfitable = asset.profitLoss >= 0

  return (
    <AlertDialog open={!!asset} onOpenChange={() => onClose()}>
      <AlertDialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-bold text-slate-800">
                Delete Asset
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600 mt-1">
                This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Asset Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-slate-50 rounded-xl border border-slate-200 my-4"
        >
          <div className="flex items-start gap-4">
            {/* Asset Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-navy-500 to-navy-600 rounded-lg flex items-center justify-center text-white font-bold">
              {asset.ticker.slice(0, 2)}
            </div>

            {/* Asset Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-slate-800">{asset.ticker}</h3>
                <Badge variant="outline" className="text-xs">
                  {asset.shares} shares
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Avg Price</p>
                  <p className="font-medium text-slate-800">{formatCurrency(asset.avgPrice)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Current Price</p>
                  <p className="font-medium text-slate-800">{formatCurrency(asset.currentPrice)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Value</p>
                  <p className="font-semibold text-slate-800">{formatCurrency(asset.totalValue)}</p>
                </div>
                <div>
                  <p className="text-slate-500">P&L</p>
                  <div className={`flex items-center gap-1 font-medium ${
                    isProfitable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isProfitable ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatCurrency(asset.profitLoss)} ({formatPercentage(asset.profitLossPercent)})
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Warning Message */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-1">
                Are you sure you want to delete this asset?
              </p>
              <p className="text-amber-700">
                This will permanently remove <strong>{asset.ticker}</strong> from your portfolio. 
                All associated dividend records will also be deleted.
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </AlertDialogCancel>
          
          <Button
            onClick={() => onConfirm(asset)}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Asset
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
