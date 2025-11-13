'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FilterPanel, ScreenerFilters } from './filter-panel'
import { ResultsTable, ScreenerStock } from './results-table'
import { useToast } from '@/hooks/use-toast'

async function searchStocks(filters: ScreenerFilters): Promise<ScreenerStock[]> {
  const response = await fetch('/api/screener/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters),
  })
  
  if (!response.ok) {
    throw new Error('Failed to search stocks')
  }
  
  const data = await response.json()
  return data.data.results
}

async function getPopularStocks(): Promise<ScreenerStock[]> {
  const response = await fetch('/api/screener/search')
  
  if (!response.ok) {
    throw new Error('Failed to fetch popular stocks')
  }
  
  const data = await response.json()
  return data.data.results
}

export function ScreenerTab() {
  const [filters, setFilters] = useState<ScreenerFilters>({})
  const [hasSearched, setHasSearched] = useState(false)
  const { toast } = useToast()

  // Popular stocks query (loads on mount)
  const { data: popularStocks, isLoading: popularLoading } = useQuery({
    queryKey: ['popular-stocks'],
    queryFn: getPopularStocks,
  })

  // Search results query (only runs when search is triggered)
  const { 
    data: searchResults, 
    isLoading: searchLoading, 
    refetch: performSearch 
  } = useQuery({
    queryKey: ['stock-search', filters],
    queryFn: () => searchStocks(filters),
    enabled: false, // Don't run automatically
  })

  const handleSearch = async () => {
    setHasSearched(true)
    try {
      await performSearch()
    } catch (error) {
      toast({
        title: 'Search failed',
        description: 'Unable to search stocks. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleAddToPortfolio = (stock: ScreenerStock) => {
    // This would typically open the AddAssetDialog with pre-filled data
    toast({
      title: 'Feature coming soon',
      description: `Adding ${stock.ticker} to portfolio will be available soon.`,
    })
  }

  // Determine which data to show
  const displayStocks = hasSearched ? (searchResults || []) : (popularStocks || [])
  const isLoading = hasSearched ? searchLoading : popularLoading

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Filter Panel - Left Sidebar */}
      <motion.div
        className="lg:col-span-1"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          isLoading={searchLoading}
          resultCount={hasSearched ? searchResults?.length : popularStocks?.length}
        />
      </motion.div>

      {/* Results Table - Main Content */}
      <motion.div
        className="lg:col-span-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {hasSearched ? 'Search Results' : 'Popular Stocks'}
          </h2>
          <p className="text-slate-600">
            {hasSearched 
              ? 'Stocks matching your criteria' 
              : 'Discover trending stocks and market leaders'
            }
          </p>
        </div>
        
        <ResultsTable
          stocks={displayStocks}
          isLoading={isLoading}
          onAddToPortfolio={handleAddToPortfolio}
        />
      </motion.div>
    </div>
  )
}
