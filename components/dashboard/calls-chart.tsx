"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import type { CallMetrics } from "@/lib/types"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { formatNumber } from "@/lib/utils"

interface CallsChartProps {
  data: CallMetrics
}

const COLORS = [
  "hsl(199, 89%, 48%)", // Inbound - blue
  "hsl(263, 70%, 50%)", // Outbound - primary
]

export function CallsChart({ data }: CallsChartProps) {
  const chartData = [
    { name: "Inbound", value: data.inbound },
    { name: "Outbound", value: data.outbound },
  ].filter(item => item.value > 0)

  const config = {
    inbound: { label: "Inbound", color: COLORS[0] },
    outbound: { label: "Outbound", color: COLORS[1] },
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No call data available
      </div>
    )
  }

  return (
    <ChartContainer config={config} className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => (
              <ChartTooltipContent
                active={active}
                payload={payload?.map((p) => ({
                  dataKey: p.dataKey as string,
                  value: p.value as number,
                  name: p.name as string,
                  color: COLORS[chartData.findIndex(d => d.name === p.name) % COLORS.length],
                }))}
                formatter={(value) => formatNumber(value)}
              />
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
