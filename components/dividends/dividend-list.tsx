'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  DollarSign,
  Clock,
  TrendingUp
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format, isAfter, isBefore, addDays } from 'date-fns'

interface DividendPayment {
  ticker: string
  companyName: string
  exDate: string
  payDate: string
  amount: number
  shares: number
  totalAmount: number
  frequency?: string
}

interface DividendListData {
  totalExpected: number
  dividends: DividendPayment[]
}

async function fetchUpcomingDividends(): Promise<DividendListData> {
  const response = await fetch('/api/dividends/upcoming?days=90') // Get 3 months
  if (!response.ok) {
    throw new Error('Failed to fetch upcoming dividends')
  }
  const data = await response.json()
  return data.data
}

export function DividendList() {
  const { data: session } = useSession()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dividends-upcoming-list', session?.user?.id],
    queryFn: fetchUpcomingDividends,
    refetchInterval: 300000, // 5 minutes
    enabled: !!session?.user?.id, // Only run when user is authenticated
  })

  if (isLoading) {
    return <DividendListSkeleton />
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600 mb-4">Failed to load dividend data</p>
      </Card>
    )
  }

  if (data.dividends.length === 0) {
    return <EmptyDividendList />
  }

  // Group dividends by month
  const groupedDividends = data.dividends.reduce((groups, dividend) => {
    const month = format(new Date(dividend.payDate), 'MMMM yyyy')
    if (!groups[month]) {
      groups[month] = []
    }
    groups[month].push(dividend)
    return groups
  }, {} as Record<string, DividendPayment[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedDividends).map(([month, dividends], monthIndex) => {
        const monthTotal = dividends.reduce((sum, div) => sum + div.totalAmount, 0)
        
        return (
          <motion.div
            key={month}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: monthIndex * 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              {/* Month Header */}
              <div className="p-6 border-b border-slate-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{month}</h3>
                      <p className="text-sm text-slate-600">
                        {dividends.length} payment{dividends.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">
                      {formatCurrency(monthTotal)}
                    </p>
                    <p className="text-sm text-slate-600">Total expected</p>
                  </div>
                </div>
              </div>

              {/* Dividend Payments */}
              <div className="p-6">
                <div className="space-y-4">
                  {dividends.map((dividend, index) => {
                    const payDate = new Date(dividend.payDate)
                    const exDate = new Date(dividend.exDate)
                    const isUpcoming = isAfter(payDate, new Date())
                    const isRecent = isBefore(payDate, addDays(new Date(), 7))
                    
                    return (
                      <motion.div
                        key={`${dividend.ticker}-${dividend.payDate}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* Company Icon */}
                          <div className="w-12 h-12 bg-gradient-to-br from-navy-500 to-navy-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {dividend.ticker.slice(0, 2)}
                          </div>
                          
                          {/* Company Info */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-800">
                                {dividend.ticker}
                              </h4>
                              {dividend.frequency && (
                                <Badge variant="outline" className="text-xs">
                                  {dividend.frequency}
                                </Badge>
                              )}
                              {isRecent && isUpcoming && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                  Soon
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">
                              {dividend.companyName}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Ex: {format(exDate, 'MMM dd')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Pay: {format(payDate, 'MMM dd')}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Payment Details */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">
                            {formatCurrency(dividend.totalAmount)}
                          </p>
                          <p className="text-sm text-slate-600">
                            {formatCurrency(dividend.amount)} × {dividend.shares}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-emerald-600" />
                            <span className="text-xs text-emerald-600 font-medium">
                              Dividend
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

function DividendListSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-6 w-20 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          
          <div className="space-y-4">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-16 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

function EmptyDividendList() {
  return (
    <Card className="p-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <DollarSign className="h-10 w-10 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          No Upcoming Dividends
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Add dividend-paying stocks to your portfolio to start tracking your dividend income.
        </p>
      </motion.div>
    </Card>
  )
}
