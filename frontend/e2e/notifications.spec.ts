import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("FR-04: Web Push 알림 구독 플로우", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/settings");
  });

  test("설정 페이지에 푸시 알림 섹션이 표시됨", async ({ page }) => {
    // 푸시 알림 섹션이 존재해야 함
    await expect(page.getByTestId("push-notification-section")).toBeVisible();
  });

  test("푸시 알림 토글 버튼이 존재함", async ({ page }) => {
    // 브라우저가 Notification API를 지원하지 않을 수 있으므로
    // 섹션 자체는 항상 렌더링됨
    const section = page.getByTestId("push-notification-section");
    await expect(section).toBeVisible();

    // 지원하지 않는 경우 메시지가 나타나거나, 토글 버튼이 보여야 함
    const hasToggle = await page.getByTestId("push-toggle").isVisible().catch(() => false);
    const hasUnsupportedMsg = await page
      .getByText(/지원하지 않습니다|브라우저 설정/i)
      .isVisible()
      .catch(() => false);

    expect(hasToggle || hasUnsupportedMsg).toBeTruthy();
  });

  test("VAPID 키 엔드포인트가 응답함", async ({ page }) => {
    // 백엔드 VAPID 공개키 엔드포인트 직접 테스트
    const response = await page.request.get(
      "http://localhost:8000/settings/vapid-public-key",
      {
        headers: {
          Authorization: `Bearer ${await page.evaluate(() =>
            localStorage.getItem("mesa_token")
          )}`,
        },
      }
    );
    // VAPID 키가 미설정이면 503, 설정되면 200
    expect([200, 503]).toContain(response.status());
  });

  test("푸시 구독 API 엔드포인트가 인증 없이 거부됨", async ({ page }) => {
    // 인증 없이 push-subscription 저장 시도 → 401
    const response = await page.request.post(
      "http://localhost:8000/settings/push-subscription",
      {
        data: {
          subscription: null,
          enabled: false,
        },
      }
    );
    expect(response.status()).toBe(401);
  });

  test("푸시 구독 해제 API가 인증된 사용자에게 작동함", async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem("mesa_token"));

    // 구독 해제 요청 (subscription = null)
    const response = await page.request.post(
      "http://localhost:8000/settings/push-subscription",
      {
        data: { subscription: null, enabled: false },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("push_enabled", false);
  });

  test("설정 저장 후 상태 메시지가 표시됨", async ({ page }) => {
    // 저장 버튼 클릭 → 완료 상태 표시
    await page.getByRole("button", { name: /저장/i }).click();
    await expect(page.getByRole("status")).toContainText(/저장|완료/i);
  });
});
