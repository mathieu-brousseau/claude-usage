import { fetchUsage, normalize, sevClass, AuthError } from "./api.js";

const app = document.getElementById("app");
const updated = document.getElementById("updated");
const refreshBtn = document.getElementById("refresh");

const SVGNS = "http://www.w3.org/2000/svg";

// ---------- helpers ----------
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function svgEl(tag, attrs) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}
function money(v, currency) {
  try {
    return new Intl.NumberFormat(navigator.language, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(v);
  } catch {
    return `$${Number(v).toFixed(2)}`;
  }
}
function resetLabel(iso) {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "reinitialise";
  const min = Math.round(ms / 60000);
  if (min < 60) return `reset ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `reset ${h} h`;
  return `reset ${Math.round(h / 24)} j`;
}
function ago(at) {
  const s = Math.round((Date.now() - at) / 1000);
  return s < 60 ? `il y a ${s} s` : `il y a ${Math.round(s / 60)} min`;
}
const CHIP_FR = { normal: "ok", warning: "attention", critical: "critique" };
function sevFromName(s) {
  return s === "critical" ? "crit" : s === "warning" ? "warn" : "ok";
}

// ---------- composants ----------
function gauge(spend) {
  const sev = spend.enabled ? sevClass(spend.pct) : "ok";
  const wrap = el("div", `gauge-wrap ${sev}`);
  const pct = spend.enabled ? Math.max(0, Math.min(spend.pct, 100)) : 0;

  const svg = svgEl("svg", { viewBox: "0 0 120 120", class: "gauge" });
  const common = { cx: 60, cy: 60, r: 50, fill: "none", "stroke-width": 11 };
  svg.append(svgEl("circle", { ...common, class: "track-ring" }));
  svg.append(
    svgEl("circle", {
      ...common,
      class: "val-ring",
      "stroke-linecap": "round",
      pathLength: 100,
      "stroke-dasharray": `${pct} 100`,
      transform: "rotate(-90 60 60)",
    })
  );
  wrap.append(svg);

  const center = el("div", "gauge-center");
  center.append(el("div", "gauge-label", "Credits"));
  if (spend.enabled) {
    center.append(el("div", "gauge-big", money(spend.used, spend.currency)));
    center.append(el("div", "gauge-sub", `sur ${money(spend.limit, spend.currency)}`));
    center.append(el("div", "gauge-pct", `${spend.pct.toFixed(1)}% · ${spend.currency}`));
  } else {
    center.append(el("div", "gauge-sub", "non actives"));
  }
  wrap.append(center);
  return wrap;
}

function meterRow(m) {
  const sev = sevClass(m.pct);
  const row = el("div", "meter");
  const head = el("div", "meter-head");
  head.append(el("span", "meter-label", m.label));
  head.append(el("span", `meter-val ${sev}`, `${Math.round(m.pct)}%`));
  row.append(head);
  const track = el("div", "track");
  const fill = el("div", `fill ${sev}`);
  fill.style.width = `${Math.min(m.pct, 100)}%`;
  track.append(fill);
  row.append(track);
  const sub = el("div", "meter-sub");
  sub.append(el("span", null, resetLabel(m.resetsAt)));
  sub.append(el("span", null, ""));
  row.append(sub);
  return row;
}

function limitLabel(l) {
  if (l.kind === "session") return "Session (5 h)";
  if (l.kind === "weekly_all") return "Semaine — tous modeles";
  if (l.kind === "weekly_scoped") {
    const m = l.scope?.model?.display_name;
    return `Semaine — ${m || "restreint"}`;
  }
  return l.kind || "Plafond";
}
function limitCard(l) {
  const sev = sevFromName(l.severity);
  const card = el("div", `card ${sev}`);
  const head = el("div", "card-head");
  head.append(el("span", "card-title", limitLabel(l)));
  if (l.severity) head.append(el("span", "chip", CHIP_FR[l.severity] || l.severity));
  card.append(head);
  card.append(el("div", "card-val", `${Math.round(l.percent)}%`));
  const track = el("div", "track");
  const fill = el("div", `fill ${sev}`);
  fill.style.width = `${Math.min(l.percent, 100)}%`;
  track.append(fill);
  card.append(track);
  const sub = el("div", "card-sub");
  const active = el("span", null);
  active.append(el("span", `dot ${l.is_active ? "on" : "off"}`));
  active.append(document.createTextNode(l.is_active ? "actif" : "inactif"));
  sub.append(active);
  sub.append(el("span", null, resetLabel(l.resets_at)));
  card.append(sub);
  return card;
}

function prettyKey(k) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function poolCards(data, currency) {
  const skip = new Set(["spend", "extra_usage", "limits", "member_dashboard_available"]);
  const out = [];
  for (const [k, v] of Object.entries(data)) {
    if (skip.has(k) || !v || typeof v !== "object") continue;
    if (v.limit_dollars == null) continue;
    const used = Number(v.used_dollars) || 0;
    const limit = Number(v.limit_dollars) || 0;
    out.push({
      name: prettyKey(k),
      used,
      limit,
      pct: limit ? (used / limit) * 100 : 0,
      resets_at: v.resets_at,
      currency,
    });
  }
  return out;
}
function poolCard(p) {
  const sev = sevClass(p.pct);
  const card = el("div", `card ${sev}`);
  const head = el("div", "card-head");
  head.append(el("span", "card-title", p.name));
  card.append(head);
  card.append(el("div", "card-val", `${money(p.used, p.currency)} / ${money(p.limit, p.currency)}`));
  const track = el("div", "track");
  const fill = el("div", `fill ${sev}`);
  fill.style.width = `${Math.min(p.pct, 100)}%`;
  track.append(fill);
  card.append(track);
  const sub = el("div", "card-sub");
  sub.append(el("span", null, `${p.pct.toFixed(1)}%`));
  sub.append(el("span", null, resetLabel(p.resets_at)));
  card.append(sub);
  return card;
}

function section(title, node) {
  const sec = el("section");
  sec.append(el("h2", null, title));
  sec.append(node);
  return sec;
}

// ---------- rendu ----------
function render(data, at) {
  const { meters, spend } = normalize(data);
  app.replaceChildren();

  const hero = el("section", "hero");
  hero.append(gauge(spend));
  const hm = el("div", "hero-meters");
  for (const m of meters) hm.append(meterRow(m));
  hero.append(hm);
  app.append(hero);

  if (Array.isArray(data.limits) && data.limits.length) {
    const cards = el("div", "cards");
    for (const l of data.limits) cards.append(limitCard(l));
    app.append(section("Plafonds", cards));
  }

  const pools = poolCards(data, spend.currency || "USD");
  if (pools.length) {
    const cards = el("div", "cards");
    for (const p of pools) cards.append(poolCard(p));
    app.append(section("Autres credits", cards));
  }

  updated.textContent = `maj ${ago(at)}`;
}

function renderAuth() {
  app.replaceChildren();
  const msg = el("div", "msg");
  msg.append(el("div", null, "Pas connecte a claude.ai."));
  const btn = el("button", "btn", "Ouvrir claude.ai");
  btn.addEventListener("click", () => chrome.tabs.create({ url: "https://claude.ai" }));
  msg.append(btn);
  app.append(msg);
  updated.textContent = "";
}
function renderError(err) {
  app.replaceChildren();
  app.append(el("div", "msg", `Erreur : ${err.message}`));
  updated.textContent = "";
}

async function load({ force = false } = {}) {
  refreshBtn.classList.add("spin");
  try {
    const { data, at } = await fetchUsage({ force });
    render(data, at);
  } catch (err) {
    if (err instanceof AuthError) renderAuth();
    else renderError(err);
  } finally {
    refreshBtn.classList.remove("spin");
  }
}

refreshBtn.addEventListener("click", () => load({ force: true }));
load();
