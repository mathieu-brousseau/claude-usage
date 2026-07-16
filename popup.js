import { fetchAll, normalize, sevClass, AuthError } from "./api.js";
import { makeT, fmtAgo, money, countdownHHMM, fmtAbs } from "./i18n.js";
import { getSettings, setSetting } from "./settings.js";

const content = document.getElementById("content");
const footer = document.getElementById("footer");
const refreshBtn = document.getElementById("refresh");
const langBtn = document.getElementById("lang");
const openDashBtn = document.getElementById("open-dash");

let lang = "en";
let t = makeT(lang);
let latestAt = 0;
let orgCount = 0;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function countdownText(iso) {
  const c = countdownHHMM(iso);
  if (!c) return "";
  return c.expired ? t("resetNow") : `${t("resetsIn")} ${c.text}`;
}

// Span de compte a rebours : texte HH:MM, tooltip = date absolue, data-reset pour le tick.
function resetSpan(iso) {
  const span = el("span", null, countdownText(iso));
  if (iso) {
    span.dataset.reset = iso;
    span.title = fmtAbs(iso);
  }
  return span;
}

function meterSub(leftNode, rightText) {
  const s = el("div", "meter-sub");
  s.append(leftNode || el("span", null, ""));
  s.append(el("span", null, rightText || ""));
  return s;
}

function meterRow(label, valueText, pct, subNode) {
  const sev = sevClass(pct);
  const row = el("div", "meter");
  const head = el("div", "meter-head");
  head.append(el("span", "meter-label", label));
  head.append(el("span", `meter-val ${sev}`, valueText));
  row.append(head);
  const track = el("div", "track");
  const fill = el("div", `fill ${sev}`);
  fill.style.width = `${Math.min(pct, 100)}%`;
  track.append(fill);
  row.append(track);
  if (subNode) row.append(subNode);
  return row;
}

function orgRows(data) {
  const frag = document.createDocumentFragment();
  const { meters, spend } = normalize(data);
  for (const m of meters) {
    frag.append(meterRow(t(m.key), `${Math.round(m.pct)}%`, m.pct, meterSub(resetSpan(m.resetsAt), "")));
  }
  if (spend.enabled) {
    frag.append(
      meterRow(
        t("usageCredits"),
        `${money(spend.used, spend.currency, lang)} / ${money(spend.limit, spend.currency, lang)}`,
        spend.pct,
        meterSub(el("span", null, `${spend.pct.toFixed(1)}%`), spend.currency)
      )
    );
  }
  return frag;
}

function render(results) {
  content.replaceChildren();
  const multi = results.length > 1;
  latestAt = 0;
  orgCount = results.length;
  for (const r of results) {
    if (multi) content.append(el("div", "org-label", r.org.name));
    if (r.error) {
      content.append(el("div", "msg-inline", `${t("error")} : ${r.error.message}`));
      continue;
    }
    content.append(orgRows(r.data));
    if (r.at > latestAt) latestAt = r.at;
  }
  refreshDynamic();
}

function refreshDynamic() {
  for (const span of document.querySelectorAll("[data-reset]")) {
    span.textContent = countdownText(span.dataset.reset);
  }
  footer.textContent = latestAt
    ? `${t("updated")} ${fmtAgo(latestAt, lang)}${orgCount > 1 ? ` · ${t("orgs", { n: orgCount })}` : ""}`
    : "";
}

function renderAuth() {
  content.replaceChildren();
  latestAt = 0;
  const msg = el("div", "msg");
  msg.append(el("div", null, t("notSignedIn")));
  const btn = el("button", "btn", t("openClaude"));
  btn.addEventListener("click", () => chrome.tabs.create({ url: "https://claude.ai" }));
  msg.append(btn);
  content.append(msg);
  footer.textContent = "";
}

function renderError(err) {
  content.replaceChildren();
  latestAt = 0;
  content.append(el("div", "msg", `${t("error")} : ${err.message}`));
  footer.textContent = "";
}

async function load() {
  refreshBtn.classList.add("spin");
  try {
    const results = await fetchAll();
    if (!results.length) {
      latestAt = 0;
      content.replaceChildren(el("div", "msg", t("noOrg")));
      footer.textContent = "";
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
  openDashBtn.title = t("openDashboard");
  langBtn.textContent = lang.toUpperCase();
  langBtn.title = t("switchLang");
  content.replaceChildren(el("div", "loading", t("loading")));

  langBtn.addEventListener("click", async () => {
    await setSetting("lang", lang === "en" ? "fr" : "en");
    location.reload();
  });
  refreshBtn.addEventListener("click", () => location.reload());
  openDashBtn.addEventListener("click", () =>
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") })
  );

  setInterval(refreshDynamic, 1000);
  load();
}

init();
