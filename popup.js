import { fetchUsage, normalize, sevClass, AuthError } from "./api.js";

const content = document.getElementById("content");
const footer = document.getElementById("footer");
const refreshBtn = document.getElementById("refresh");

function money(v, currency) {
  try {
    return new Intl.NumberFormat(navigator.language, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
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

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
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

function render(data, at) {
  const { meters, spend } = normalize(data);
  content.replaceChildren();

  for (const m of meters) {
    content.append(
      meterRow({
        label: m.label,
        valueText: `${Math.round(m.pct)}%`,
        pct: m.pct,
        sub: { left: resetLabel(m.resetsAt), right: "" },
      })
    );
  }

  if (spend.enabled) {
    content.append(
      meterRow({
        label: "Credits d'usage",
        valueText: `${money(spend.used, spend.currency)} / ${money(spend.limit, spend.currency)}`,
        pct: spend.pct,
        sub: { left: `${spend.pct.toFixed(1)}%`, right: spend.currency },
      })
    );
  } else {
    content.append(meterRow({
      label: "Credits d'usage",
      valueText: "non actives",
      pct: 0,
      sub: null,
    }));
  }

  const secs = Math.round((Date.now() - at) / 1000);
  const age = secs < 60 ? `${secs} s` : `${Math.round(secs / 60)} min`;
  footer.textContent = `maj il y a ${age} · cache 5 min`;
}

function renderAuth() {
  content.replaceChildren();
  const msg = el("div", "msg");
  msg.append(el("div", null, "Pas connecte a claude.ai."));
  const btn = el("button", "btn", "Ouvrir claude.ai");
  btn.addEventListener("click", () => chrome.tabs.create({ url: "https://claude.ai" }));
  msg.append(btn);
  content.append(msg);
  footer.textContent = "";
}

function renderError(err) {
  content.replaceChildren();
  const msg = el("div", "msg", `Erreur : ${err.message}`);
  content.append(msg);
  footer.textContent = "";
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
document.getElementById("open-dash").addEventListener("click", () =>
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") })
);
load();
