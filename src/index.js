export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // Health
    if (url.pathname === "/health") {
      return json({ ok: true, service: "ghl-metrics" });
    }

    // POST /ingest?range=all|7d|30d|90d
    if (url.pathname === "/ingest" && request.method === "POST") {
      const token = request.headers.get("x-ingest-token") || "";

      if (!env.WORKER_INGEST_TOKEN) {
        return json({ error: true, message: "Missing WORKER_INGEST_TOKEN secret" }, 500);
      }
      if (!env.METRICS_KV) {
        return json({ error: true, message: "Missing KV binding METRICS_KV" }, 500);
      }
      if (token !== env.WORKER_INGEST_TOKEN) {
        return json({ error: true, message: "Unauthorized" }, 401);
      }

      const range = url.searchParams.get("range") || "all";

      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: true, message: "Invalid JSON payload" }, 400);
      }

      const record = { ...payload, _range: range, _updatedAt: new Date().toISOString() };
      await env.METRICS_KV.put(`latest_${range}`, JSON.stringify(record));

      return json({ ok: true, storedKey: `latest_${range}` });
    }

    // GET /metrics?range=all|7d|30d|90d
    if (url.pathname === "/metrics" && request.method === "GET") {
      if (!env.METRICS_KV) {
        return json({ error: true, message: "Missing KV binding METRICS_KV" }, 500);
      }

      const range = url.searchParams.get("range") || "all";
      const data = await env.METRICS_KV.get(`latest_${range}`);

      if (!data) return json(emptyMetrics(range));

      return new Response(data, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          ...corsHeaders()
        }
      });
    }

    // GET / -> serve UI
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(dashboardHtml(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders() });
  }
};

/**********************
 * Helpers
 **********************/
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-ingest-token"
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders()
    }
  });
}

function emptyMetrics(range) {
  return {
    totalLeads: 0,
    appointments: 0,
    showRate: 0,
    revenue: 0,
    leadSources: [],
    apptTypes: [],
    topAds: [],
    sms: { total:0, inbound:0, outbound:0, delivered:0, responseRate:0 },
    calls: { total:0, inbound:0, outbound:0, completed:0, avgDurationSec:0 },
    revenueMetrics: { totalRevenue:0, transactions:0, avgTransaction:0, successful:0 },
    _range: range,
    _updatedAt: null
  };
}

/**********************
 * FULL DASHBOARD UI (with buttons + tabs)
 **********************/
function dashboardHtml() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>GHL Dashboard</title>
  <style>
    :root{
      --bg:#f7f7fb;
      --card:#ffffff;
      --text:#111827;
      --muted:#6b7280;
      --border:#e5e7eb;
      --accent:#6d28d9;
      --shadow: 0 10px 25px rgba(0,0,0,0.06);
      --radius: 18px;
    }
    *{box-sizing:border-box}
    body{margin:0;background:#fff}
    #ghlDashRoot{
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
      color:var(--text);
      background:transparent;
    }
    .dash{
      padding: 18px;
      background: var(--bg);
      border-radius: var(--radius);
      min-height: 100vh;
    }
    .topbar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px;}
    .chipRow{display:flex; gap:10px; flex-wrap:wrap;}
    .chip{
      background:var(--card);
      border:1px solid var(--border);
      padding:10px 14px;
      border-radius:999px;
      box-shadow:0 2px 10px rgba(0,0,0,0.03);
      font-size:14px;
      display:flex;
      gap:10px;
      align-items:center;
      cursor:pointer;
      user-select:none;
      white-space:nowrap;
    }
    .chip.active{border-color: rgba(109,40,217,0.35); box-shadow: 0 6px 20px rgba(109,40,217,0.10);}
    .chip small{color:var(--muted)}
    .range{display:flex; gap:8px; align-items:center;}
    .range select{
      background:var(--card);
      border:1px solid var(--border);
      border-radius:999px;
      padding:10px 12px;
      font-size:14px;
      outline:none;
    }

    .grid4{display:grid;grid-template-columns: repeat(4, minmax(0, 1fr));gap:14px;margin-bottom:14px;}
    .card{
      background:var(--card);
      border:1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding:16px;
      min-height:96px;
    }
    .kpiTitle{display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:14px;margin-bottom:12px;}
    .kpiVal{font-size:34px;font-weight:700;letter-spacing:-0.02em;}
    .kpiSub{margin-top:6px;color:var(--muted);font-size:13px;}

    .tabs{display:flex;gap:8px;margin: 6px 0 14px;flex-wrap:wrap;}
    .tab{padding:10px 14px;border-radius:999px;border:1px solid var(--border);background:var(--card);font-size:14px;cursor:pointer;}
    .tab.active{border-color: rgba(109,40,217,0.35);}

    .grid2{display:grid;grid-template-columns: 1fr 1fr;gap:14px;margin-bottom:14px;}
    .sectionTitle{font-size:18px;font-weight:700;margin: 0 0 6px 0;}
    .sectionSub{color:var(--muted);font-size:13px;margin: 0 0 12px 0;}

    .row{display:flex;justify-content:space-between;gap:12px;margin: 10px 0 6px;font-size:14px;}
    .bar{width:100%;height:10px;background:#f1f2f6;border-radius:999px;overflow:hidden;border:1px solid #eee;}
    .bar > div{height:100%;background: var(--accent);border-radius:999px;width:0%;transition: width .35s ease;}

    .list{display:flex;flex-direction:column;gap:12px;margin-top:10px;}
    .item{padding:12px;border:1px solid var(--border);border-radius:16px;background:#fff;}
    .itemTop{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;}
    .itemTitle{font-weight:700}
    .itemMeta{color:var(--muted); font-size:13px}
    .itemGrid{display:grid;grid-template-columns: repeat(3, minmax(0, 1fr));gap:10px;font-size:13px;}
    .pill{display:inline-flex;gap:6px;align-items:center;padding:6px 10px;border-radius:999px;border:1px solid var(--border);background:#fafafa;}

    .gridBottom{display:grid;grid-template-columns: 1fr 1fr;gap:14px;}

    @media (max-width: 1100px){
      .grid4{grid-template-columns: repeat(2, minmax(0,1fr));}
      .grid2{grid-template-columns: 1fr;}
      .gridBottom{grid-template-columns: 1fr;}
    }
  </style>
</head>
<body>
  <div id="ghlDashRoot"></div>

  <script>
  (() => {
    const root = document.getElementById("ghlDashRoot");
    const API_BASE = "/metrics";

    const RANGE_OPTIONS = [
      { key: "all", label: "All Time" },
      { key: "7d", label: "Last 7 days" },
      { key: "30d", label: "Last 30 days" },
      { key: "90d", label: "Last 90 days" },
    ];

    const navButtons = [
      { key:"fb", label:"Facebook Insights" },
      { key:"leads", label:"Lead Tracker" },
      { key:"adid", label:"By Ad ID" },
      { key:"setter", label:"Setter Performance" },
    ];

    const tabs = ["Overview","Pipelines","Leads","Appointments"];

    const state = { view:"fb", tab:"Overview", range:"all", data:null };

    function fmtInt(n){ return (Number(n)||0).toLocaleString(); }
    function fmtMoney(n){ return (Number(n)||0).toLocaleString(undefined,{style:"currency",currency:"USD"}); }
    function clampPct(n){ n = Number(n)||0; return Math.max(0, Math.min(100, n)); }
    function percentOf(part, total){ if(!total) return 0; return clampPct((Number(part)||0)/total*100); }
    function labelForRange(key){ const f = RANGE_OPTIONS.find(x=>x.key===key); return f ? f.label : "All Time"; }

    function escapeHtml(str){
      return String(str).replace(/[&<>'"]/g, c => ({
        "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
      }[c]));
    }

    function emptyState(text){
      return '<div style="color:var(--muted); font-size:14px; padding:12px; border:1px dashed var(--border); border-radius:16px; background:#fafafa;">' +
        escapeHtml(text) + '</div>';
    }

    function formatDuration(seconds){
      seconds = Number(seconds)||0;
      const m = Math.floor(seconds/60);
      const s = seconds % 60;
      return m + "m " + s + "s";
    }

    function kpiCard(title, value, sub){
      return (
        '<div class="card">' +
          '<div class="kpiTitle"><span>' + escapeHtml(title) + '</span><span></span></div>' +
          '<div class="kpiVal">' + escapeHtml(value) + '</div>' +
          '<div class="kpiSub">' + escapeHtml(sub) + '</div>' +
        '</div>'
      );
    }

    function metricLines(rows){
      return (
        '<div style="display:flex; flex-direction:column; gap:10px; margin-top:8px;">' +
          rows.map(([k,v]) =>
            '<div style="display:flex; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid #f2f2f5;">' +
              '<div style="color:var(--muted)">' + escapeHtml(String(k)) + ':</div>' +
              '<div style="font-weight:700">' + escapeHtml(String(v)) + '</div>' +
            '</div>'
          ).join("") +
        '</div>'
      );
    }

    function progressRow(label, countText, pct){
      return (
        '<div class="row">' +
          '<div>' + escapeHtml(label) + '</div>' +
          '<div style="color:var(--muted)">' + escapeHtml(String(countText)) + '</div>' +
        '</div>' +
        '<div class="bar"><div data-pct="' + clampPct(pct) + '"></div></div>'
      );
    }

    function adCard(ad, rank){
      const leads = Number(ad.leads)||0;
      const appts = Number(ad.appts)||0;
      const conv = clampPct(ad.convRate || (leads ? (appts/leads*100) : 0));
      const roi = (ad.roi==null) ? "—" : (clampPct(ad.roi).toFixed(1) + "%");

      return (
        '<div class="item">' +
          '<div class="itemTop">' +
            '<div>' +
              '<div class="itemTitle">#' + rank + ' ' + escapeHtml(ad.label || ad.adId || "Unknown") + '</div>' +
              '<div class="itemMeta">' + escapeHtml(ad.adId ? ("Ad ID: " + ad.adId) : "") + '</div>' +
            '</div>' +
            '<div class="pill">ROI: <strong style="margin-left:6px">' + escapeHtml(roi) + '</strong></div>' +
          '</div>' +
          '<div class="itemGrid">' +
            '<div class="pill">Leads: <strong style="margin-left:6px">' + fmtInt(leads) + '</strong></div>' +
            '<div class="pill">Appts: <strong style="margin-left:6px">' + fmtInt(appts) + '</strong></div>' +
            '<div class="pill">Conv Rate: <strong style="margin-left:6px">' + conv.toFixed(1) + '%</strong></div>' +
          '</div>' +
        '</div>'
      );
    }

    async function loadData(rangeKey){
      try{
        const res = await fetch(API_BASE + "?range=" + encodeURIComponent(rangeKey), { credentials: "omit" });
        if(!res.ok) throw new Error("bad response");
        return await res.json();
      }catch(e){
        console.warn("Metrics fetch failed:", e);
        return null;
      }
    }

    function animateBars(){
      document.querySelectorAll(".bar > div").forEach(el=>{
        el.style.width = (el.getAttribute("data-pct") || "0") + "%";
      });
    }

    function wireEvents(){
      const rangeSel = document.getElementById("rangeSel");
      if(rangeSel){
        rangeSel.onchange = async (e) => {
          state.range = e.target.value;
          state.data = await loadData(state.range);
          render();
        };
      }
      document.querySelectorAll("[data-view]").forEach(el=>{
        el.onclick = () => { state.view = el.getAttribute("data-view"); render(); };
      });
      document.querySelectorAll("[data-tab]").forEach(el=>{
        el.onclick = () => { state.tab = el.getAttribute("data-tab"); render(); };
      });
    }

    function render(){
      const d = state.data || {
        totalLeads: 0, appointments: 0, showRate: 0, revenue: 0,
        leadSources: [], apptTypes: [], topAds: [],
        sms: { total:0, inbound:0, outbound:0, delivered:0, responseRate:0 },
        calls: { total:0, inbound:0, outbound:0, completed:0, avgDurationSec:0 },
        revenueMetrics: { totalRevenue:0, transactions:0, avgTransaction:0, successful:0 }
      };

      const leadSources = Array.isArray(d.leadSources) ? d.leadSources : [];
      const apptTypes = Array.isArray(d.apptTypes) ? d.apptTypes : [];
      const topAds = Array.isArray(d.topAds) ? d.topAds : [];

      const totalLeadSourceCount = leadSources.reduce((a,x)=>a+(Number(x.count)||0),0);
      const totalApptTypeCount = apptTypes.reduce((a,x)=>a+(Number(x.count)||0),0);

      root.innerHTML =
        '<div class="dash">' +
          '<div class="topbar">' +
            '<div class="range">' +
              '<div class="chip"><small>📅</small> <strong>' + escapeHtml(labelForRange(state.range)) + '</strong></div>' +
              '<select id="rangeSel">' +
                RANGE_OPTIONS.map(o => '<option value="' + o.key + '" ' + (o.key===state.range?'selected':'') + '>' + o.label + '</option>').join('') +
              '</select>' +
            '</div>' +
            '<div class="chipRow">' +
              navButtons.map(b =>
                '<div class="chip ' + (state.view===b.key?'active':'') + '" data-view="' + b.key + '">' +
                  '<strong>' + escapeHtml(b.label) + '</strong>' +
                '</div>'
              ).join('') +
            '</div>' +
          '</div>' +

          '<div class="grid4">' +
            kpiCard("Total Leads", fmtInt(d.totalLeads), labelForRange(state.range)) +
            kpiCard("Appointments", fmtInt(d.appointments), labelForRange(state.range)) +
            kpiCard("Show Rate", clampPct(d.showRate).toFixed(1) + "%", "Showed / Booked") +
            kpiCard("Total Revenue", fmtMoney(d.revenue), labelForRange(state.range)) +
          '</div>' +

          '<div class="tabs">' +
            tabs.map(t => '<div class="tab ' + (state.tab===t?'active':'') + '" data-tab="' + t + '">' + t + '</div>').join('') +
          '</div>' +

          '<div class="grid2">' +
            '<div class="card">' +
              '<p class="sectionTitle">Lead Sources by Channel</p>' +
              '<p class="sectionSub">Distribution of leads by marketing channel</p>' +
              (leadSources.length
                ? leadSources.slice(0,8).map(ls => progressRow(ls.label, ls.count, percentOf(ls.count, totalLeadSourceCount))).join('')
                : emptyState("No lead source data yet.")) +
            '</div>' +
            '<div class="card">' +
              '<p class="sectionTitle">Appointment Types</p>' +
              '<p class="sectionSub">Distribution of appointments by pipeline/type</p>' +
              (apptTypes.length
                ? apptTypes.slice(0,8).map(a => progressRow(a.label, a.count + " (" + percentOf(a.count,totalApptTypeCount).toFixed(1) + "%)", percentOf(a.count,totalApptTypeCount))).join('')
                : emptyState("No appointment type data yet.")) +
            '</div>' +
          '</div>' +

          '<div class="grid2">' +
            '<div class="card">' +
              '<p class="sectionTitle">Top Performing Ads</p>' +
              '<p class="sectionSub">Best ads by lead volume</p>' +
              '<div class="list">' +
                (topAds.length ? topAds.slice(0,5).map((ad, idx)=>adCard(ad, idx+1)).join("") : emptyState("No ad data yet.")) +
              '</div>' +
            '</div>' +
            '<div class="card">' +
              '<p class="sectionTitle">Text/SMS Metrics</p>' +
              '<p class="sectionSub">&nbsp;</p>' +
              metricLines([
                ["Total Texts", d.sms?.total ?? 0],
                ["Inbound", d.sms?.inbound ?? 0],
                ["Outbound", d.sms?.outbound ?? 0],
                ["Delivered", d.sms?.delivered ?? 0],
                ["Response Rate", clampPct(d.sms?.responseRate).toFixed(1) + "%"],
              ]) +
            '</div>' +
          '</div>' +

          '<div class="gridBottom">' +
            '<div class="card">' +
              '<p class="sectionTitle">Call Metrics</p>' +
              '<p class="sectionSub">&nbsp;</p>' +
              metricLines([
                ["Total Calls", d.calls?.total ?? 0],
                ["Inbound", d.calls?.inbound ?? 0],
                ["Outbound", d.calls?.outbound ?? 0],
                ["Completed", d.calls?.completed ?? 0],
                ["Avg Duration", formatDuration(d.calls?.avgDurationSec ?? 0)],
              ]) +
            '</div>' +
            '<div class="card">' +
              '<p class="sectionTitle">Revenue Metrics</p>' +
              '<p class="sectionSub">&nbsp;</p>' +
              metricLines([
                ["Total Revenue", fmtMoney(d.revenueMetrics?.totalRevenue ?? d.revenue ?? 0)],
                ["Transactions", d.revenueMetrics?.transactions ?? 0],
                ["Avg Transaction", fmtMoney(d.revenueMetrics?.avgTransaction ?? 0)],
                ["Successful", d.revenueMetrics?.successful ?? 0],
              ]) +
            '</div>' +
          '</div>' +
        '</div>';

      wireEvents();
      animateBars();
    }

    (async () => {
      state.data = await loadData(state.range);
      render();
    })();
  })();
  </script>
</body>
</html>`;
}
