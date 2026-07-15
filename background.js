import { fetchAll, worstPctAll } from "./api.js";

const ALARM = "refresh";

function badgeColor(pct) {
  if (pct >= 90) return "#c22f2f";
  if (pct >= 75) return "#b4690e";
  return "#12855f";
}

async function updateBadge() {
  try {
    const results = await fetchAll({ force: true });
    const pct = Math.round(worstPctAll(results));
    await chrome.action.setBadgeText({ text: String(pct) });
    await chrome.action.setBadgeBackgroundColor({ color: badgeColor(pct) });
    const n = results.length;
    await chrome.action.setTitle({
      title: `Claude Usage — max ${pct}%${n > 1 ? ` sur ${n} orgs` : ""}`,
    });
  } catch {
    await chrome.action.setBadgeText({ text: "!" });
    await chrome.action.setBadgeBackgroundColor({ color: "#6b7a97" });
    await chrome.action.setTitle({ title: "Claude Usage — connexion requise" });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: 5 });
  updateBadge();
});

chrome.runtime.onStartup.addListener(updateBadge);

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) updateBadge();
});
