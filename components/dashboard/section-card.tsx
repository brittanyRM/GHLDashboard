"use client"

import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}

export function SectionCard({
  title,
  subtitle,
  children,
  className,
  headerAction,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {headerAction}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}
