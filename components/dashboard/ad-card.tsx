"use client"

import { cn } from "@/lib/utils"
import type { TopAd } from "@/lib/types"
import { formatNumber, formatPercent } from "@/lib/utils"

interface AdCardProps {
  ad: TopAd
  rank: number
  className?: string
}

export function AdCard({ ad, rank, className }: AdCardProps) {
  const conv = ad.convRate ?? (ad.leads ? (ad.appts / ad.leads) * 100 : 0)
  const roi = ad.roi !== null ? formatPercent(ad.roi) : "N/A"

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/50 p-4 transition-colors hover:bg-card",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {rank}
            </span>
            <h4 className="truncate font-semibold text-foreground">
              {ad.label || ad.adId || "Unknown Ad"}
            </h4>
          </div>
          {ad.adId && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Ad ID: {ad.adId}
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium">
          ROI: <span className="font-bold">{roi}</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Leads</div>
          <div className="mt-0.5 font-bold text-foreground">{formatNumber(ad.leads)}</div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Appts</div>
          <div className="mt-0.5 font-bold text-foreground">{formatNumber(ad.appts)}</div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Conv Rate</div>
          <div className="mt-0.5 font-bold text-foreground">{formatPercent(conv)}</div>
        </div>
      </div>
    </div>
  )
}
