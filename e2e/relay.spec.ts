import { expect, test } from "@playwright/test";

test("a reviewer can complete the lead workflow with visible safeguards", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("button", { name: /Maya Chen/ }).click();
  await expect(page.getByRole("heading", { name: "Maya Chen" })).toBeVisible();
  await expect(page.getByText("Transparent demo rules").first()).toBeVisible();

  await page.getByRole("button", { name: "Approve draft" }).click();
  await expect(page.getByText("Human approved")).toBeVisible();
  await expect(page.getByText("No email was sent.")).toBeVisible();
  await expect(page.getByText("Draft approved", { exact: true })).toBeVisible();
});

test("a user can add a valid lead and classification is a separate action", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("button", { name: "Add lead" }).click();
  await page.getByLabel("Contact name").fill("Jordan Lee");
  await page.getByLabel("Work email").fill("jordan@atlas.example");
  await page.getByLabel("Company").fill("Atlas Works");
  await page.getByLabel("Inquiry").fill("We need an AI workflow integration before our launch this week.");
  await page.getByRole("button", { name: "Add to inbox" }).click();

  await expect(page.getByRole("heading", { name: "Jordan Lee" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Classify lead" })).toBeVisible();
});
