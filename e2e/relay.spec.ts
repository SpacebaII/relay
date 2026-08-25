import { expect, test } from "@playwright/test";

test("a reviewer can complete the lead workflow with visible safeguards", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reload sample queue" }).click();
  await page.getByRole("button", { name: /Maya Chen/ }).click();
  await expect(page.getByRole("heading", { name: "Maya Chen" })).toBeVisible();
  await expect(page.getByText("demo-rules-v1").first()).toBeVisible();

  await page.getByRole("button", { name: "Record approval" }).click();
  await expect(page.getByText("Approval recorded", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/No delivery integration is connected/)).toBeVisible();
  await expect(page.getByText("Approval recorded", { exact: true }).last()).toBeVisible();
});

test("a user can add a valid lead and classification is a separate action", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reload sample queue" }).click();
  await page.getByRole("button", { name: "Add inquiry" }).click();
  await page.getByLabel("Contact name").fill("Jordan Lee");
  await page.getByLabel("Work email").fill("jordan@atlas.example");
  await page.getByLabel("Company").fill("Atlas Works");
  await page.getByLabel("Inquiry").fill("We need an AI workflow integration before our launch this week.");
  await page.getByRole("button", { name: "Add to queue" }).click();

  await expect(page.getByRole("heading", { name: "Jordan Lee" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run assessment" })).toBeVisible();
});

test("queue search and filters only expose real records", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reload sample queue" }).click();

  await page.getByPlaceholder("Search name, company, or inquiry").fill("Meridian");
  await expect(page.getByRole("button", { name: /Omar Haddad/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Maya Chen/ })).toHaveCount(0);

  await page.getByPlaceholder("Search name, company, or inquiry").fill("");
  await page.getByRole("button", { name: "Decision", exact: true }).click();
  await expect(page.getByRole("button", { name: /Maya Chen/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Andre Lewis/ })).toHaveCount(0);
});
