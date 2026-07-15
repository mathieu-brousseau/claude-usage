// Logique partagee entre le popup et le service worker.
// Appelle l'API claude.ai avec la session du navigateur (cookie envoye
// automatiquement grace a host_permissions). Aucun token a manipuler.

const BASE = "https://claude.ai/api";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min, comme l'appli officielle

export class AuthError extends Error {
  constructor(code) {
    super("not-authenticated");
    this.name = "AuthError";
    this.code = code;
  }
}

async function resolveOrgId() {
  const stored = await chrome.storage.local.get("orgId");
  if (stored.orgId) return stored.orgId;
  try {
    const r = await fetch(`${BASE}/organizations`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (r.ok) {
      const list = await r.json();
      if (Array.isArray(list) && list.length && list[0]?.uuid) {
        return list[0].uuid;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

// Recupere l'usage. { force:true } ignore le cache.
export async function fetchUsage({ force = false } = {}) {
  if (!force) {
    const c = await chrome.storage.local.get(["usage", "usageAt"]);
    if (c.usage && c.usageAt && Date.now() - c.usageAt < CACHE_TTL_MS) {
      return { data: c.usage, cached: true, at: c.usageAt };
    }
  }
  const org = await resolveOrgId();
  if (!org) throw new AuthError(0);
  const r = await fetch(`${BASE}/organizations/${org}/usage`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (r.status === 401 || r.status === 403) throw new AuthError(r.status);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const at = Date.now();
  await chrome.storage.local.set({ usage: data, usageAt: at });
  return { data, cached: false, at };
}

export function sevClass(pct) {
  if (pct >= 90) return "crit";
  if (pct >= 75) return "warn";
  return "ok";
}

function windowMeter(label, w) {
  if (!w) return null;
  return { label, pct: Number(w.utilization) || 0, resetsAt: w.resets_at || null };
}

function spendMeter(spend, extra) {
  if (spend && spend.enabled && spend.used && spend.limit) {
    const eu = spend.used.exponent ?? 2;
    const el = spend.limit.exponent ?? 2;
    const used = spend.used.amount_minor / 10 ** eu;
    const limit = spend.limit.amount_minor / 10 ** el;
    const pct =
      spend.percent ??
      (spend.limit.amount_minor
        ? (spend.used.amount_minor / spend.limit.amount_minor) * 100
        : 0);
    return { enabled: true, used, limit, currency: spend.used.currency || "USD", pct };
  }
  if (extra && extra.is_enabled) {
    const dp = extra.decimal_places ?? 2;
    return {
      enabled: true,
      used: (extra.used_credits || 0) / 10 ** dp,
      limit: (extra.monthly_limit || 0) / 10 ** dp,
      currency: extra.currency || "USD",
      pct: Number(extra.utilization) || 0,
    };
  }
  return { enabled: false };
}

// Transforme le JSON brut en une forme simple pour l'affichage.
export function normalize(data) {
  const meters = [
    windowMeter("Session (5 h)", data.five_hour),
    windowMeter("Semaine", data.seven_day),
  ].filter(Boolean);
  const spend = spendMeter(data.spend, data.extra_usage);
  return { meters, spend };
}

// Le pire pourcentage parmi les compteurs actifs (pour le badge).
export function worstPct(data) {
  const { meters, spend } = normalize(data);
  const vals = meters.map((m) => m.pct);
  if (spend.enabled) vals.push(spend.pct);
  return vals.length ? Math.max(...vals) : 0;
}
