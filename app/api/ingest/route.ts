import { NextRequest, NextResponse } from "next/server"

// In-memory store (in production, use a database like Upstash Redis or Vercel KV)
const metricsStore: Record<string, unknown> = {}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-ingest-token",
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() })
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-ingest-token") || ""
  const expectedToken = process.env.WORKER_INGEST_TOKEN

  if (!expectedToken) {
    return NextResponse.json(
      { error: true, message: "Missing WORKER_INGEST_TOKEN environment variable" },
      { status: 500, headers: corsHeaders() }
    )
  }

  if (token !== expectedToken) {
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
