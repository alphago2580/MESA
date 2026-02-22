import { Page } from "@playwright/test";

export const TEST_USER = {
  email: "e2e@example.com",
  password: "E2eTest1234!",
};

/** 회원가입 + 로그인 헬퍼 */
export async function registerAndLogin(page: Page, user = TEST_USER) {
  // API 직접 호출로 계정 생성 (UI 플로우는 test_auth.spec.ts에서 별도 검증)
  await page.request.post("http://localhost:8000/auth/register", {
    data: user,
  });
  await page.goto("/login");
  await page.getByLabel(/이메일/i).fill(user.email);
  await page.getByLabel(/비밀번호/i).fill(user.password);
  await page.getByRole("button", { name: /로그인/i }).click();
  await page.waitForURL(/\/(dashboard|reports|settings)?$/);
}
