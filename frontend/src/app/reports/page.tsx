'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { reportsApi } from '@/lib/api'
import type { Report } from '@/lib/types'
import { FileText, RefreshCw, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const LEVEL_LABELS: Record<string, string> = { beginner: '주린이', standard: '일반', expert: '전문가' }
const LEVEL_COLORS: Record<string, string> = {
  beginner: 'text-green-400 bg-green-400/10',
  standard: 'text-blue-400 bg-blue-400/10',
  expert: 'text-purple-400 bg-purple-400/10',
}

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('mesa_token')
    if (!token) { router.push('/login'); return }
    reportsApi.list()
      .then(res => setReports(res.data))
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
            aria-label="대시보드로 돌아가기"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-2xl font-bold text-white">리포트</h1>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? '생성 중...' : '리포트 생성'}
        </button>
      </div>

      {/* 리포트 목록 */}
      {reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p>아직 생성된 리포트가 없습니다.</p>
          <p className="text-sm mt-1">상단의 &quot;리포트 생성&quot; 버튼을 눌러 첫 리포트를 받아보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <button
              key={r.id}
              data-testid="report-item"
              onClick={() => router.push(`/reports/${r.id}`)}
              className="w-full text-left bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-4 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${LEVEL_COLORS[r.level]}`}>
                  {LEVEL_LABELS[r.level]}
                </span>
                <div className="flex items-center gap-2">
                  {!r.is_read && <span className="w-2 h-2 bg-blue-400 rounded-full" />}
                  <span className="text-gray-500 text-xs">
                    {format(new Date(r.created_at), 'MM.dd HH:mm', { locale: ko })}
                  </span>
                </div>
              </div>
              <h3 className="text-white font-medium text-sm">{r.title}</h3>
              <p className="text-gray-500 text-xs mt-1 truncate">{r.summary.split('\n')[0]}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
