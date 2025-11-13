'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  TrendingUp,
  Clock,
  Coins
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DividendSummaryData {
  totalExpected: number
  dividends: Array<{
    ticker: string
    companyName: string
    exDate: string
    payDate: string
    amountPerShare: number
    shares: number
    totalAmount: number
  }>
}

interface AnnualDividendData {
  annualIncome: number
  monthlyAverage: number
  byStock: Array<{
    ticker: string
    companyName: string
    annual: number
    frequency: string
  }>
  byMonth: Array<{
    month: string
    amount: number
  }>
}

async function fetchUpcomingDividends(): Promise<DividendSummaryData> {
  const response = await fetch('/api/dividends/upcoming?days=30')
  if (!response.ok) {
    throw new Error('Failed to fetch upcoming dividends')
  }
  const data = await response.json()
  return data.data
}

async function fetchAnnualDividends(): Promise<AnnualDividendData> {
  const response = await fetch('/api/dividends/annual')
  if (!response.ok) {
    throw new Error('Failed to fetch annual dividends')
  }
  const data = await response.json()
  return data.data
}

export function DividendSummary() {
  const { data: session } = useSession()
  
  const { data: upcoming, isLoading: upcomingLoading } = useQuery({
    queryKey: ['dividends-upcoming', session?.user?.id],
    queryFn: fetchUpcomingDividends,
    refetchInterval: 300000, // 5 minutes
    enabled: !!session?.user?.id, // Only run when user is authenticated
  })

  const { data: annual, isLoading: annualLoading } = useQuery({
    queryKey: ['dividends-annual', session?.user?.id],
    queryFn: fetchAnnualDividends,
    refetchInterval: 300000, // 5 minutes
    enabled: !!session?.user?.id, // Only run when user is authenticated
  })

  if (upcomingLoading || annualLoading) {
    return <DividendSummarySkeleton />
  }

  const nextDividend = upcoming?.dividends?.[0]
  const daysUntilNext = nextDividend 
    ? Math.ceil((new Date(nextDividend.payDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Next 30 Days */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-emerald-700 mb-1">Next 30 Days</p>
              <p className="text-3xl font-bold text-emerald-800">
                {formatCurrency(upcoming?.totalExpected || 0)}
              </p>
            </div>
            <div className="p-3 bg-emerald-500 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              {upcoming?.dividends?.length || 0} payments
            </Badge>
          </div>
        </Card>
      </motion.div>

      {/* Annual Income */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Annual Income</p>
              <p className="text-3xl font-bold text-blue-800">
                {formatCurrency(annual?.annualIncome || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {formatCurrency(annual?.monthlyAverage || 0)}/month
            </Badge>
          </div>
        </Card>
      </motion.div>

      {/* Next Payment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Next Payment</p>
              {nextDividend ? (
                <>
                  <p className="text-2xl font-bold text-purple-800">
                    {formatCurrency(nextDividend.totalAmount)}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    {nextDividend.ticker}
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold text-purple-800">
                  No payments
                </p>
              )}
            </div>
            <div className="p-3 bg-purple-500 rounded-xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {daysUntilNext ? (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                in {daysUntilNext} days
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-600">
                No upcoming
              </Badge>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Total Stocks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-amber-700 mb-1">Dividend Stocks</p>
              <p className="text-3xl font-bold text-amber-800">
                {annual?.byStock?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-amber-500 rounded-xl">
              <Coins className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
              Active holdings
            </Badge>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

function DividendSummarySkeleton() {
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
