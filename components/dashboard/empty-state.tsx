"use client"

import { cn } from "@/lib/utils"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  message?: string
  className?: string
}

export function EmptyState({ message = "No data available", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center",
        className
      )}
    >
      <Inbox className="h-10 w-10 text-muted-foreground/50" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
