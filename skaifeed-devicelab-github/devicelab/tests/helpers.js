// Helpers κοινά για όλα τα specs.

// PWA standalone emulation: τρέχει ΠΡΙΝ από κάθε script της σελίδας.
// (α) matchMedia("(display-mode: standalone)") → true  — έτσι ανιχνεύει PWA το feed
// (β) navigator.standalone = true                — iOS-specific flag (Safari home screen)
// Έτσι βλέπουμε ποιος κώδικας ενεργοποιείται σε installed mode (π.χ. κρύψιμο install prompt,
// fullscreen συμπεριφορά, iOS no-op paths).
const PWA_INIT_SCRIPT = `
  (() => {
    const origMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (q) => {
      if (typeof q === "string" && q.includes("display-mode")) {
        const wantsStandalone = q.includes("standalone");
        return {
          matches: wantsStandalone,
          media: q,
          onchange: null,
          addListener() {}, removeListener() {},
          addEventListener() {}, removeEventListener() {},
          dispatchEvent() { return false; },
        };
      }
      return origMatchMedia(q);
    };
    try {
      Object.defineProperty(navigator, "standalone", { get: () => true });
    } catch (e) { /* read-only σε κάποια envs — αγνόησε */ }
  })();
`;

// Εφαρμόζει PWA emulation αν το project λέγεται *-pwa
async function applyPwaIfNeeded(page, testInfo) {
  if (testInfo.project.name.includes("pwa")) {
    await page.addInitScript(PWA_INIT_SCRIPT);
  }
}

// Συλλέγει console errors + pageerrors σε array (φιλτράρει γνωστό θόρυβο τρίτων)
function collectErrors(page) {
  const errors = [];
  const IGNORE = [
    /favicon/i,
    /tiktok|twitter|facebook|instagram|youtube/i, // τρίτα embeds — δικά τους errors
    /ERR_BLOCKED_BY_CLIENT/i,
    /net::ERR_/i, // δικτυακά errors τρίτων resources — τα πιάνουμε αλλού
  ];
  page.on("pageerror", (err) => {
    if (!IGNORE.some((rx) => rx.test(String(err)))) errors.push(`pageerror: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!IGNORE.some((rx) => rx.test(text))) errors.push(`console.error: ${text}`);
    }
  });
  return errors;
}

module.exports = { PWA_INIT_SCRIPT, applyPwaIfNeeded, collectErrors };
