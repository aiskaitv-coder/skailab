// ΣΚΑΪ Feed — smoke tests. Τρέχουν σε ΟΛΑ τα projects (Safari/Chrome/PWA).
// Στόχος: να πιάνουν "σπάει στο iPhone" regressions ΠΡΙΝ το deploy.
const { test, expect } = require("@playwright/test");
const { applyPwaIfNeeded, collectErrors } = require("./helpers");

test.describe("ΣΚΑΪ Feed smoke", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await applyPwaIfNeeded(page, testInfo);
  });

  test("1. Φορτώνει και δείχνει version badge", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Το #versionBadge είναι το deploy check του χρήστη — πρέπει να υπάρχει στο DOM
    const badge = page.locator("#versionBadge");
    await expect(badge).toBeAttached({ timeout: 20_000 });

    // Και να περιέχει version string (vXX.Y ή ημερολογιακό 26.07.N)
    const txt = (await badge.textContent()) || "";
    expect(txt).toMatch(/v?\d+\.\d+/);
    console.log(`   → badge: "${txt.trim()}"`);
  });

  test("2. Service Worker: register με ?v= cache-buster", async ({ page, browserName }) => {
    await page.goto("/", { waitUntil: "load" });

    // Περιμένουμε την εγγραφή του SW (network-first index στρατηγική, sw.js v2 minimal)
    const swInfo = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return { supported: false };
      // poll έως 15s — η εγγραφή γίνεται μετά το load
      for (let i = 0; i < 30; i++) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sw = reg && (reg.active || reg.installing || reg.waiting);
        if (sw) return { supported: true, url: sw.scriptURL, state: sw.state };
        await new Promise((r) => setTimeout(r, 500));
      }
      return { supported: true, url: null };
    });

    expect(swInfo.supported, "serviceWorker API λείπει").toBe(true);
    expect(swInfo.url, "SW δεν έγινε register σε 15s").toBeTruthy();
    // ΚΡΙΣΙΜΟ invariant: register("sw.js?v=APP_VERSION") — χωρίς ?v= σπάει το cache-busting
    expect(swInfo.url).toMatch(/sw\.js\?v=/);
    console.log(`   → SW (${browserName}): ${swInfo.url} [${swInfo.state}]`);
  });

  test("3. Κάρτες feed: render με πραγματικό περιεχόμενο", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Περιμένουμε το πρώτο data fetch να γεμίσει το feed.
    // Δεν κλειδώνουμε σε συγκεκριμένο class (αλλάζει ανά έκδοση) — ελέγχουμε ουσία:
    // (α) υπάρχουν εικόνες άρθρων, (β) υπάρχει ελληνικό κείμενο σε όγκο.
    await page.waitForFunction(
      () => document.querySelectorAll("img").length >= 2 &&
            (document.body.innerText || "").length > 300,
      null,
      { timeout: 30_000 }
    );

    const stats = await page.evaluate(() => ({
      imgs: document.querySelectorAll("img").length,
      textLen: (document.body.innerText || "").length,
      hasGreek: /[Α-Ωα-ω]{10,}/.test(document.body.innerText || ""),
    }));
    expect(stats.hasGreek, "Δεν βρέθηκε ελληνικό κείμενο — άδειο feed;").toBe(true);
    console.log(`   → ${stats.imgs} images, ${stats.textLen} chars text`);
  });

  test("4. Ηχητικό δελτίο: υπάρχει audio στοιχείο ή bulletin card", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8_000); // αφήνουμε το feed να χτιστεί

    const audio = await page.evaluate(() => {
      const el = document.querySelector("audio");
      const bodyTxt = document.body.innerText || "";
      return {
        hasAudioEl: !!el,
        src: el ? (el.currentSrc || el.src || "(dynamic)") : null,
        mentionsBulletin: /δελτίο|ηχητικ/i.test(bodyTxt),
      };
    });
    // Soft check: το bulletin card μπορεί να είναι εκτός viewport windowing —
    // αρκεί ΕΝΑ από τα δύο σημάδια.
    expect(
      audio.hasAudioEl || audio.mentionsBulletin,
      "Ούτε <audio> ούτε αναφορά δελτίου στο DOM"
    ).toBe(true);
    console.log(`   → audio el: ${audio.hasAudioEl}, src: ${audio.src}`);
  });

  test("5. Καθαρή κονσόλα: μηδέν JS errors στο δικό μας code", async ({ page }, testInfo) => {
    await applyPwaIfNeeded(page, testInfo);
    const errors = collectErrors(page);

    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(10_000); // αφήνουμε auto-init, SW, fetches, applyMoods

    // Λίγο scroll για να τρέξει windowing/snap code
    await page.mouse.wheel ? await page.mouse.wheel(0, 600).catch(() => {}) : null;
    await page.waitForTimeout(2_000);

    if (errors.length) console.log("   → ERRORS:\n" + errors.map((e) => "     " + e).join("\n"));
    expect(errors, `JS errors:\n${errors.join("\n")}`).toHaveLength(0);
  });

  test("6. PWA mode: το feed ανιχνεύει standalone", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes("pwa"), "μόνο στα *-pwa projects");
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const pwa = await page.evaluate(() => ({
      displayMode: window.matchMedia("(display-mode: standalone)").matches,
      navStandalone: navigator.standalone === true,
    }));
    expect(pwa.displayMode).toBe(true);
    console.log(`   → standalone media: ${pwa.displayMode}, navigator.standalone: ${pwa.navStandalone}`);
  });
});
