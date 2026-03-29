import { expect, test, devices } from "@playwright/test";

function uniqueName(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

test.describe("mobile username submit", () => {
  test("iphone Enter key submits username", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();

    await page.goto("/");

    const username = uniqueName("MOBILE");
    const usernameInput = page.getByPlaceholder("Enter username");
    const continueButton = page.getByRole("button", { name: "Continue To Home" });

    await expect(usernameInput).toBeVisible({ timeout: 30_000 });

    await usernameInput.fill(username);
    await expect(continueButton).toBeEnabled({ timeout: 10_000 });
    await usernameInput.press("Enter");

    await expect(page.getByRole("button", { name: "Play Online" })).toBeVisible({ timeout: 15_000 });

    await context.close();
  });
});