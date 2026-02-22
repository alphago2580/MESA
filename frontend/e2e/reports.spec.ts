import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("FR-03: 리포트 플로우", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test("리포트 목록 페이지 접근", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: /리포트/i })).toBeVisible();
  });

  test("리포트 수동 생성 → 목록에 표시", async ({ page }) => {
    await page.goto("/reports");

    const before = await page.getByTestId("report-item").count();
    await page.getByRole("button", { name: /리포트 생성|지금 생성/i }).click();

    // 로딩 후 새 리포트 등장
    await expect(page.getByTestId("report-item")).toHaveCount(before + 1, {
      timeout: 15_000,
    });
  });

  test("리포트 상세 조회", async ({ page }) => {
    await page.goto("/reports");
    await page.getByRole("button", { name: /리포트 생성|지금 생성/i }).click();
    await expect(page.getByTestId("report-item")).toHaveCount(1, { timeout: 15_000 });

    await page.getByTestId("report-item").first().click();
    await expect(page).toHaveURL(/\/reports\/\d+/);
    await expect(page.locator("article, [data-testid='report-content']")).toBeVisible();
  });
});
