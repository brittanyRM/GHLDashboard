export interface LeadSource {
  label: string
  count: number
}

export interface AppointmentType {
  label: string
  count: number
}

export interface TopAd {
  label: string
  adId: string
  leads: number
  appts: number
  convRate: number
  roi: number | null
}

export interface SetterStats {
  label: string
  count: number
  calls?: number
  bookedRate?: number
}

export interface CalendarStats {
  label: string
  count: number
}

export interface SMSMetrics {
  total: number
  inbound: number
  outbound: number
  delivered: number
  responseRate: number
}

export interface CallMetrics {
  total: number
  inbound: number
  outbound: number
  completed: number
  avgDurationSec: number
}

export interface RevenueMetrics {
  totalRevenue: number
  transactions: number
  avgTransaction: number
  successful: number
}

export interface DashboardMetrics {
  totalLeads: number
  appointments: number
  showRate: number
  revenue: number
  leadSources: LeadSource[]
  apptTypes: AppointmentType[]
  topAds: TopAd[]
  setters?: SetterStats[]
  calendars?: CalendarStats[]
  sms: SMSMetrics
  calls: CallMetrics
  revenueMetrics: RevenueMetrics
  _range: string
  _updatedAt: string | null
}

export type TimeRange = "all" | "7d" | "30d" | "90d"

export interface RangeOption {
  key: TimeRange
  label: string
}

export const RANGE_OPTIONS: RangeOption[] = [
  { key: "all", label: "All Time" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
]
