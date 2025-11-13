'use client'

import { motion } from 'framer-motion'
import { DividendSummary } from './dividend-summary'
import { DividendList } from './dividend-list'

export function DividendsTab() {
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DividendSummary />
      </motion.div>

      {/* Dividend List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Upcoming Dividend Payments
          </h2>
          <p className="text-slate-600">
            Track your dividend schedule and expected income over the next 3 months.
          </p>
        </div>
        
        <DividendList />
      </motion.div>
    </div>
  )
}
