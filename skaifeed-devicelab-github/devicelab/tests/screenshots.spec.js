// Screenshots ανά project → screenshots/{project}-{θέση}.png
// Χρήση: npm run shots  → μετά σύγκρινε iphone-safari vs android-chrome side-by-side.
const { test } = require("@playwright/test");
const { applyPwaIfNeeded } = require("./helpers");

test.describe("Screenshots", () => {
  test("κάρτα 1 / scroll / settings", async ({ page }, testInfo) => {
    await applyPwaIfNeeded(page, testInfo);
    const name = testInfo.project.name;

    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Περιμένουμε πραγματικό render (εικόνες + κείμενο)
    await page.waitForFunction(
      () => document.querySelectorAll("img").length >= 2 &&
            (document.body.innerText || "").length > 300,
      null,
      { timeout: 30_000 }
    ).catch(() => {}); // ακόμα κι αν timeout, τράβα shot — χρήσιμο διαγνωστικά
    await page.waitForTimeout(3_000);

    await page.screenshot({ path: `screenshots/${name}-1-top.png`, fullPage: false });

    // Scroll μία κάρτα κάτω — τεστάρει και το snap οπτικά
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: `screenshots/${name}-2-card2.png`, fullPage: false });

    // Ακόμα 3 κάρτες κάτω (windowing test)
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: `screenshots/${name}-3-deep.png`, fullPage: false });

    console.log(`   → 3 screenshots: screenshots/${name}-*.png`);
  });
});
