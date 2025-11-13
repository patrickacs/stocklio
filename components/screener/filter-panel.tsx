'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Filter, 
  RotateCcw, 
  Search,
  DollarSign,
  BarChart3,
  Percent,
  Building2
} from 'lucide-react'

export interface ScreenerFilters {
  minPrice?: number
  maxPrice?: number
  maxPE?: number
  minDividendYield?: number
  marketCap?: 'small' | 'mid' | 'large' | 'mega'
  sectors?: string[]
}

interface FilterPanelProps {
  filters: ScreenerFilters
  onFiltersChange: (filters: ScreenerFilters) => void
  onSearch: () => void
  isLoading?: boolean
  resultCount?: number
}

const SECTORS = [
  'Technology',
  'Healthcare', 
  'Financial Services',
  'Consumer Cyclical',
  'Industrials',
  'Communication Services',
  'Consumer Defensive',
  'Energy',
  'Utilities',
  'Real Estate',
  'Materials',
]

const MARKET_CAP_OPTIONS = [
  { value: 'small', label: 'Small Cap ($300M - $2B)' },
  { value: 'mid', label: 'Mid Cap ($2B - $10B)' },
  { value: 'large', label: 'Large Cap ($10B - $200B)' },
  { value: 'mega', label: 'Mega Cap ($200B+)' },
]

export function FilterPanel({ 
  filters, 
  onFiltersChange, 
  onSearch, 
  isLoading = false,
  resultCount 
}: FilterPanelProps) {
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 1000])
  const [peRatio, setPeRatio] = useState([filters.maxPE || 50])
  const [dividendYield, setDividendYield] = useState([filters.minDividendYield || 0])

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values)
    onFiltersChange({
      ...filters,
      minPrice: (values[0] ?? 0) > 0 ? values[0] : undefined,
      maxPrice: (values[1] ?? 1000) < 1000 ? values[1] : undefined,
    })
  }

  const handlePeRatioChange = (values: number[]) => {
    setPeRatio(values)
    onFiltersChange({
      ...filters,
      maxPE: (values[0] ?? 50) < 50 ? values[0] : undefined,
    })
  }

  const handleDividendYieldChange = (values: number[]) => {
    setDividendYield(values)
    onFiltersChange({
      ...filters,
      minDividendYield: (values[0] ?? 0) > 0 ? values[0] : undefined,
    })
  }

  const handleSectorToggle = (sector: string) => {
    const currentSectors = filters.sectors || []
    const newSectors = currentSectors.includes(sector)
      ? currentSectors.filter(s => s !== sector)
      : [...currentSectors, sector]
    
    onFiltersChange({
      ...filters,
      sectors: newSectors.length > 0 ? newSectors : undefined,
    })
  }

  const handleReset = () => {
    setPriceRange([0, 1000])
    setPeRatio([50])
    setDividendYield([0])
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof ScreenerFilters] !== undefined
  )

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200/50 sticky top-24">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-slate-600 hover:text-slate-800"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Result Count */}
        {resultCount !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <p className="text-sm font-medium text-blue-800">
              {resultCount} stock{resultCount !== 1 ? 's' : ''} found
            </p>
          </motion.div>
        )}

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4" />
            Price Range
          </Label>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              max={1000}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>${priceRange[0] ?? 0}</span>
              <span>${priceRange[1] ?? 1000}{(priceRange[1] ?? 1000) >= 1000 ? '+' : ''}</span>
            </div>
          </div>
        </div>

        {/* P/E Ratio */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4" />
            Max P/E Ratio
          </Label>
          <div className="px-2">
            <Slider
              value={peRatio}
              onValueChange={handlePeRatioChange}
              max={50}
              min={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>5</span>
              <span>{peRatio[0] ?? 50}{(peRatio[0] ?? 50) >= 50 ? '+' : ''}</span>
            </div>
          </div>
        </div>

        {/* Dividend Yield */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Percent className="h-4 w-4" />
            Min Dividend Yield
          </Label>
          <div className="px-2">
            <Slider
              value={dividendYield}
              onValueChange={handleDividendYieldChange}
              max={10}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>0%</span>
              <span>{(dividendYield[0] ?? 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Market Cap */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4" />
            Market Cap
          </Label>
          <Select
            value={filters.marketCap || ''}
            onValueChange={(value) => 
              onFiltersChange({
                ...filters,
                marketCap: value as any || undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Any size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any size</SelectItem>
              {MARKET_CAP_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sectors */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Sectors</Label>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((sector) => {
              const isSelected = filters.sectors?.includes(sector) || false
              
              return (
                <Badge
                  key={sector}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => handleSectorToggle(sector)}
                >
                  {sector}
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={onSearch}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                <Search className="h-4 w-4" />
              </motion.div>
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search Stocks
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
