// Reglages persistes (langue, intervalle d'auto-refresh, metrique du badge).

const DEFAULTS = { lang: "en", refreshMinutes: 5, badgeSource: "session" };
export const REFRESH_OPTIONS = [1, 5, 10, 15, 30, 60];
export const BADGE_SOURCES = ["session", "worst", "week", "credits"];

export async function getSettings() {
  const s = await chrome.storage.local.get(["lang", "refreshMinutes", "badgeSource"]);
  return {
    lang: s.lang || DEFAULTS.lang,
    refreshMinutes: s.refreshMinutes || DEFAULTS.refreshMinutes,
    badgeSource: s.badgeSource || DEFAULTS.badgeSource,
  };
}

export async function setSetting(key, value) {
  await chrome.storage.local.set({ [key]: value });
}
