const $ = (id) => document.getElementById(id);
const status = (msg) => { $("status").textContent = msg; };

async function load() {
  const s = await chrome.storage.sync.get(["endpoint", "token", "via", "autoPatterns"]);
  $("endpoint").value = s.endpoint || "";
  $("token").value = s.token || "";
  $("via").value = s.via || "";
  $("patterns").value = (s.autoPatterns || []).join("\n");
}

$("save").addEventListener("click", async () => {
  const patterns = $("patterns").value.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const p of patterns) {
    if (!/^https:\/\/[^/]+\/.*$/.test(p)) return status(`“${p}” must look like https://example.com/path/*`);
  }

  // Reading a site automatically needs the browser's permission for that site.
  if (patterns.length) {
    const granted = await chrome.permissions.request({ origins: patterns });
    if (!granted) return status("Permission for those sites was declined, so nothing was saved.");
  }

  await chrome.storage.sync.set({
    endpoint: $("endpoint").value.trim(),
    token: $("token").value.trim(),
    via: $("via").value.trim(),
    autoPatterns: patterns,
  });
  chrome.runtime.sendMessage({ type: "reload-auto" });
  status("Saved.");
});

load();
