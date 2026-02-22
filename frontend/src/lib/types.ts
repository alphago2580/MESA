/**
 * MESA 공통 TypeScript 타입 정의
 * 백엔드 API 응답과 일치하는 타입
 */

export interface User {
  id: number
  email: string
  report_level: 'beginner' | 'standard' | 'expert'
  report_frequency: 'daily' | 'weekly' | 'monthly'
  selected_indicators: string[]
  push_enabled: boolean
}

export interface Report {
  id: number
  title: string
  summary: string
  level: 'beginner' | 'standard' | 'expert'
  indicators_used: string[]
  is_read: boolean
  created_at: string
}

export interface Indicator {
  id: string
  name_ko: string
  category: string
  description: string
  default_selected: boolean
  importance: number
}

/** Web Push 구독 정보 (browser PushSubscription JSON) */
export interface PushSubscriptionData {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushSubscriptionUpdate {
  subscription: PushSubscriptionData | null
  enabled: boolean
}

export interface VapidKeyResponse {
  public_key: string
}

export interface SettingsUpdate {
  report_level?: string
  report_frequency?: string
  selected_indicators?: string[]
}
