'use client'

import { useEffect, useCallback, useState, createContext, useContext } from 'react'
import { settingsApi } from '@/lib/api'
import type { PushSubscriptionState } from '@/types'
import { urlBase64ToUint8Array } from '@/types'

// ─────────────────────────────────────────────
// Context: 설정 페이지에서 push 상태/액션을 공유
// ─────────────────────────────────────────────

interface PushContextValue extends PushSubscriptionState {
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

const PushContext = createContext<PushContextValue | null>(null)

export function usePushNotification(): PushContextValue {
  const ctx = useContext(PushContext)
  if (!ctx) throw new Error('usePushNotification must be used inside ServiceWorkerRegistrar')
  return ctx
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

interface ServiceWorkerRegistrarProps {
  children?: React.ReactNode
  /** 서버에서 전달받은 초기 push_enabled 값 (선택) */
  initialPushEnabled?: boolean
}

export function ServiceWorkerRegistrar({
  children,
  initialPushEnabled = false,
}: ServiceWorkerRegistrarProps) {
  const [state, setState] = useState<PushSubscriptionState>({
    permission: 'default',
    isSubscribed: initialPushEnabled,
    loading: false,
    error: null,
  })

  // SW 등록 + 초기 권한 상태 동기화
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState((s) => ({ ...s, permission: 'unsupported' }))
      return
    }

    // SW 등록
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed:', err))

    // 현재 알림 권한 조회
    const perm = Notification.permission as PushSubscriptionState['permission']
    setState((s) => ({ ...s, permission: perm }))

    // 이미 구독 중인지 확인
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        setState((s) => ({ ...s, isSubscribed: true, permission: 'granted' }))
      }
    })
  }, [])

  /**
   * Web Push 구독 시작:
   * 1) 알림 권한 요청
   * 2) VAPID 공개키 fetch
   * 3) pushManager.subscribe()
   * 4) 구독 정보 DB 저장
   */
  const subscribe = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      // 1. 알림 권한 요청
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState((s) => ({
          ...s,
          loading: false,
          permission: permission as PushSubscriptionState['permission'],
          error: '알림 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.',
        }))
        return
      }

      // 2. VAPID 공개키 fetch
      const { data } = await settingsApi.getVapidPublicKey()
      const applicationServerKey = urlBase64ToUint8Array(data.public_key)

      // 3. SW pushManager 구독
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      // 4. 구독 정보 직렬화 후 DB 저장
      const sub = subscription.toJSON() as {
        endpoint: string
        expirationTime: number | null
        keys: { p256dh: string; auth: string }
      }
      await settingsApi.savePushSubscription(sub, true)

      setState({
        permission: 'granted',
        isSubscribed: true,
        loading: false,
        error: null,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '구독 중 오류가 발생했습니다.'
      setState((s) => ({ ...s, loading: false, error: message }))
    }
  }, [])

  /** Web Push 구독 해제 */
  const unsubscribe = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }
      // DB에서도 구독 해제
      await settingsApi.savePushSubscription(null, false)

      setState((s) => ({
        ...s,
        isSubscribed: false,
        loading: false,
        error: null,
      }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '구독 해제 중 오류가 발생했습니다.'
      setState((s) => ({ ...s, loading: false, error: message }))
    }
  }, [])

  return (
    <PushContext.Provider value={{ ...state, subscribe, unsubscribe }}>
      {children}
    </PushContext.Provider>
  )
}
