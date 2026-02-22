'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { reportsApi } from '@/lib/api'
import { ArrowLeft, Printer } from 'lucide-react'

export default function ReportPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 인증 체크는 middleware.ts가 중앙 처리 — 여기서는 데이터 로드만 담당
    reportsApi.getHtml(Number(params.id))
      .then(res => setHtml(res.data))
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [params.id, router])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400 text-sm">리포트 로딩 중...</div>
    </div>
  )

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition">
            <ArrowLeft size={16} /> 돌아가기
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition">
            <Printer size={16} /> 인쇄
          </button>
        </div>
      </div>
      <article data-testid="report-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
