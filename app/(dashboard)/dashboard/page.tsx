'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/navbar'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  Calendar,
  Search
} from 'lucide-react'

// Import components
import { PortfolioTab } from '@/components/portfolio/portfolio-tab'
import { DividendsTab } from '@/components/dividends/dividends-tab'
import { ScreenerTab } from '@/components/screener/screener-tab'
import { SummaryCards } from '@/components/portfolio/summary-cards'

const tabs = [
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: TrendingUp,
    description: 'Track your investments and performance',
    color: 'text-navy-600',
    bgColor: 'bg-navy-50',
  },
  {
    id: 'dividends',
    label: 'Dividends',
    icon: Calendar,
    description: 'Monitor dividend payments and income',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    id: 'screener',
    label: 'Screener',
    icon: Search,
    description: 'Discover new investment opportunities',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('portfolio')
  const { data: session, status } = useSession()
  const router = useRouter()

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Welcome back, {session?.user?.name || 'User'}! 👋
          </h1>
          <p className="text-lg text-slate-600">
            Here&apos;s what&apos;s happening with your investments today.
          </p>
        </motion.div>

        {/* Quick Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <SummaryCards />
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Custom Tab List */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex-1 p-6 rounded-2xl border-2 transition-all duration-300
                      ${isActive 
                        ? 'border-slate-300 bg-white shadow-lg' 
                        : 'border-slate-200 bg-white/50 hover:bg-white hover:shadow-md'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`
                        p-3 rounded-xl ${tab.bgColor}
                        ${isActive ? 'shadow-sm' : ''}
                      `}>
                        <Icon className={`h-6 w-6 ${tab.color}`} />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <h3 className={`
                          text-lg font-semibold mb-1
                          ${isActive ? 'text-slate-800' : 'text-slate-700'}
                        `}>
                          {tab.label}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {tab.description}
                        </p>
                      </div>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-6 right-6 h-1 bg-gradient-to-r from-navy-500 to-navy-600 rounded-full"
                        layoutId="activeTab"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="portfolio" className="mt-0">
                  <PortfolioTab />
                </TabsContent>
                
                <TabsContent value="dividends" className="mt-0">
                  <DividendsTab />
                </TabsContent>
                
                <TabsContent value="screener" className="mt-0">
                  <ScreenerTab />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}
