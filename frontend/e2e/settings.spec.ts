import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("FR-02: 설정 플로우", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/settings");
  });

  test("설정 페이지 진입", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /설정/i })).toBeVisible();
  });

  test("리포트 레벨 변경 → 저장 확인", async ({ page }) => {
    await page.getByRole("radio", { name: /주린이/i }).click();
    await page.getByRole("button", { name: /저장/i }).click();
    await expect(page.getByRole("status")).toContainText(/저장|완료/i);

    // 새로고침 후에도 유지
    await page.reload();
    await expect(page.getByRole("radio", { name: /주린이/i })).toBeChecked();
  });

  test("수신 주기 변경", async ({ page }) => {
    await page.getByRole("radio", { name: /일간|Daily/i }).click();
    await page.getByRole("button", { name: /저장/i }).click();
    await expect(page.getByRole("status")).toContainText(/저장|완료/i);
  });

  test("관심 지표 선택 → 저장", async ({ page }) => {
    // 지표 체크박스 최소 1개 선택
    const checkboxes = page.getByRole("checkbox");
    await checkboxes.first().check();
    await page.getByRole("button", { name: /저장/i }).click();
    await expect(page.getByRole("status")).toContainText(/저장|완료/i);
  });
});
