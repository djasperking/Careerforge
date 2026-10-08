// Injected only on the page patterns the user listed in Options. It does not
// click, scroll or navigate: it waits for the page the user opened to finish
// rendering, then asks the background worker to clip it. For single-page apps
// it also notices when the user moves to a different job and clips that too.

(() => {
  const SETTLE_MS = 3000;
  let lastSent = "";

  function schedule() {
    const href = location.href;
    if (href === lastSent) return;
    setTimeout(() => {
      // Only if the user is still on that page and actually looking at it.
      if (location.href !== href || document.visibilityState !== "visible") return;
      lastSent = href;
      chrome.runtime.sendMessage({ type: "page-settled" });
    }, SETTLE_MS);
  }

  schedule();
  let seen = location.href;
  setInterval(() => {
    if (location.href !== seen) {
      seen = location.href;
      schedule();
    }
  }, 1500);
})();
