'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, setAuthToken } from '@/lib/api'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isRegister) {
        await authApi.register(email, password)
      }
      const res = await authApi.login(email, password)
      // localStorage와 쿠키를 동시에 설정 — middleware.ts가 쿠키로 라우트 보호
      setAuthToken(res.data.access_token)
      router.push('/')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">MESA</h1>
          <p className="text-gray-500 text-sm mt-2">AI 경제 리포트 서비스</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="email" className="sr-only">이메일</label>
          <input id="email" type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" required />
          <label htmlFor="password" className="sr-only">비밀번호</label>
          <input id="password" type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" required />
          {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition disabled:opacity-50 text-sm">
            {loading ? '처리 중...' : isRegister ? '회원가입' : '로그인'}
          </button>
          <button type="button" onClick={() => setIsRegister(!isRegister)}
            className="w-full text-gray-500 hover:text-gray-300 text-sm transition">
            {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </form>
      </div>
    </div>
  )
}
