// Internationalisation (EN par defaut, FR disponible).

export const LOCALES = { en: "en-CA", fr: "fr-CA" };

export const STRINGS = {
  en: {
    brandDim: "usage",
    refresh: "Refresh",
    openDashboard: "Open dashboard",
    switchLang: "Switch to French",
    loading: "Loading…",
    credits: "Credits",
    of: "of",
    notEnabled: "not enabled",
    session: "Session (5h)",
    week: "Week",
    usageCredits: "Usage credits",
    limits: "Limits",
    otherCredits: "Other credits",
    weekAllModels: "Week — all models",
    weekScoped: "Week — {model}",
    scoped: "scoped",
    active: "active",
    inactive: "inactive",
    sev_normal: "ok",
    sev_warning: "warning",
    sev_critical: "critical",
    resets: "resets",
    resetNow: "resetting",
    updated: "updated",
    orgs: "{n} orgs",
    notSignedIn: "Not signed in to claude.ai.",
    openClaude: "Open claude.ai",
    noOrg: "No organization found.",
    error: "Error",
    settings: "Settings",
    autoRefresh: "Auto-refresh (badge)",
    minutes: "min",
  },
  fr: {
    brandDim: "usage",
    refresh: "Rafraîchir",
    openDashboard: "Ouvrir le dashboard",
    switchLang: "Passer en anglais",
    loading: "Chargement…",
    credits: "Crédits",
    of: "sur",
    notEnabled: "non activés",
    session: "Session (5 h)",
    week: "Semaine",
    usageCredits: "Crédits d'usage",
    limits: "Plafonds",
    otherCredits: "Autres crédits",
    weekAllModels: "Semaine — tous modèles",
    weekScoped: "Semaine — {model}",
    scoped: "restreint",
    active: "actif",
    inactive: "inactif",
    sev_normal: "ok",
    sev_warning: "attention",
    sev_critical: "critique",
    resets: "reset",
    resetNow: "réinitialisé",
    updated: "maj",
    orgs: "{n} orgs",
    notSignedIn: "Pas connecté à claude.ai.",
    openClaude: "Ouvrir claude.ai",
    noOrg: "Aucune organisation trouvée.",
    error: "Erreur",
    settings: "Paramètres",
    autoRefresh: "Rafraîchissement auto (badge)",
    minutes: "min",
  },
};

export function makeT(lang) {
  const dict = STRINGS[lang] || STRINGS.en;
  return (key, params) => {
    let s = dict[key] ?? STRINGS.en[key] ?? key;
    if (params) for (const k in params) s = s.split(`{${k}}`).join(params[k]);
    return s;
  };
}

export function fmtDateTime(iso, lang) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(LOCALES[lang] || "en-CA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function fmtAgo(at, lang) {
  const s = Math.round((Date.now() - at) / 1000);
  const val = s < 60 ? `${s} s` : `${Math.round(s / 60)} min`;
  return lang === "fr" ? `il y a ${val}` : `${val} ago`;
}

export function money(v, currency, lang) {
  try {
    return new Intl.NumberFormat(LOCALES[lang] || "en-CA", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(v);
  } catch {
    return `$${Number(v).toFixed(2)}`;
  }
}
