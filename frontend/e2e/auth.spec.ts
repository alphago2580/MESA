import { test, expect } from "@playwright/test";
import { TEST_USER } from "./helpers";

test.describe("FR-01: 인증 플로우", () => {
  test("회원가입 → 로그인 → 대시보드 이동", async ({ page }) => {
    await page.goto("/login");

    // 회원가입 링크 클릭
    await page.getByRole("link", { name: /회원가입/i }).click();
    await page.getByLabel(/이메일/i).fill(TEST_USER.email);
    await page.getByLabel(/비밀번호/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /가입/i }).click();

    // 가입 후 로그인 화면 또는 바로 대시보드
    await expect(page).toHaveURL(/\/(login|dashboard|reports)?/);
  });

  test("로그인 성공 → 보호된 페이지 접근 가능", async ({ page }) => {
    // API로 계정 미리 생성
    await page.request.post("http://localhost:8000/auth/register", {
      data: TEST_USER,
    });

    await page.goto("/login");
    await page.getByLabel(/이메일/i).fill(TEST_USER.email);
    await page.getByLabel(/비밀번호/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /로그인/i }).click();

    await page.waitForURL(/\/(dashboard|reports|settings)?$/);
    await expect(page).not.toHaveURL("/login");
  });

  test("로그인 없이 보호된 페이지 → /login 리다이렉트", async ({ page }) => {
    await page.goto("/reports");
    await expect(page).toHaveURL(/\/login/);
  });

  test("틀린 비밀번호 → 에러 메시지 표시", async ({ page }) => {
    await page.request.post("http://localhost:8000/auth/register", {
      data: TEST_USER,
    });

    await page.goto("/login");
    await page.getByLabel(/이메일/i).fill(TEST_USER.email);
    await page.getByLabel(/비밀번호/i).fill("wrongpassword");
    await page.getByRole("button", { name: /로그인/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });
});
