import { NextRequest, NextResponse } from "next/server"

// Shared in-memory store (in production, use a database)
const metricsStore: Record<string, unknown> = {}

// Export for use by ingest route
export { metricsStore }

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-ingest-token",
  }
}

// Demo data to show the dashboard in action
function demoMetrics(range: string) {
  return {
    totalLeads: 1247,
    appointments: 389,
    showRate: 72.5,
    revenue: 148750,
    leadSources: [
      { label: "Facebook Ads", count: 523 },
      { label: "Google Ads", count: 312 },
      { label: "Organic Search", count: 198 },
      { label: "Direct Traffic", count: 124 },
      { label: "Instagram", count: 56 },
      { label: "Referral", count: 34 },
    ],
    apptTypes: [
      { label: "Discovery Call", count: 156 },
      { label: "Strategy Session", count: 98 },
      { label: "Demo Call", count: 72 },
      { label: "Follow-up", count: 45 },
      { label: "Onboarding", count: 18 },
    ],
    topAds: [
      { label: "Summer Sale Campaign", adId: "ad_12345", leads: 156, appts: 67, convRate: 42.9, roi: 285 },
      { label: "Brand Awareness", adId: "ad_23456", leads: 134, appts: 52, convRate: 38.8, roi: 220 },
      { label: "Lead Magnet Promo", adId: "ad_34567", leads: 98, appts: 41, convRate: 41.8, roi: 195 },
      { label: "Retargeting Campaign", adId: "ad_45678", leads: 87, appts: 38, convRate: 43.7, roi: 310 },
      { label: "New Product Launch", adId: "ad_56789", leads: 72, appts: 29, convRate: 40.3, roi: 175 },
    ],
    sms: { total: 3456, inbound: 1234, outbound: 2222, delivered: 3201, responseRate: 35.7 },
    calls: { total: 892, inbound: 312, outbound: 580, completed: 756, avgDurationSec: 287 },
    revenueMetrics: { totalRevenue: 148750, transactions: 89, avgTransaction: 1671, successful: 82 },
    _range: range,
    _updatedAt: new Date().toISOString(),
  }
}

function emptyMetrics(range: string) {
  return {
    totalLeads: 0,
    appointments: 0,
    showRate: 0,
    revenue: 0,
    leadSources: [],
    apptTypes: [],
    topAds: [],
    setters: [],
    calendars: [],
    sms: { total: 0, inbound: 0, outbound: 0, delivered: 0, responseRate: 0 },
    calls: { total: 0, inbound: 0, outbound: 0, completed: 0, avgDurationSec: 0 },
    revenueMetrics: { totalRevenue: 0, transactions: 0, avgTransaction: 0, successful: 0 },
    _range: range,
    _updatedAt: null,
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get("range") || "all"

  const data = metricsStore[`latest_${range}`]

  // Return demo data if no real data exists (for preview purposes)
  if (!data) {
    return NextResponse.json(demoMetrics(range), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...corsHeaders(),
      },
    })
  }

  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(),
    },
  })
}

// POST handler to store metrics (same as ingest)
export async function POST(request: NextRequest) {
  const token = request.headers.get("x-ingest-token") || ""
  const expectedToken = process.env.WORKER_INGEST_TOKEN

  if (expectedToken && token !== expectedToken) {
    return NextResponse.json(
      { error: true, message: "Unauthorized" },
      { status: 401, headers: corsHeaders() }
    )
  }

  const { searchParams } = new URL(request.url)
  const range = searchParams.get("range") || "all"

  let payload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: true, message: "Invalid JSON payload" },
      { status: 400, headers: corsHeaders() }
    )
  }

  const record = {
    ...payload,
    _range: range,
    _updatedAt: new Date().toISOString(),
  }

  metricsStore[`latest_${range}`] = record

  return NextResponse.json(
    { ok: true, storedKey: `latest_${range}`, updatedAt: record._updatedAt },
    { status: 200, headers: corsHeaders() }
  )
}
