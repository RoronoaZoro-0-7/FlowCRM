'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DollarSign } from 'lucide-react'

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
]

interface CurrencyDisplayProps {
  value: number
  currency?: string
  showCode?: boolean
  className?: string
}

export function CurrencyDisplay({ value, currency = 'USD', showCode = false, className = '' }: CurrencyDisplayProps) {
  const currencyInfo = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyInfo.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: currencyInfo.code === 'JPY' ? 0 : 2,
  }).format(value)

  return (
    <span className={className}>
      {formatted}
      {showCode && (
        <Badge variant="outline" className="ml-1 text-xs">
          {currencyInfo.code}
        </Badge>
      )}
    </span>
  )
}

interface CurrencyInputProps {
  value: number
  currency: string
  onChange: (value: number) => void
  onCurrencyChange?: (currency: string) => void
  showCurrencySelect?: boolean
  placeholder?: string
  className?: string
}

export function CurrencyInput({
  value,
  currency,
  onChange,
  onCurrencyChange,
  showCurrencySelect = false,
  placeholder = '0',
  className = '',
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || '')
  const currencyInfo = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '')
    setInputValue(val)
    const numVal = parseFloat(val)
    if (!isNaN(numVal)) {
      onChange(numVal)
    } else if (val === '') {
      onChange(0)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {currencyInfo.symbol}
        </span>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-8 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {showCurrencySelect && onCurrencyChange && (
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

interface CurrencySelectorProps {
  value: string
  onChange: (currency: string) => void
  label?: string
}

export function CurrencySelector({ value, onChange, label }: CurrencySelectorProps) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <span className="font-mono">{currency.symbol}</span>
                <span>{currency.code}</span>
                <span className="text-muted-foreground text-sm">- {currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Export currency utilities
export const getCurrencySymbol = (code: string): string => {
  return CURRENCIES.find((c) => c.code === code)?.symbol || '$'
}

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  const currencyInfo = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyInfo.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: currencyInfo.code === 'JPY' ? 0 : 2,
  }).format(value)
}

export { CURRENCIES }
