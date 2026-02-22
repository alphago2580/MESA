/**
 * Web Push 알림 관련 타입 정의
 * frontend/src/types/ - Integrator 소유 영역
 */

/** Web Push 구독 상태 */
export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

/** Push 구독 UI 상태 */
export interface PushSubscriptionState {
  /** 현재 알림 권한 상태 */
  permission: PushPermissionState
  /** 구독 중인지 여부 */
  isSubscribed: boolean
  /** 구독 처리 중 (로딩) */
  loading: boolean
  /** 에러 메시지 */
  error: string | null
}

/** ServiceWorkerRegistrar 에서 외부로 노출하는 push 관련 메서드 */
export interface PushSubscriptionActions {
  /** Web Push 구독 시작 (권한 요청 → VAPID fetch → subscribe → DB 저장) */
  subscribe: () => Promise<void>
  /** Web Push 구독 해제 */
  unsubscribe: () => Promise<void>
}

/** VAPID 공개키 응답 */
export interface VapidPublicKeyResponse {
  public_key: string
}

/** 브라우저 PushSubscription JSON 직렬화 형태 */
export interface SerializedPushSubscription {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Base64 URL-safe 문자열을 Uint8Array 로 변환
 * VAPID 공개키를 applicationServerKey 로 사용하기 위해 필요
 * target: es5 호환 구현 (spread 연산자 미사용)
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
