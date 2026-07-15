// Logique partagee entre le popup, le dashboard et le service worker.
// Appelle l'API claude.ai avec la session du navigateur (cookie envoye
// automatiquement grace a host_permissions). Aucun token a manipuler.
// Multi-org : enumere toutes les organisations du compte connecte.

const BASE = "https://claude.ai/api";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min, comme l'appli officielle

export class AuthError extends Error {
  constructor(code) {
    super("not-authenticated");
    this.name = "AuthError";
    this.code = code;
  }
}

// Liste des organisations auxquelles le compte connecte a acces.
export async function getOrgs() {
  const r = await fetch(`${BASE}/organizations`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (r.status === 401 || r.status === 403) throw new AuthError(r.status);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const list = await r.json();
  if (!Array.isArray(list)) return [];
  return list
    .filter((o) => o && o.uuid)
    .map((o) => ({ uuid: o.uuid, name: o.name || "Organisation", type: o.raven_type || null }));
}

// Usage d'une org (avec cache par org, TTL 5 min).
export async function fetchUsage(orgId, { force = false } = {}) {
  const uKey = `usage_${orgId}`;
  const aKey = `usageAt_${orgId}`;
  if (!force) {
    const c = await chrome.storage.local.get([uKey, aKey]);
    if (c[uKey] && c[aKey] && Date.now() - c[aKey] < CACHE_TTL_MS) {
      return { data: c[uKey], at: c[aKey], cached: true };
    }
  }
  const r = await fetch(`${BASE}/organizations/${orgId}/usage`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (r.status === 401 || r.status === 403) throw new AuthError(r.status);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const at = Date.now();
  await chrome.storage.local.set({ [uKey]: data, [aKey]: at });
  return { data, at, cached: false };
}

// Usage de TOUTES les orgs. Renvoie [{ org, data, at }] ou { org, error }.
// Une erreur d'auth globale (pas connecte) est propagee.
export async function fetchAll({ force = false } = {}) {
  const orgs = await getOrgs();
  const out = [];
  for (const org of orgs) {
    try {
      const { data, at } = await fetchUsage(org.uuid, { force });
      out.push({ org, data, at });
    } catch (err) {
      if (err instanceof AuthError) throw err;
      out.push({ org, error: err });
    }
  }
  return out;
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

// Transforme le JSON brut d'une org en une forme simple pour l'affichage.
export function normalize(data) {
  const meters = [
    windowMeter("Session (5 h)", data.five_hour),
    windowMeter("Semaine", data.seven_day),
  ].filter(Boolean);
  const spend = spendMeter(data.spend, data.extra_usage);
  return { meters, spend };
}

export function worstPct(data) {
  const { meters, spend } = normalize(data);
  const vals = meters.map((m) => m.pct);
  if (spend.enabled) vals.push(spend.pct);
  return vals.length ? Math.max(...vals) : 0;
}

// Le pire pourcentage toutes orgs confondues (pour le badge).
export function worstPctAll(results) {
  let w = 0;
  for (const r of results) if (r && r.data) w = Math.max(w, worstPct(r.data));
  return w;
}
