"use client"

import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"
import type { TimeRange, RangeOption } from "@/lib/types"
import { RANGE_OPTIONS } from "@/lib/types"

interface RangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
  className?: string
}

export function RangeSelector({ value, onChange, className }: RangeSelectorProps) {
  const currentLabel = RANGE_OPTIONS.find((o) => o.key === value)?.label || "All Time"

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-foreground">{currentLabel}</span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimeRange)}
        className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
      >
        {RANGE_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
