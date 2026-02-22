/**
 * MESA API 클라이언트
 * 백엔드 FastAPI 서버와 통신하는 axios 기반 API 클라이언트
 */

import axios from 'axios'
import type {
  SettingsUpdate,
  PushSubscriptionData,
} from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// 요청 인터셉터: localStorage 토큰을 Authorization 헤더에 주입
client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mesa_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// 인증 API
export const authApi = {
  register: (email: string, password: string) =>
    client.post('/auth/register', { email, password }),

  login: (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return client.post('/auth/token', form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  me: () => client.get('/auth/me'),
}

// 리포트 API
export const reportsApi = {
  list: () => client.get('/reports/'),
  generate: () => client.post('/reports/generate'),
  getHtml: (id: number) => client.get(`/reports/${id}/html`),
}

// 설정 API
export const settingsApi = {
  update: (data: SettingsUpdate) => client.patch('/settings/', data),

  /** VAPID 공개키 조회 */
  getVapidPublicKey: () => client.get<{ public_key: string }>('/settings/vapid-public-key'),

  /** Web Push 구독 정보 저장 */
  savePushSubscription: (subscription: PushSubscriptionData | null, enabled: boolean) =>
    client.post('/settings/push-subscription', { subscription, enabled }),
}

// 경제 지표 API
export const indicatorsApi = {
  list: () => client.get('/indicators/'),
}
