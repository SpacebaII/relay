import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch();
const outputDir = globalThis.process.env.RELAY_SCREENSHOT_DIR ?? "docs/images";
await mkdir(outputDir, { recursive: true });

async function prepare(page) {
  await page.goto("http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("button", { name: /Maya Chen/ }).click();
  await page.getByRole("heading", { name: "Maya Chen" }).waitFor();
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await prepare(desktop);
await desktop.screenshot({ path: `${outputDir}/relay-dashboard.png`, fullPage: false });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await prepare(mobile);
await mobile.screenshot({ path: `${outputDir}/relay-mobile.png`, fullPage: true });

await browser.close();
