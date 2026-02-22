'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, settingsApi, indicatorsApi } from '@/lib/api'
import type { User, Indicator } from '@/lib/types'
import { ArrowLeft, Save } from 'lucide-react'

const LEVEL_OPTIONS = [
  { value: 'beginner', label: '주린이', desc: '쉬운 설명, 일상적 비유', color: 'border-green-500 bg-green-500/10' },
  { value: 'standard', label: '일반', desc: '표준 분석, 핵심 지표', color: 'border-blue-500 bg-blue-500/10' },
  { value: 'expert', label: '전문가', desc: '기술적 분석, 상세 통계', color: 'border-purple-500 bg-purple-500/10' },
]

const FREQ_OPTIONS = [
  { value: 'daily', label: '일간', desc: '매일 오전 8시' },
  { value: 'weekly', label: '매주', desc: '매주 월요일 오전 8시' },
  { value: 'monthly', label: '매월', desc: '매월 1일 오전 8시' },
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
        <button onClick={() => router.back()} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold text-white">리포트 설정</h1>
      </div>

      {/* 저장 상태 */}
      <div role="status" aria-live="polite" className="min-h-6 mb-2">
        {saved && (
          <p className="text-green-400 text-sm font-medium">저장되었습니다!</p>
        )}
      </div>

      {/* 리포트 레벨 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">리포트 깊이</h2>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="리포트 깊이">
          {LEVEL_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${level === opt.value ? opt.color : 'border-gray-800 bg-gray-900'}`}
            >
              <input
                type="radio"
                name="level"
                value={opt.value}
                checked={level === opt.value}
                onChange={() => setLevel(opt.value)}
                className="sr-only"
              />
              <div className="font-semibold text-white text-sm">{opt.label}</div>
              <div className="text-gray-400 text-xs mt-1">{opt.desc}</div>
            </label>
          ))}
        </div>
      </section>

      {/* 수신 주기 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">수신 주기</h2>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="수신 주기">
          {FREQ_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${frequency === opt.value ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-gray-900'}`}
            >
              <input
                type="radio"
                name="frequency"
                value={opt.value}
                checked={frequency === opt.value}
                onChange={() => setFrequency(opt.value)}
                className="sr-only"
              />
              <div className="font-semibold text-white text-sm">{opt.label}</div>
              <div className="text-gray-400 text-xs mt-1">{opt.desc}</div>
            </label>
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
                    <input
                      type="checkbox"
                      checked={selected.includes(ind.id)}
                      onChange={() => toggleIndicator(ind.id)}
                      className="w-4 h-4 rounded accent-blue-500"
                    />
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

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition ${saved ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} disabled:opacity-50`}
      >
        <Save size={16} />
        {saved ? '저장되었습니다!' : saving ? '저장 중...' : '설정 저장'}
      </button>

      {/* 사용자 정보 표시 (로드 확인용) */}
      {user && <div className="sr-only">{user.email}</div>}
    </div>
  )
}
