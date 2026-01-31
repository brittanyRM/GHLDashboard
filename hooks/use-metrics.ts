"use client"

import useSWR from "swr"
import type { DashboardMetrics, TimeRange } from "@/lib/types"

const fetcher = async (url: string): Promise<DashboardMetrics> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch metrics")
  return res.json()
}

export function useMetrics(range: TimeRange = "all") {
  const { data, error, isLoading, mutate } = useSWR<DashboardMetrics>(
    `/api/metrics?range=${range}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  )

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}
