"use client"

import { cn } from "@/lib/utils"

interface MetricRow {
  label: string
  value: string | number
}

interface MetricCardProps {
  title: string
  subtitle?: string
  rows: MetricRow[]
  className?: string
  icon?: React.ReactNode
}

export function MetricCard({ title, subtitle, rows, className, icon }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
      <div className="mt-4 space-y-3">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
          >
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
