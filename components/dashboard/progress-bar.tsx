"use client"

import { cn } from "@/lib/utils"

interface ProgressBarProps {
  label: string
  value: string | number
  percentage: number
  color?: string
  className?: string
}

export function ProgressBar({ label, value, percentage, color, className }: ProgressBarProps) {
  const clampedPct = Math.max(0, Math.min(100, percentage))

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            color || "bg-primary"
          )}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
    </div>
  )
}
