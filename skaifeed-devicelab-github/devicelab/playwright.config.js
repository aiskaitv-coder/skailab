// ΣΚΑΪ Feed — Device Lab config
// 5 προφίλ: iPhone Safari (WebKit engine), iPhone PWA, Android Chrome, Android PWA, Desktop Chrome.
// Το BASE_URL αλλάζει με env var: BASE_URL=https://... npm test
const { defineConfig, devices } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "https://v62agskai.netlify.app";

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 60_000,               // το feed κάνει αρκετά fetch στο πρώτο load
  expect: { timeout: 15_000 },
  retries: 1,                    // 1 retry για flaky network
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",  // trace viewer σε αποτυχία: npx playwright show-trace
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // ── iPhone Safari: πραγματικός WebKit engine, iPhone 15 viewport/UA/touch ──
    {
      name: "iphone-safari",
      use: { ...devices["iPhone 15"] },
    },
    // ── iPhone PWA: ίδιο + display-mode:standalone + navigator.standalone (βλ. smoke.spec) ──
    {
      name: "iphone-pwa",
      use: { ...devices["iPhone 15"] },
    },
    // ── Android Chrome: Chromium engine, Pixel 7 ──
    {
      name: "android-chrome",
      use: { ...devices["Pixel 7"] },
    },
    // ── Android PWA ──
    {
      name: "android-pwa",
      use: { ...devices["Pixel 7"] },
    },
    // ── Desktop Chrome: reference / debugging ──
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
