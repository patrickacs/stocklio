'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, TrendingUp, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TickerSuggestion {
  ticker: string
  name: string
  sector: string
  price: number
}

interface TickerSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: TickerSuggestion) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function TickerSearch({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Search stocks...", 
  className,
  disabled 
}: TickerSearchProps) {
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Debounced search function
  const searchTickers = async (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/search/tickers?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.data)
        setShowSuggestions(data.data.length > 0)
        setSelectedIndex(-1)
      }
    } catch (error) {
      console.error('Ticker search error:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change with debounce
  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Debounce search by 300ms
    debounceRef.current = setTimeout(() => {
      searchTickers(newValue)
    }, 300)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
        
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          const selected = suggestions[selectedIndex]
          if (selected) {
            handleSelect(selected)
          }
        }
        break
        
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle suggestion selection
  const handleSelect = (suggestion: TickerSuggestion) => {
    onChange(suggestion.ticker)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onSelect?.(suggestion)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          className={cn("pr-10", className)}
          disabled={disabled}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <Search className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.ticker}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelect(suggestion)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0",
                    selectedIndex === index && "bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-navy-500 to-navy-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {suggestion.ticker.slice(0, 2)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {suggestion.ticker}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.sector}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 truncate max-w-48">
                          {suggestion.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-slate-700">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-medium">
                          {formatCurrency(suggestion.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
