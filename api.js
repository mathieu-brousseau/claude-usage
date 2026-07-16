// Logique partagee entre le popup, le dashboard et le service worker.
// Appelle l'API claude.ai avec la session du navigateur (cookie envoye
// automatiquement grace a host_permissions). Aucun token a manipuler.
// Multi-org : enumere toutes les organisations du compte connecte.

const BASE = "https://claude.ai/api";

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

// Usage d'une org. Toujours frais (pas de cache : le refresh recharge la page).
export async function fetchUsage(orgId) {
  const r = await fetch(`${BASE}/organizations/${orgId}/usage`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (r.status === 401 || r.status === 403) throw new AuthError(r.status);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  return { data, at: Date.now() };
}

// Usage de TOUTES les orgs. Renvoie [{ org, data, at }] ou { org, error }.
// Une erreur d'auth globale (pas connecte) est propagee.
export async function fetchAll() {
  const orgs = await getOrgs();
  const out = [];
  for (const org of orgs) {
    try {
      const { data, at } = await fetchUsage(org.uuid);
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

function windowMeter(key, w) {
  if (!w) return null;
  return { key, pct: Number(w.utilization) || 0, resetsAt: w.resets_at || null };
}

function spendMeter(spend, extra) {
  if (spend && spend.enabled && spend.used && spend.limit) {
    const eu = spend.used.exponent ?? 2;
    const el = spend.limit.exponent ?? 2;
    const used = spend.used.amount_minor / 10 ** eu;
    const limit = spend.limit.amount_minor / 10 ** el;
    // Precision reelle : on calcule depuis les montants exacts plutot que
    // d'utiliser l'entier `percent` renvoye par l'API.
    const pct = spend.limit.amount_minor
      ? (spend.used.amount_minor / spend.limit.amount_minor) * 100
      : spend.percent ?? 0;
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
    windowMeter("session", data.five_hour),
    windowMeter("week", data.seven_day),
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

// % d'une metrique donnee pour une org.
export function metricPct(data, source) {
  const { meters, spend } = normalize(data);
  const find = (k) => {
    const m = meters.find((x) => x.key === k);
    return m ? m.pct : 0;
  };
  switch (source) {
    case "session":
      return find("session");
    case "week":
      return find("week");
    case "credits":
      return spend.enabled ? spend.pct : 0;
    default: // "worst"
      return worstPct(data);
  }
}

// Valeur du badge = max de la metrique choisie sur toutes les orgs.
export function badgePct(results, source) {
  let w = 0;
  for (const r of results) if (r && r.data) w = Math.max(w, metricPct(r.data, source));
  return w;
}
