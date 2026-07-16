// Reglages persistes (langue, intervalle d'auto-refresh du badge).

const DEFAULTS = { lang: "en", refreshMinutes: 5 };
export const REFRESH_OPTIONS = [1, 5, 10, 15, 30, 60];

export async function getSettings() {
  const s = await chrome.storage.local.get(["lang", "refreshMinutes"]);
  return {
    lang: s.lang || DEFAULTS.lang,
    refreshMinutes: s.refreshMinutes || DEFAULTS.refreshMinutes,
  };
}

export async function setSetting(key, value) {
  await chrome.storage.local.set({ [key]: value });
}
