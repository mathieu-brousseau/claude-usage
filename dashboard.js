import { fetchAll, normalize, sevClass, AuthError } from "./api.js";
import { makeT, fmtAgo, money, countdown, fmtAbs } from "./i18n.js";
import { getSettings, setSetting, REFRESH_OPTIONS, BADGE_SOURCES } from "./settings.js";

const app = document.getElementById("app");
const updated = document.getElementById("updated");
const refreshBtn = document.getElementById("refresh");
const langBtn = document.getElementById("lang");
const intervalSel = document.getElementById("interval");
const lblAutoRefresh = document.getElementById("lbl-autorefresh");
const badgeSel = document.getElementById("badge-source");
const lblBadge = document.getElementById("lbl-badge");
const footNote = document.getElementById("foot-note");

const SVGNS = "http://www.w3.org/2000/svg";
let lang = "en";
let t = makeT(lang);
let latestAt = 0;
let dataTimer = null;

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
function sevFromName(s) {
  return s === "critical" ? "crit" : s === "warning" ? "warn" : "ok";
}
function countdownText(iso, withSeconds) {
  const c = countdown(iso, withSeconds);
  if (!c) return "";
  return c.expired ? t("resetNow") : `${t("resetsIn")} ${c.text}`;
}
// Span de compte a rebours ; tooltip = date absolue ; data-reset/data-seconds pour le tick.
function resetSpan(iso, withSeconds) {
  const span = el("span", null, countdownText(iso, withSeconds));
  if (iso) {
    span.dataset.reset = iso;
    if (withSeconds) span.dataset.seconds = "1";
    span.title = fmtAbs(iso, lang);
  }
  return span;
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
  center.append(el("div", "gauge-label", t("credits")));
  if (spend.enabled) {
    center.append(el("div", "gauge-big", money(spend.used, spend.currency, lang)));
    center.append(el("div", "gauge-sub", `${t("of")} ${money(spend.limit, spend.currency, lang)}`));
    center.append(el("div", "gauge-pct", `${spend.pct.toFixed(2)}% · ${spend.currency}`));
  } else {
    center.append(el("div", "gauge-sub", t("notEnabled")));
  }
  wrap.append(center);
  return wrap;
}

function meterRow(m) {
  const sev = sevClass(m.pct);
  const row = el("div", "meter");
  const head = el("div", "meter-head");
  head.append(el("span", "meter-label", t(m.key)));
  head.append(el("span", `meter-val ${sev}`, `${Math.round(m.pct)}%`));
  row.append(head);
  const track = el("div", "track");
  const fill = el("div", `fill ${sev}`);
  fill.style.width = `${Math.min(m.pct, 100)}%`;
  track.append(fill);
  row.append(track);
  const sub = el("div", "meter-sub");
  sub.append(resetSpan(m.resetsAt, m.key === "week"));
  sub.append(el("span", null, ""));
  row.append(sub);
  return row;
}

function limitLabel(l) {
  if (l.kind === "session") return t("session");
  if (l.kind === "weekly_all") return t("weekAllModels");
  if (l.kind === "weekly_scoped") {
    return t("weekScoped", { model: l.scope?.model?.display_name || t("scoped") });
  }
  return l.kind || t("limits");
}
function limitCard(l) {
  const sev = sevFromName(l.severity);
  const card = el("div", `card ${sev}`);
  const head = el("div", "card-head");
  head.append(el("span", "card-title", limitLabel(l)));
  if (l.severity) head.append(el("span", "chip", t(`sev_${l.severity}`)));
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
  active.append(document.createTextNode(l.is_active ? t("active") : t("inactive")));
  sub.append(active);
  sub.append(resetSpan(l.resets_at, !!(l.kind && l.kind.startsWith("weekly"))));
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
  card.append(el("div", "card-val", `${money(p.used, p.currency, lang)} / ${money(p.limit, p.currency, lang)}`));
  const track = el("div", "track");
  const fill = el("div", `fill ${sev}`);
  fill.style.width = `${Math.min(p.pct, 100)}%`;
  track.append(fill);
  card.append(track);
  const sub = el("div", "card-sub");
  sub.append(el("span", null, `${p.pct.toFixed(1)}%`));
  sub.append(resetSpan(p.resets_at));
  card.append(sub);
  return card;
}

function section(title, node) {
  const sec = el("section");
  sec.append(el("h2", null, title));
  sec.append(node);
  return sec;
}
function collapsible(title, node) {
  const d = el("details", "collapsible");
  d.append(el("summary", null, title));
  d.append(node);
  return d;
}
function orgTitle(org) {
  const title = el("div", "org-title");
  title.append(el("span", null, org.name));
  if (org.type) title.append(el("span", "org-type", org.type));
  return title;
}

function orgBlock(org, data) {
  const block = el("div", "org-block");
  block.append(orgTitle(org));
  const { meters, spend } = normalize(data);
  const hero = el("div", "hero");
  hero.append(gauge(spend));
  const hm = el("div", "hero-meters");
  for (const m of meters) hm.append(meterRow(m));
  hero.append(hm);
  block.append(hero);

  if (Array.isArray(data.limits) && data.limits.length) {
    const cards = el("div", "cards");
    for (const l of data.limits) cards.append(limitCard(l));
    block.append(section(t("limits"), cards));
  }
  const pools = poolCards(data, spend.currency || "USD");
  if (pools.length) {
    const cards = el("div", "cards");
    for (const p of pools) cards.append(poolCard(p));
    block.append(collapsible(t("otherCredits"), cards));
  }
  return block;
}

function orgErrorBlock(org, err) {
  const block = el("div", "org-block");
  block.append(orgTitle(org));
  block.append(el("div", "msg", `${t("error")} : ${err.message}`));
  return block;
}

// ---------- rendu ----------
function render(results) {
  app.replaceChildren();
  latestAt = 0;
  for (const r of results) {
    if (r.error) app.append(orgErrorBlock(r.org, r.error));
    else {
      app.append(orgBlock(r.org, r.data));
      if (r.at > latestAt) latestAt = r.at;
    }
  }
  refreshDynamic();
}

function refreshDynamic() {
  for (const span of document.querySelectorAll("[data-reset]")) {
    span.textContent = countdownText(span.dataset.reset, span.dataset.seconds === "1");
  }
  updated.textContent = latestAt ? `${t("updated")} ${fmtAgo(latestAt, lang)}` : "";
}

// Re-recupere les donnees a l'intervalle choisi (page laissee ouverte).
function scheduleAutoRefresh(minutes) {
  if (dataTimer) clearInterval(dataTimer);
  dataTimer = setInterval(load, Math.max(1, minutes) * 60 * 1000);
}

function renderAuth() {
  app.replaceChildren();
  latestAt = 0;
  const msg = el("div", "msg");
  msg.append(el("div", null, t("notSignedIn")));
  const btn = el("button", "btn", t("openClaude"));
  btn.addEventListener("click", () => chrome.tabs.create({ url: "https://claude.ai" }));
  msg.append(btn);
  app.append(msg);
  updated.textContent = "";
}
function renderError(err) {
  app.replaceChildren();
  latestAt = 0;
  app.append(el("div", "msg", `${t("error")} : ${err.message}`));
  updated.textContent = "";
}

async function load() {
  refreshBtn.classList.add("spin");
  try {
    const results = await fetchAll();
    if (!results.length) {
      latestAt = 0;
      app.replaceChildren(el("div", "msg", t("noOrg")));
      updated.textContent = "";
    } else {
      render(results);
    }
  } catch (err) {
    if (err instanceof AuthError) renderAuth();
    else renderError(err);
  } finally {
    refreshBtn.classList.remove("spin");
  }
}

async function init() {
  const s = await getSettings();
  lang = s.lang;
  t = makeT(lang);
  document.documentElement.lang = lang;

  refreshBtn.title = t("refresh");
  langBtn.textContent = lang.toUpperCase();
  langBtn.title = t("switchLang");
  lblAutoRefresh.textContent = t("autoRefresh");
  footNote.textContent =
    lang === "fr"
      ? "Données lues depuis ta session claude.ai · endpoint non documenté (peut changer)."
      : "Data read from your claude.ai session · undocumented endpoint (may change).";

  intervalSel.replaceChildren();
  for (const n of REFRESH_OPTIONS) {
    const o = el("option", null, `${n} ${t("minutes")}`);
    o.value = String(n);
    if (n === s.refreshMinutes) o.selected = true;
    intervalSel.append(o);
  }

  lblBadge.textContent = t("badgeLabel");
  const badgeLabels = { session: t("session"), worst: t("worst"), week: t("week"), credits: t("usageCredits") };
  badgeSel.replaceChildren();
  for (const src of BADGE_SOURCES) {
    const o = el("option", null, badgeLabels[src] || src);
    o.value = src;
    if (src === s.badgeSource) o.selected = true;
    badgeSel.append(o);
  }

  langBtn.addEventListener("click", async () => {
    await setSetting("lang", lang === "en" ? "fr" : "en");
    location.reload();
  });
  refreshBtn.addEventListener("click", () => location.reload());
  intervalSel.addEventListener("change", () => {
    const m = parseInt(intervalSel.value, 10);
    setSetting("refreshMinutes", m);
    scheduleAutoRefresh(m);
  });
  badgeSel.addEventListener("change", () => setSetting("badgeSource", badgeSel.value));

  setInterval(refreshDynamic, 1000);
  scheduleAutoRefresh(s.refreshMinutes);
  load();
}

init();
