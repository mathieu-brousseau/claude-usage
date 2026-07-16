import { fetchAll, badgePct } from "./api.js";
import { getSettings } from "./settings.js";

const ALARM = "refresh";

function badgeColor(pct) {
  if (pct >= 90) return "#c22f2f";
  if (pct >= 75) return "#b4690e";
  return "#12855f";
}

async function setupAlarm() {
  const { refreshMinutes } = await getSettings();
  chrome.alarms.create(ALARM, { periodInMinutes: refreshMinutes });
}

async function updateBadge() {
  try {
    const { badgeSource } = await getSettings();
    const results = await fetchAll();
    const pct = Math.round(badgePct(results, badgeSource));
    await chrome.action.setBadgeText({ text: String(pct) });
    await chrome.action.setBadgeBackgroundColor({ color: badgeColor(pct) });
    const n = results.length;
    await chrome.action.setTitle({
      title: `Claude Usage — ${badgeSource} ${pct}%${n > 1 ? ` / ${n} orgs` : ""}`,
    });
  } catch {
    await chrome.action.setBadgeText({ text: "!" });
    await chrome.action.setBadgeBackgroundColor({ color: "#6b7a97" });
    await chrome.action.setTitle({ title: "Claude Usage — sign in required" });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  setupAlarm();
  updateBadge();
});
chrome.runtime.onStartup.addListener(() => {
  setupAlarm();
  updateBadge();
});

// Reagit aux changements de reglages.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.refreshMinutes) {
    setupAlarm();
    updateBadge();
  } else if (changes.badgeSource) {
    updateBadge();
  }
});

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) updateBadge();
});
