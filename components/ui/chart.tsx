"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Chart container and config
export type ChartConfig = {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {}
    Object.entries(config).forEach(([key, value]) => {
      vars[`--color-${key}`] = value.color
    })
    return vars
  }, [config])

  return (
    <div
      className={cn("", className)}
      style={cssVars as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  )
}

// Tooltip components
interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: number
    color?: string
    name?: string
  }>
  label?: string
  hideLabel?: boolean
  formatter?: (value: number, name: string) => string
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  formatter,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      {!hideLabel && label && (
        <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}:</span>
            <span className="font-medium text-foreground">
              {formatter ? formatter(item.value, item.name || "") : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartTooltip(props: React.ComponentProps<"div">) {
  return <ChartTooltipContent {...(props as ChartTooltipContentProps)} />
}
