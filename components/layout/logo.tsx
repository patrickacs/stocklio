'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <Link href="/dashboard" className={`flex items-center gap-3 ${className}`}>
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Logo Icon */}
        <div className="relative w-10 h-10 bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl flex items-center justify-center shadow-lg">
          {/* S Letter */}
          <div className="text-white font-bold text-xl">S</div>
          
          {/* Upward Arrow */}
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M7 17L17 7M17 7H7M17 7V17"
              />
            </svg>
          </motion.div>
        </div>
      </motion.div>

      {showText && (
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-2xl font-bold text-slate-800 leading-none">
            STOCKLIO
          </span>
          <span className="text-xs text-slate-500 leading-none mt-0.5">
            Your portfolio, simplified
          </span>
        </motion.div>
      )}
    </Link>
  )
}
