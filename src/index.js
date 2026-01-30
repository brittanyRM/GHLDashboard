export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/data") {
      const data = {
        totalLeads: 1234,
        appointments: 56,
        showRate: 78.9,
        revenue: 10651,
        leadSources: [
          { label: "Organic/Direct", count: 4071 },
          { label: "BBBE $249", count: 214 },
          { label: "unlimited tox form", count: 178 }
        ],
        apptTypes: [
          { label: "Bye Bye Baggy Eyes Pipeline", count: 113 },
          { label: "Unlimited Tox Pipeline", count: 96 }
        ],
        topAds: [
          { label: "Organic / Direct", adId: "organic", leads: 3770, appts: 205, convRate: 5.4 },
          { label: "120239497020010029", adId: "120239497020010029", leads: 75, appts: 10, convRate: 13.3 }
        ],
        sms: { total: 118, inbound: 19, outbound: 99, delivered: 118, responseRate: 19.2 },
        calls: { total: 2, inbound: 2, outbound: 0, completed: 2, avgDurationSec: 0 },
        revenueMetrics: { totalRevenue: 10651, transactions: 394, avgTransaction: 27.03, successful: 343 }
      };

      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store"
        }
      });
    }

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Executive Dashboard</title>
  <style>
    :root{
      --bg:#f7f7fb; --card:#fff; --text:#111827; --muted:#6b7280;
      --border:#e5e7eb; --accent:#6d28d9; --shadow:0 10px 25px rgba(0,0,0,.06); --radius:18px;
    }
    *{box-sizing:border-box}
    body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:var(--text);background:var(--bg)}
    .wrap{padding:18px}
    .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
    .card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:16px}
    .kpiTitle{color:var(--muted);font-size:14px;margin-bottom:8px}
    .kpiVal{font-size:32px;font-weight:700}
    .sectionTitle{font-size:18px;font-weight:700;margin-bottom:6px}
    .sectionSub{font-size:13px;color:var(--muted);margin-bottom:10px}
    .row{display:flex;justify-content:space-between;font-size:14px;margin-bottom:4px}
    .bar{height:10px;background:#eee;border-radius:999px;overflow:hidden}
    .bar div{height:100%;background:var(--accent);width:0%;transition:width .4s ease}
    .list{display:flex;flex-direction:column;gap:10px}
    .item{padding:12px;border:1px solid var(--border);border-radius:14px;background:#fff}
    .itemTitle{font-weight:700;margin-bottom:6px}
    .pill{display:inline-block;margin:4px 6px 0 0;padding:6px 10px;border-radius:999px;border:1px solid var(--border);font-size:13px;background:#fafafa}
    .err{padding:14px;border:2px dashed #f00;border-radius:12px;background:#fff}
    @media(max-width:1100px){ .grid4{grid-template-columns:repeat(2,1fr)} .grid2{grid-template-columns:1fr} }
  </style>
</head>
<body>
  <div class="wrap"><div id="app"></div></div>
<script>
(async function(){
  const app = document.getElementById("app");
  try{
    const res = await fetch("/data", { cache: "no-store" });
    const data = await res.json();

    const totalLeads = Number(data.totalLeads)||0;
    const appointments = Number(data.appointments)||0;

    const barRow = (label,count,pct) => \`
      <div class="row"><div>\${label}</div><div>\${count}</div></div>
      <div class="bar"><div style="width:\${pct}%"></div></div>
    \`;

    app.innerHTML = \`
      <div class="grid4">
        <div class="card"><div class="kpiTitle">Total Leads</div><div class="kpiVal">\${totalLeads.toLocaleString()}</div></div>
        <div class="card"><div class="kpiTitle">Appointments</div><div class="kpiVal">\${appointments.toLocaleString()}</div></div>
        <div class="card"><div class="kpiTitle">Show Rate</div><div class="kpiVal">\${Number(data.showRate||0).toFixed(1)}%</div></div>
        <div class="card"><div class="kpiTitle">Revenue</div><div class="kpiVal">$\${Number(data.revenue||0).toLocaleString()}</div></div>
      </div>

      <div class="grid2">
        <div class="card">
          <div class="sectionTitle">Lead Sources</div>
          <div class="sectionSub">By channel</div>
          \${(data.leadSources||[]).map(ls => barRow(ls.label, ls.count, totalLeads ? Math.min(100,(ls.count/totalLeads)*100) : 0)).join("")}
        </div>
        <div class="card">
          <div class="sectionTitle">Appointment Types</div>
          <div class="sectionSub">By pipeline</div>
          \${(data.apptTypes||[]).map(a => barRow(a.label, a.count, appointments ? Math.min(100,(a.count/appointments)*100) : 0)).join("")}
        </div>
      </div>

      <div class="grid2">
        <div class="card">
          <div class="sectionTitle">Top Ads</div>
          <div class="list">
            \${(data.topAds||[]).slice(0,5).map(ad => \`
              <div class="item">
                <div class="itemTitle">\${ad.label || ad.adId || "Ad"}</div>
                <span class="pill">Leads: \${(ad.leads||0).toLocaleString()}</span>
                <span class="pill">Appts: \${(ad.appts||0).toLocaleString()}</span>
                <span class="pill">Conv: \${Number(ad.convRate||0).toFixed(1)}%</span>
              </div>
            \`).join("")}
          </div>
        </div>
        <div class="card">
          <div class="sectionTitle">SMS Metrics</div>
          <div class="row"><div>Total</div><div>\${(data.sms?.total||0).toLocaleString()}</div></div>
          <div class="row"><div>Inbound</div><div>\${(data.sms?.inbound||0).toLocaleString()}</div></div>
          <div class="row"><div>Outbound</div><div>\${(data.sms?.outbound||0).toLocaleString()}</div></div>
          <div class="row"><div>Response Rate</div><div>\${Number(data.sms?.responseRate||0).toFixed(1)}%</div></div>
        </div>
      </div>
    \`;
  } catch(e){
    app.innerHTML = "<div class='err'><strong>Dashboard Error:</strong> Could not load data.</div>";
  }
})();
</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        // ✅ allow embedding in GHL iframe
        "Content-Security-Policy": "frame-ancestors *"
      }
    });
  }
};
