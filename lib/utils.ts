import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number | undefined | null): string {
  return (Number(n) || 0).toLocaleString()
}

export function formatMoney(n: number | undefined | null): string {
  return (Number(n) || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  })
}

export function formatPercent(n: number | undefined | null): string {
  return `${(Number(n) || 0).toFixed(1)}%`
}

export function formatDuration(seconds: number | undefined | null): string {
  const sec = Number(seconds) || 0
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

export function clampPercent(n: number | undefined | null): number {
  const num = Number(n) || 0
  return Math.max(0, Math.min(100, num))
}

export function percentOf(part: number, total: number): number {
  if (!total) return 0
  return clampPercent((Number(part) || 0) / total * 100)
}
