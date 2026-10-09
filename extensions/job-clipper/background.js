// Career Forge Job Clipper — background service worker.
//
// Sends the page the user is looking at to their Career Forge review queue.
// It only ever reads the tab the user clicked on (or a page they opened that
// matches a pattern they chose); it never navigates, clicks or logs in.

const DEFAULT_ENDPOINT = "https://www.careerforge.com.ng/api/ingest/clip";

async function getConfig() {
  const stored = await chrome.storage.sync.get(["endpoint", "token", "via"]);
  let local = {};
  try {
    const res = await fetch(chrome.runtime.getURL("config.local.json"));
    if (res.ok) local = await res.json();
  } catch {
    /* no local config — fine, options page values are used */
  }
  return {
    endpoint: stored.endpoint || local.endpoint || DEFAULT_ENDPOINT,
    token: stored.token || local.token || "",
    via: stored.via || "",
  };
}

// Runs inside the page (serialised by chrome.scripting) — must be self-contained.
function extractPage() {
  const clean = (s) => (s || "").replace(/ /g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  const jsonLd = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
    try { jsonLd.push(JSON.parse(el.textContent)); } catch { /* ignore bad JSON-LD */ }
  });

  const selected = clean(String(window.getSelection() || ""));
  // The first <main>/<article> is sometimes a sidebar ("Related jobs"), so take the
  // biggest content block, and fall back to the whole page if that block is small.
  const len = (el) => (el.innerText || "").length;
  const blocks = [...document.querySelectorAll("main, [role=main], article, section")];
  const biggest = blocks.sort((a, b) => len(b) - len(a))[0];
  const root = biggest && len(biggest) >= len(document.body) * 0.5 ? biggest : document.body;
  const text = clean(selected.length > 80 ? selected : root.innerText).slice(0, 60000);

  return { url: location.href, title: document.title, text, jsonLd };
}

function flash(tabId, kind, message) {
  const map = { created: ["✓", "#16a34a"], duplicate: ["=", "#6b7280"], error: ["!", "#dc2626"] };
  const [text, color] = map[kind];
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setTitle({ title: message, tabId });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "", tabId });
    chrome.action.setTitle({ title: "Send this job to Career Forge", tabId });
  }, 6000);
}

async function clipTab(tab) {
  if (!tab?.id || !/^https?:/.test(tab.url || "")) return;
  try {
    const cfg = await getConfig();
    if (!cfg.token) throw new Error("No token set — open the extension options.");

    const [{ result: page }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractPage });
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
      body: JSON.stringify({ ...page, via: cfg.via || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || `Server said ${res.status}`);
    flash(tab.id, data.status === "created" ? "created" : "duplicate",
      data.status === "created" ? `Added draft: ${data.title}` : `Already on your site: ${data.title}`);
  } catch (err) {
    flash(tab.id, "error", String(err.message || err));
  }
}

chrome.action.onClicked.addListener((tab) => clipTab(tab));

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "clip", title: "Send this job to Career Forge", contexts: ["page", "selection"] });
  chrome.contextMenus.create({ id: "open", title: "See my clipped jobs (review & publish)", contexts: ["page", "selection", "action"] });
  restoreAutoClip();
});
chrome.runtime.onStartup.addListener(restoreAutoClip);
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "clip") return clipTab(tab);
  if (info.menuItemId === "open") {
    // Open the "From your extension" tab of the admin Jobs board, on the same site the clips go to.
    const { endpoint } = await getConfig();
    chrome.tabs.create({ url: new URL("/admin/jobs/clips", endpoint).toString() });
  }
});

// Pages the user opened that match a pattern they chose in Options: the content
// script just reports "this page has settled"; the clip itself goes through clipTab.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "page-settled" && sender.tab) clipTab(sender.tab);
});

async function restoreAutoClip() {
  const { autoPatterns = [] } = await chrome.storage.sync.get("autoPatterns");
  try { await chrome.scripting.unregisterContentScripts({ ids: ["auto-clip"] }); } catch { /* none registered */ }
  if (!autoPatterns.length) return;
  try {
    await chrome.scripting.registerContentScripts([
      { id: "auto-clip", matches: autoPatterns, js: ["auto.js"], runAt: "document_idle", persistAcrossSessions: true },
    ]);
  } catch (err) {
    console.warn("auto-clip registration failed", err);
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "reload-auto") restoreAutoClip();
});
