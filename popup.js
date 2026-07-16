import { fetchAll, normalize, sevClass, AuthError } from "./api.js";
import { makeT, fmtDateTime, fmtAgo, money } from "./i18n.js";
import { getSettings, setSetting } from "./settings.js";

const content = document.getElementById("content");
const footer = document.getElementById("footer");
const refreshBtn = document.getElementById("refresh");
const langBtn = document.getElementById("lang");
const openDashBtn = document.getElementById("open-dash");

let lang = "en";
let t = makeT(lang);

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function resetText(iso) {
  if (!iso) return "";
  if (new Date(iso).getTime() - Date.now() <= 0) return t("resetNow");
  return `${t("resets")} ${fmtDateTime(iso, lang)}`;
}

function meterRow({ label, valueText, pct, sub }) {
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
  if (sub) {
    const s = el("div", "meter-sub");
    s.append(el("span", null, sub.left || ""));
    s.append(el("span", null, sub.right || ""));
    row.append(s);
  }
  return row;
}

function orgRows(data) {
  const frag = document.createDocumentFragment();
  const { meters, spend } = normalize(data);
  for (const m of meters) {
    frag.append(
      meterRow({
        label: t(m.key),
        valueText: `${Math.round(m.pct)}%`,
        pct: m.pct,
        sub: { left: resetText(m.resetsAt), right: "" },
      })
    );
  }
  if (spend.enabled) {
    frag.append(
      meterRow({
        label: t("usageCredits"),
        valueText: `${money(spend.used, spend.currency, lang)} / ${money(spend.limit, spend.currency, lang)}`,
        pct: spend.pct,
        sub: { left: `${spend.pct.toFixed(1)}%`, right: spend.currency },
      })
    );
  }
  return frag;
}

function render(results) {
  content.replaceChildren();
  const multi = results.length > 1;
  let latest = 0;
  for (const r of results) {
    if (multi) content.append(el("div", "org-label", r.org.name));
    if (r.error) {
      content.append(el("div", "msg-inline", `${t("error")} : ${r.error.message}`));
      continue;
    }
    content.append(orgRows(r.data));
    if (r.at > latest) latest = r.at;
  }
  footer.textContent = latest
    ? `${t("updated")} ${fmtAgo(latest, lang)}${multi ? ` · ${t("orgs", { n: results.length })}` : ""}`
    : "";
}

function renderAuth() {
  content.replaceChildren();
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
  content.append(el("div", "msg", `${t("error")} : ${err.message}`));
  footer.textContent = "";
}

async function load() {
  refreshBtn.classList.add("spin");
  try {
    const results = await fetchAll();
    if (!results.length) {
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

  load();
}

init();
