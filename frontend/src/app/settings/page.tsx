'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, settingsApi, indicatorsApi } from '@/lib/api'
import type { User, Indicator } from '@/lib/types'
import { usePushNotification } from '@/components/ServiceWorkerRegistrar'
import { ArrowLeft, Save, Bell, BellOff } from 'lucide-react'

const LEVEL_OPTIONS = [
  { value: 'beginner', label: '주린이', desc: '쉬운 설명, 일상적 비유', color: 'border-green-500 bg-green-500/10' },
  { value: 'standard', label: '일반', desc: '표준 분석, 핵심 지표', color: 'border-blue-500 bg-blue-500/10' },
  { value: 'expert', label: '전문가', desc: '기술적 분석, 상세 통계', color: 'border-purple-500 bg-purple-500/10' },
]

const FREQ_OPTIONS = [
  { value: 'daily', label: '일간', desc: '매일 오전 8시' },
  { value: 'weekly', label: '주간', desc: '매주 월요일 오전 8시' },
  { value: 'monthly', label: '월간', desc: '매월 1일 오전 8시' },
]

const CATEGORY_LABELS: Record<string, string> = {
  interest_rates: '금리/통화정책',
  inflation: '물가/인플레이션',
  employment: '고용',
  growth: '경제성장',
  market_indices: '시장지수',
  fx_commodities: '환율/원자재',
}

export default function Settings() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [level, setLevel] = useState('standard')
  const [frequency, setFrequency] = useState('weekly')
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const push = usePushNotification()

  useEffect(() => {
    const token = localStorage.getItem('mesa_token')
    if (!token) { router.push('/login'); return }
    Promise.all([authApi.me(), indicatorsApi.list()])
      .then(([userRes, indRes]) => {
        const u = userRes.data
        setUser(u)
        setLevel(u.report_level)
        setFrequency(u.report_frequency)
        setSelected(u.selected_indicators.length ? u.selected_indicators : indRes.data.filter((i: Indicator) => i.default_selected).map((i: Indicator) => i.id))
        setIndicators(indRes.data)
      })
      .catch(() => router.push('/login'))
  }, [router])

  const toggleIndicator = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsApi.update({ report_level: level, report_frequency: frequency, selected_indicators: selected })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const grouped = indicators.reduce((acc, ind) => {
    if (!acc[ind.category]) acc[ind.category] = []
    acc[ind.category].push(ind)
    return acc
  }, {} as Record<string, Indicator[]>)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition" aria-label="뒤로 가기">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold text-white">설정</h1>
      </div>

      {/* 리포트 레벨 */}
      <section className="mb-8" aria-label="리포트 깊이 설정">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">리포트 깊이</h2>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="리포트 레벨">
          {LEVEL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={level === opt.value}
              onClick={() => setLevel(opt.value)}
              className={`p-4 rounded-xl border-2 text-left transition ${level === opt.value ? opt.color : 'border-gray-800 bg-gray-900'}`}
            >
              <div className="font-semibold text-white text-sm">{opt.label}</div>
              <div className="text-gray-400 text-xs mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 수신 주기 */}
      <section className="mb-8" aria-label="수신 주기 설정">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">수신 주기</h2>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="수신 주기">
          {FREQ_OPTIONS.map(opt => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={frequency === opt.value}
              onClick={() => setFrequency(opt.value)}
              className={`p-4 rounded-xl border-2 text-left transition ${frequency === opt.value ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-gray-900'}`}
            >
              <div className="font-semibold text-white text-sm">{opt.label}</div>
              <div className="text-gray-400 text-xs mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 지표 선택 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          관심 지표 선택 <span className="text-blue-400">({selected.length}개 선택됨)</span>
        </h2>
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, inds]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-gray-500 mb-2">{CATEGORY_LABELS[cat] || cat}</h3>
              <div className="space-y-2">
                {inds.map(ind => (
                  <label key={ind.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-800 transition">
                    <input type="checkbox" checked={selected.includes(ind.id)} onChange={() => toggleIndicator(ind.id)}
                      className="w-4 h-4 rounded accent-blue-500" />
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{ind.name_ko}</div>
                      <div className="text-xs text-gray-500">{ind.description}</div>
                    </div>
                    <div className="flex">
                      {Array.from({length: 5}).map((_, i) => (
                        <span key={i} className={`text-xs ${i < ind.importance ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                      ))}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Web Push 알림 구독 */}
      <section className="mb-8" data-testid="push-notification-section">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">푸시 알림</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          {push.permission === 'unsupported' ? (
            <p className="text-gray-500 text-sm">이 브라우저는 푸시 알림을 지원하지 않습니다.</p>
          ) : push.permission === 'denied' ? (
            <p className="text-yellow-400 text-sm">
              알림 권한이 차단되어 있습니다. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요.
            </p>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  {push.isSubscribed ? <Bell size={16} className="text-blue-400" /> : <BellOff size={16} className="text-gray-500" />}
                  새 리포트 알림
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {push.isSubscribed
                    ? '새 리포트가 생성되면 브라우저 알림을 받습니다.'
                    : '구독하면 새 리포트 생성 시 알림을 받을 수 있습니다.'}
                </div>
                {push.error && (
                  <p className="text-red-400 text-xs mt-1" role="alert">{push.error}</p>
                )}
              </div>
              <button
                data-testid="push-toggle"
                onClick={push.isSubscribed ? push.unsubscribe : push.subscribe}
                disabled={push.loading}
                aria-pressed={push.isSubscribed}
                aria-label={push.isSubscribed ? '알림 구독 해제' : '알림 구독'}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                  push.isSubscribed
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {push.loading ? '처리 중...' : push.isSubscribed ? '구독 해제' : '알림 구독'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 저장 상태 */}
      {saved && (
        <div role="status" aria-live="polite" className="mb-4 text-center text-green-400 text-sm font-medium">
          저장 완료
        </div>
      )}

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        data-testid="settings-save"
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition ${saved ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} disabled:opacity-50`}
      >
        <Save size={16} />
        {saved ? '저장되었습니다!' : saving ? '저장 중...' : '설정 저장'}
      </button>
    </div>
  )
}
