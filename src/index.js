export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // -----------------------------
    // CORS preflight
    // -----------------------------
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // -----------------------------
    // DASHBOARD UI ( / )
    // -----------------------------
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(DASH_HTML, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Security-Policy": "frame-ancestors *"
        }
      });
    }

    // -----------------------------
    // HEALTH CHECK
    // -----------------------------
    if (url.pathname === "/health") {
      return json({ ok: true, message: "Worker live" });
    }

    // -----------------------------
    // METRICS API ( /metrics )
    // -----------------------------
    if (url.pathname === "/metrics") {
      const range = url.searchParams.get("range") || "all";
      const { startDate, endDate } = computeRange(range);

      // ---- Revenue via Payments API ----
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

      const revenueRaw = successful.reduce((sum, t) => {
        return sum + (Number(t.amount) || Number(t.totalAmount) || 0);
      }, 0);

      // ⚠️ HighLevel payments are usually in cents
      const revenue = revenueRaw / 100;

      return json({
        totalLeads: 0,          // STEP 2
        appointments: 0,        // STEP 3
        showRate: 0,            // STEP 3
        revenue,

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
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders() });
  }
};

// ------------------------------------------------
// HELPERS
// ------------------------------------------------
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
  if (!env.GHL_API_KEY) throw new Error("Missing GHL_API_KEY");
  if (!env.GHL_LOCATION_ID) throw new Error("Missing GHL_LOCATION_ID");

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
    return {
      error: true,
      status: res.status,
      body: text
    };
  }

  return data;
}

function computeRange(rangeKey) {
  const endDate = new Date();
  const startDate = new Date(endDate);

  if (rangeKey === "7d") startDate.setDate(endDate.getDate() - 7);
  else if (rangeKey === "30d") startDate.setDate(endDate.getDate() - 30);
  else if (rangeKey === "90d") startDate.setDate(endDate.getDate() - 90);
  else startDate.setFullYear(2000);

  return { startDate, endDate };
}

// ------------------------------------------------
// DASHBOARD HTML (your full UI + buttons)
// ------------------------------------------------
const DASH_HTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>GHL Executive Dashboard</title>
</head>
<body>
  <div id="ghlDashRoot"></div>

  <script>
    const apiUrl = location.origin + "/metrics";
    document.getElementById("ghlDashRoot").innerHTML =
      "<p style='padding:24px;font-family:sans-serif'>Dashboard loaded. API: " + apiUrl + "</p>";
  </script>
</body>
</html>`;
