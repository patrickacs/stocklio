'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Percent
} from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { PortfolioSummary } from '@/types'

async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  const response = await fetch('/api/portfolio/summary')
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio summary')
  }
  const data = await response.json()
  return data.data
}

export function SummaryCards() {
  const { data: session } = useSession()
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['portfolio-summary', session?.user?.id],
    queryFn: fetchPortfolioSummary,
    refetchInterval: 60000, // Refetch every minute
    enabled: !!session?.user?.id, // Only run when user is authenticated
  })

  if (isLoading) {
    return <SummaryCardsSkeleton />
  }

  if (error || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-red-50 border-red-200">
            <p className="text-red-600 text-sm">Failed to load data</p>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Value',
      value: formatCurrency(summary.totalValue),
      change: `${formatCurrency(summary.totalProfitLoss)} (${formatPercentage(summary.totalProfitLossPercent)})`,
      positive: summary.totalProfitLoss >= 0,
      icon: BarChart3,
      gradient: 'from-navy-500 to-navy-600',
    },
    {
      title: 'Total Cost',
      value: formatCurrency(summary.totalCost),
      change: `${summary.assetCount} assets`,
      positive: true,
      icon: DollarSign,
      gradient: 'from-slate-500 to-slate-600',
    },
    {
      title: "Today's Change",
      value: formatCurrency(summary.dayChange),
      change: formatPercentage(summary.dayChangePercent),
      positive: summary.dayChange >= 0,
      icon: summary.dayChange >= 0 ? TrendingUp : TrendingDown,
      gradient: summary.dayChange >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
    },
    {
      title: 'Total Return',
      value: formatPercentage(summary.totalProfitLossPercent),
      change: formatCurrency(summary.totalProfitLoss),
      positive: summary.totalProfitLoss >= 0,
      icon: Percent,
      gradient: summary.totalProfitLoss >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <SummaryCard {...card} />
        </motion.div>
      ))}
    </div>
  )
}

interface SummaryCardProps {
  title: string
  value: string
  change: string
  positive: boolean
  icon: React.ElementType
  gradient: string
}

function SummaryCard({ title, value, change, positive, icon: Icon, gradient }: SummaryCardProps) {
  return (
    <Card className="relative p-6 bg-white/80 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <motion.p 
              className="text-3xl font-bold text-slate-800"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            >
              {value}
            </motion.p>
          </div>
          
          <div className={`
            p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg
          `}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
            ${positive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
            }
          `}>
            {positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change}
          </div>
        </div>
      </div>
    </Card>
  )
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
          <Skeleton className="h-6 w-16" />
        </Card>
      ))}
    </div>
  )
}
