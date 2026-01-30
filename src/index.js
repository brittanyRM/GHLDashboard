export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---- CORS preflight ----
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // ---- Health check ----
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, message: "Worker is live" });
    }

    // ---- Metrics endpoint ----
    if (url.pathname === "/metrics") {
      const range = url.searchParams.get("range") || "all";
      const { startDate, endDate } = computeRange(range);

      // Pull transactions (revenue)
      const tx = await ghlGet(
        `https://services.leadconnectorhq.com/payments/transactions?` +
          new URLSearchParams({
            locationId: env.GHL_LOCATION_ID,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: "100"
          }),
        env
      );

      const items =
        tx?.transactions ||
        tx?.data?.transactions ||
        tx?.data ||
        [];

      const successful = items.filter(t => {
        const s = String(t.status || t.transactionStatus || "").toLowerCase();
        return s.includes("success") || s.includes("paid") || s.includes("completed");
      });

      // Many payment APIs return cents. If your result looks 100x too big/small, we’ll adjust.
      const revenueRaw = successful.reduce((sum, t) => {
        return sum + (Number(t.amount) || Number(t.totalAmount) || 0);
      }, 0);

      // Default assumption: cents -> dollars
      const revenue = revenueRaw / 100;

      const body = {
        totalLeads: 0,
        appointments: 0,
        showRate: 0,
        revenue: revenue,

        leadSources: [],
        apptTypes: [],
        topAds: [],

        sms: { total: 0, inbound: 0, outbound: 0, delivered: 0, responseRate: 0 },
        calls: { total: 0, inbound: 0, outbound: 0, completed: 0, avgDurationSec: 0 },

        revenueMetrics: {
          totalRevenue: revenue,
          transactions: items.length,
          avgTransaction: items.length ? revenue / items.length : 0,
          successful: successful.length
        }
      };

      return json(body);
    }

    return new Response("Not found", { status: 404, headers: corsHeaders() });
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}

async function ghlGet(url, env) {
  if (!env.GHL_API_KEY) throw new Error("Missing GHL_API_KEY secret");
  if (!env.GHL_LOCATION_ID) throw new Error("Missing GHL_LOCATION_ID secret");

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${env.GHL_API_KEY}`,
      "Content-Type": "application/json"
    }
  });

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}

  if (!res.ok) {
    return json({
      ok: false,
      error: `GHL error ${res.status}`,
      details: text
    });
  }

  return data;
}

function computeRange(rangeKey) {
  const endDate = new Date();
  const startDate = new Date(endDate);

  if (rangeKey === "7d") startDate.setDate(endDate.getDate() - 7);
  else if (rangeKey === "30d") startDate.setDate(endDate.getDate() - 30);
  else if (rangeKey === "90d") startDate.setDate(endDate.getDate() - 90);
  else startDate.setFullYear(2000); // all time

  return { startDate, endDate };
}
