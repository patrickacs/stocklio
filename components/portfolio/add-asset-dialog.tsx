'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TickerSearch } from '@/components/ui/ticker-search'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar as CalendarIcon, DollarSign, Hash, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const addAssetSchema = z.object({
  ticker: z.string()
    .min(1, 'Ticker is required')
    .max(5, 'Ticker must be 5 characters or less')
    .regex(/^[A-Z]+$/, 'Ticker must contain only uppercase letters'),
  shares: z.number()
    .min(0.01, 'Shares must be greater than 0')
    .max(1000000, 'Shares cannot exceed 1,000,000'),
  avgPrice: z.number()
    .min(0.01, 'Price must be greater than $0.01')
    .max(1000000, 'Price cannot exceed $1,000,000'),
  purchaseDate: z.date().optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
})

type AddAssetFormData = z.infer<typeof addAssetSchema>

interface AddAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

async function addAsset(data: AddAssetFormData) {
  const response = await fetch('/api/portfolio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      ticker: data.ticker.toUpperCase(),
      purchaseDate: data.purchaseDate?.toISOString(),
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to add asset')
  }

  return response.json()
}

export function AddAssetDialog({ open, onOpenChange }: AddAssetDialogProps) {
  const [tickerValidation, setTickerValidation] = useState<{
    isValid: boolean
    companyName?: string
    currentPrice?: number
  } | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<AddAssetFormData>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: {
      ticker: '',
      shares: 0,
      avgPrice: 0,
      notes: '',
    },
  })

  const addAssetMutation = useMutation({
    mutationFn: addAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] })
      toast({
        title: 'Asset added successfully',
        description: 'The asset has been added to your portfolio.',
      })
      onOpenChange(false)
      form.reset()
      setTickerValidation(null)
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding asset',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const validateTicker = async (ticker: string) => {
    if (!ticker || ticker.length < 1) {
      setTickerValidation(null)
      return
    }

    try {
      // Use the search API instead which is simpler and doesn't require complex auth
      const response = await fetch(`/api/search/tickers?q=${ticker.toUpperCase()}`)
      if (response.ok) {
        const data = await response.json()
        const stock = data.data.find((s: any) => s.ticker === ticker.toUpperCase())

        if (stock) {
          setTickerValidation({
            isValid: true,
            companyName: stock.name,
            currentPrice: stock.price || 0,
          })

          // Auto-fill current price as average price if not set
          if (!form.getValues('avgPrice') && stock.price) {
            form.setValue('avgPrice', stock.price)
          }
        } else {
          setTickerValidation({ isValid: false })
        }
      } else {
        setTickerValidation({ isValid: false })
      }
    } catch (error) {
      setTickerValidation({ isValid: false })
    }
  }

  const onSubmit = (data: AddAssetFormData) => {
    addAssetMutation.mutate(data)
  }

  const totalCost = form.watch('shares') * form.watch('avgPrice')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Add New Asset
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Add a stock to your portfolio to start tracking its performance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Ticker Field */}
            <FormField
              control={form.control}
              name="ticker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Stock Ticker
                  </FormLabel>
                  <FormControl>
                    <TickerSearch
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                        validateTicker(value)
                      }}
                      onSelect={(suggestion) => {
                        field.onChange(suggestion.ticker)
                        validateTicker(suggestion.ticker)
                        // Auto-fill current price if available
                        if (suggestion.price && !form.getValues('avgPrice')) {
                          form.setValue('avgPrice', suggestion.price)
                        }
                      }}
                      placeholder="e.g., AAPL, MSFT, GOOGL"
                      disabled={addAssetMutation.isPending}
                    />
                  </FormControl>
                  
                  {/* Ticker Validation Feedback */}
                  {tickerValidation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2"
                    >
                      {tickerValidation.isValid ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            ✓ Valid Ticker
                          </Badge>
                          {tickerValidation.companyName && (
                            <span className="text-sm text-slate-600">
                              {tickerValidation.companyName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="destructive">
                          ✗ Invalid Ticker
                        </Badge>
                      )}
                    </motion.div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shares and Price Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shares"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Shares
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avgPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Average Price
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="150.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total Cost Display */}
            {totalCost > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total Cost:</span>
                  <span className="text-lg font-bold text-slate-800">
                    ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Purchase Date */}
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Purchase Date (Optional)
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When did you purchase this asset?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this investment..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={addAssetMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addAssetMutation.isPending || !tickerValidation?.isValid}
                className="bg-navy-600 hover:bg-navy-700"
              >
                {addAssetMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Asset
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
