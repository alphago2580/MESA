'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { reportsApi, authApi } from '@/lib/api'
import type { Report, User } from '@/lib/types'
import { Settings, FileText, RefreshCw, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const LEVEL_LABELS = { beginner: '주린이', standard: '일반', expert: '전문가' }
const LEVEL_COLORS = { beginner: 'text-green-400 bg-green-400/10', standard: 'text-blue-400 bg-blue-400/10', expert: 'text-purple-400 bg-purple-400/10' }

export default function Dashboard() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('mesa_token')
    if (!token) { router.push('/login'); return }
    Promise.all([authApi.me(), reportsApi.list()])
      .then(([userRes, reportsRes]) => {
        setUser(userRes.data)
        setReports(reportsRes.data)
      })
      .catch(() => { localStorage.removeItem('mesa_token'); router.push('/login') })
      .finally(() => setLoading(false))
  }, [router])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await reportsApi.generate()
      const res = await reportsApi.list()
      setReports(res.data)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400 text-sm">로딩 중...</div>
    </div>
  )

  const latestReport = reports[0]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">MESA</h1>
          <p className="text-gray-500 text-sm mt-1">AI 경제 리포트 서비스</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
            <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
            {generating ? '생성 중...' : '리포트 생성'}
          </button>
          <button onClick={() => router.push('/settings')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition">
            <Settings size={18} />
          </button>
          <button onClick={() => { localStorage.removeItem('mesa_token'); router.push('/login') }}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-gray-400">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* 사용자 설정 요약 */}
      {user && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex gap-6 text-sm">
          <div><span className="text-gray-500">리포트 레벨</span><span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${LEVEL_COLORS[user.report_level]}`}>{LEVEL_LABELS[user.report_level]}</span></div>
          <div><span className="text-gray-500">수신 주기</span><span className="ml-2 text-white">{user.report_frequency === 'daily' ? '매일' : user.report_frequency === 'weekly' ? '매주 월요일' : '매월 1일'}</span></div>
          <div><span className="text-gray-500">선택 지표</span><span className="ml-2 text-white">{user.selected_indicators.length}개</span></div>
        </div>
      )}

      {/* 최신 리포트 Executive Summary */}
      {latestReport && (
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">최신 리포트</span>
            <span className="text-gray-500 text-xs">{format(new Date(latestReport.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-4">{latestReport.title}</h2>
          <div className="space-y-2">
            {latestReport.summary.split('\n').filter(Boolean).map((line, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-blue-400 font-bold">{i + 1}</span>
                <span className="text-gray-300">{line}</span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push(`/reports/${latestReport.id}`)}
            className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium transition">
            전체 리포트 보기 →
          </button>
        </div>
      )}

      {/* 리포트 목록 */}
      <div>
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <FileText size={16} /> 리포트 목록
        </h2>
        {reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>아직 생성된 리포트가 없습니다.</p>
            <p className="text-sm mt-1">상단의 &quot;리포트 생성&quot; 버튼을 눌러 첫 리포트를 받아보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <button key={r.id} onClick={() => router.push(`/reports/${r.id}`)}
                className="w-full text-left bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-4 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLORS[r.level]}`}>{LEVEL_LABELS[r.level]}</span>
                  <div className="flex items-center gap-2">
                    {!r.is_read && <span className="w-2 h-2 bg-blue-400 rounded-full" />}
                    <span className="text-gray-500 text-xs">{format(new Date(r.created_at), 'MM.dd HH:mm')}</span>
                  </div>
                </div>
                <h3 className="text-white font-medium text-sm">{r.title}</h3>
                <p className="text-gray-500 text-xs mt-1 truncate">{r.summary.split('\n')[0]}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
