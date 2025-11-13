'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { PortfolioSummary } from '@/types'

const COLORS = [
  '#1E40AF', // Navy
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
]

async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  const response = await fetch('/api/portfolio/summary')
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio summary')
  }
  const data = await response.json()
  return data.data
}

export function AllocationChart() {
  const [viewMode, setViewMode] = useState<'sector' | 'assets'>('sector')
  const { data: session } = useSession()
  
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['portfolio-summary', session?.user?.id],
    queryFn: fetchPortfolioSummary,
    refetchInterval: 60000,
    enabled: !!session?.user?.id, // Only run when user is authenticated
  })

  if (isLoading) {
    return <AllocationChartSkeleton />
  }

  if (error || !summary) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <p className="text-red-600 text-center">Failed to load allocation data</p>
      </Card>
    )
  }

  if (summary.allocation.length === 0) {
    return <EmptyAllocation />
  }

  // Prepare data based on view mode
  const sourceData = viewMode === 'sector' ? summary.allocation : summary.allocationByAsset;
  const chartData = sourceData.map((item, index) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
      {/* Header */}
      <div className="p-6 border-b border-slate-200/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-navy-600" />
            <h3 className="text-lg font-semibold text-slate-800">Portfolio Allocation</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'sector' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('sector')}
              className={viewMode === 'sector' ? 'bg-navy-600 hover:bg-navy-700' : ''}
            >
              By Sector
            </Button>
            <Button
              variant={viewMode === 'assets' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('assets')}
              className={viewMode === 'assets' ? 'bg-navy-600 hover:bg-navy-700' : ''}
            >
              By Asset
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-slate-600">
          Diversification across {chartData.length} {viewMode === 'sector' ? 'sectors' : 'assets'}
        </p>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-slate-800">{data.name}</p>
                        <p className="text-sm text-slate-600">
                          {formatCurrency(data.value)} ({formatPercentage(data.percentage)})
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {chartData.map((item, index) => (
            <motion.div
              key={`${item.name}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-slate-800">{item.name}</span>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-slate-800">
                  {formatCurrency(item.value)}
                </p>
                <p className="text-sm text-slate-600">
                  {formatPercentage(item.percentage)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">
                {chartData.length}
              </p>
              <p className="text-sm text-slate-600">
                {viewMode === 'sector' ? 'Sectors' : 'Assets'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(summary.totalValue)}
              </p>
              <p className="text-sm text-slate-600">Total Value</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function AllocationChartSkeleton() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
      <div className="p-6 border-b border-slate-200/50">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-center h-80 mb-6">
          <Skeleton className="w-60 h-60 rounded-full" />
        </div>
        
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function EmptyAllocation() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
      <div className="p-6 border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-navy-600" />
          <h3 className="text-lg font-semibold text-slate-800">Portfolio Allocation</h3>
        </div>
      </div>
      
      <div className="p-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          
          <h4 className="text-lg font-semibold text-slate-800 mb-2">
            No Allocation Data
          </h4>
          <p className="text-slate-600 text-sm">
            Add assets to your portfolio to see allocation breakdown.
          </p>
        </motion.div>
      </div>
    </Card>
  )
}
