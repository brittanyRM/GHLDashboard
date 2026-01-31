"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  icon?: React.ReactNode
  className?: string
}

export function KPICard({ title, value, subtitle, trend, icon, className }: KPICardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendColor = () => {
    if (trend === undefined || trend === null) return ""
    if (trend > 0) return "text-emerald-500"
    if (trend < 0) return "text-red-500"
    return "text-muted-foreground"
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
        {trend !== undefined && trend !== null && (
          <span className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
            {getTrendIcon()}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}
