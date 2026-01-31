"use client"

import { useState } from "react"
import { useMetrics } from "@/hooks/use-metrics"
import { KPICard } from "./kpi-card"
import { SectionCard } from "./section-card"
import { ProgressBar } from "./progress-bar"
import { MetricCard } from "./metric-card"
import { AdCard } from "./ad-card"
import { RangeSelector } from "./range-selector"
import { EmptyState } from "./empty-state"
import { LeadsChart } from "./leads-chart"
import { CallsChart } from "./calls-chart"
import type { TimeRange } from "@/lib/types"
import {
  formatNumber,
  formatMoney,
  formatPercent,
  formatDuration,
  percentOf,
} from "@/lib/utils"
import {
  Users,
  CalendarCheck,
  TrendingUp,
  DollarSign,
  Phone,
  MessageSquare,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart,
} from "lucide-react"

export function Dashboard() {
  const [range, setRange] = useState<TimeRange>("all")
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "ads" | "calls">("overview")
  const { data, isLoading, refresh } = useMetrics(range)

  const totalLeadSourceCount = data?.leadSources?.reduce(
    (a, x) => a + (Number(x.count) || 0),
    0
  ) || 0

  const totalApptTypeCount = data?.apptTypes?.reduce(
    (a, x) => a + (Number(x.count) || 0),
    0
  ) || 0

  const updatedAt = data?._updatedAt
    ? new Date(data._updatedAt).toLocaleString()
    : "Never"

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "leads", label: "Leads" },
    { key: "ads", label: "Ad Performance" },
    { key: "calls", label: "Calls & SMS" },
  ] as const

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              GHL Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Last updated: {updatedAt}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RangeSelector value={range} onChange={setRange} />
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* KPI Cards */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Leads"
            value={formatNumber(data?.totalLeads)}
            subtitle="All sources combined"
            icon={<Users className="h-5 w-5" />}
          />
          <KPICard
            title="Appointments"
            value={formatNumber(data?.appointments)}
            subtitle="Booked appointments"
            icon={<CalendarCheck className="h-5 w-5" />}
          />
          <KPICard
            title="Show Rate"
            value={formatPercent(data?.showRate)}
            subtitle="Showed / Booked"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KPICard
            title="Total Revenue"
            value={formatMoney(data?.revenue)}
            subtitle="All transactions"
            icon={<DollarSign className="h-5 w-5" />}
          />
        </section>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Lead Sources & Appointment Types */}
            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <SectionCard
                title="Lead Sources by Channel"
                subtitle="Distribution of leads by marketing channel"
                headerAction={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
              >
                {data?.leadSources && data.leadSources.length > 0 ? (
                  <div className="space-y-4">
                    {data.leadSources.slice(0, 6).map((source, i) => (
                      <ProgressBar
                        key={i}
                        label={source.label}
                        value={formatNumber(source.count)}
                        percentage={percentOf(source.count, totalLeadSourceCount)}
                        color={i === 0 ? "bg-primary" : i === 1 ? "bg-chart-2" : i === 2 ? "bg-chart-3" : "bg-chart-4"}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No lead source data yet" />
                )}
              </SectionCard>

              <SectionCard
                title="Appointment Types"
                subtitle="Distribution by pipeline or type"
                headerAction={<PieChart className="h-5 w-5 text-muted-foreground" />}
              >
                {data?.apptTypes && data.apptTypes.length > 0 ? (
                  <div className="space-y-4">
                    {data.apptTypes.slice(0, 6).map((appt, i) => (
                      <ProgressBar
                        key={i}
                        label={appt.label}
                        value={`${formatNumber(appt.count)} (${formatPercent(percentOf(appt.count, totalApptTypeCount))})`}
                        percentage={percentOf(appt.count, totalApptTypeCount)}
                        color={i === 0 ? "bg-chart-4" : i === 1 ? "bg-chart-5" : i === 2 ? "bg-primary" : "bg-chart-2"}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No appointment type data yet" />
                )}
              </SectionCard>
            </section>

            {/* Quick Metrics */}
            <section className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Total Calls
                </div>
                <div className="mt-2 text-2xl font-bold">{formatNumber(data?.calls?.total)}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Total SMS
                </div>
                <div className="mt-2 text-2xl font-bold">{formatNumber(data?.sms?.total)}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Avg Call Duration
                </div>
                <div className="mt-2 text-2xl font-bold">{formatDuration(data?.calls?.avgDurationSec)}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Avg Transaction
                </div>
                <div className="mt-2 text-2xl font-bold">{formatMoney(data?.revenueMetrics?.avgTransaction)}</div>
              </div>
            </section>
          </>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Lead Sources Chart"
              subtitle="Visual breakdown of lead sources"
            >
              {data?.leadSources && data.leadSources.length > 0 ? (
                <LeadsChart data={data.leadSources} />
              ) : (
                <EmptyState message="No lead source data yet" />
              )}
            </SectionCard>

            <SectionCard
              title="Lead Source Details"
              subtitle="Complete breakdown by source"
            >
              {data?.leadSources && data.leadSources.length > 0 ? (
                <div className="space-y-3">
                  {data.leadSources.map((source, i) => (
                    <ProgressBar
                      key={i}
                      label={source.label}
                      value={formatNumber(source.count)}
                      percentage={percentOf(source.count, totalLeadSourceCount)}
                      color={i % 5 === 0 ? "bg-primary" : i % 5 === 1 ? "bg-chart-2" : i % 5 === 2 ? "bg-chart-3" : i % 5 === 3 ? "bg-chart-4" : "bg-chart-5"}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No lead source data yet" />
              )}
            </SectionCard>

            <SectionCard
              title="Appointments by Type"
              subtitle="All appointment categories"
              className="lg:col-span-2"
            >
              {data?.apptTypes && data.apptTypes.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.apptTypes.map((appt, i) => (
                    <div key={i} className="rounded-lg border border-border bg-secondary/30 p-4">
                      <div className="text-sm text-muted-foreground">{appt.label}</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{formatNumber(appt.count)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({formatPercent(percentOf(appt.count, totalApptTypeCount))})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No appointment type data yet" />
              )}
            </SectionCard>
          </section>
        )}

        {/* Ads Tab */}
        {activeTab === "ads" && (
          <section className="mt-6">
            <SectionCard
              title="Top Performing Ads"
              subtitle="Best ads by lead volume and conversion rate"
            >
              {data?.topAds && data.topAds.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.topAds.map((ad, i) => (
                    <AdCard key={i} ad={ad} rank={i + 1} />
                  ))}
                </div>
              ) : (
                <EmptyState message="No ad data yet" />
              )}
            </SectionCard>
          </section>
        )}

        {/* Calls & SMS Tab */}
        {activeTab === "calls" && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Call Distribution"
              subtitle="Inbound vs Outbound calls"
            >
              {data?.calls && (data.calls.inbound > 0 || data.calls.outbound > 0) ? (
                <CallsChart data={data.calls} />
              ) : (
                <EmptyState message="No call data yet" />
              )}
            </SectionCard>

            <MetricCard
              title="Call Metrics"
              rows={[
                { label: "Total Calls", value: formatNumber(data?.calls?.total) },
                { label: "Inbound", value: formatNumber(data?.calls?.inbound) },
                { label: "Outbound", value: formatNumber(data?.calls?.outbound) },
                { label: "Completed", value: formatNumber(data?.calls?.completed) },
                { label: "Avg Duration", value: formatDuration(data?.calls?.avgDurationSec) },
              ]}
            />

            <MetricCard
              title="SMS Metrics"
              rows={[
                { label: "Total Texts", value: formatNumber(data?.sms?.total) },
                { label: "Inbound", value: formatNumber(data?.sms?.inbound) },
                { label: "Outbound", value: formatNumber(data?.sms?.outbound) },
                { label: "Delivered", value: formatNumber(data?.sms?.delivered) },
                { label: "Response Rate", value: formatPercent(data?.sms?.responseRate) },
              ]}
            />

            <MetricCard
              title="Revenue Metrics"
              rows={[
                { label: "Total Revenue", value: formatMoney(data?.revenueMetrics?.totalRevenue ?? data?.revenue ?? 0) },
                { label: "Transactions", value: formatNumber(data?.revenueMetrics?.transactions) },
                { label: "Avg Transaction", value: formatMoney(data?.revenueMetrics?.avgTransaction) },
                { label: "Successful", value: formatNumber(data?.revenueMetrics?.successful) },
              ]}
            />
          </section>
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            GHL Dashboard - Real-time analytics from GoHighLevel
          </p>
        </footer>
      </div>
    </div>
  )
}
