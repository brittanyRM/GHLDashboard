"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { LeadSource } from "@/lib/types"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface LeadsChartProps {
  data: LeadSource[]
}

// Colors for the bars - using HSL values directly
const COLORS = [
  "hsl(263, 70%, 50%)", // primary
  "hsl(199, 89%, 48%)", // chart-2
  "hsl(142, 71%, 45%)", // chart-3
  "hsl(43, 96%, 56%)",  // chart-4
  "hsl(350, 89%, 60%)", // chart-5
  "hsl(263, 70%, 65%)",
  "hsl(199, 89%, 58%)",
  "hsl(142, 71%, 55%)",
]

export function LeadsChart({ data }: LeadsChartProps) {
  const chartData = data.slice(0, 8).map((source) => ({
    name: source.label,
    value: source.count,
  }))

  const config = chartData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <ChartContainer config={config} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            content={({ active, payload, label }) => (
              <ChartTooltipContent
                active={active}
                payload={payload?.map((p) => ({
                  dataKey: p.dataKey as string,
                  value: p.value as number,
                  name: "Leads",
                  color: p.payload?.fill,
                }))}
                label={label}
              />
            )}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
