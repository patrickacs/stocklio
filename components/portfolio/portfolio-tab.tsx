'use client'

import { motion } from 'framer-motion'
import { SummaryCards } from './summary-cards'
import { PortfolioTable } from './portfolio-table'
import { AllocationChart } from './allocation-chart'

export function PortfolioTab() {
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SummaryCards />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Portfolio Table - Takes 2/3 on large screens */}
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <PortfolioTable />
        </motion.div>

        {/* Allocation Chart - Takes 1/3 on large screens */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AllocationChart />
        </motion.div>
      </div>
    </div>
  )
}
