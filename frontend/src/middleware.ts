import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 인증이 필요 없는 공개 라우트
 */
const PUBLIC_ROUTES = ['/login']

/**
 * 로그인된 사용자가 접근하면 홈으로 리다이렉트할 라우트
 */
const AUTH_ONLY_ROUTES = ['/login']

const AUTH_COOKIE_NAME = 'mesa_token'

/**
 * 인증 보호 미들웨어
 *
 * 기존에 각 페이지(page.tsx)에서 개별적으로 수행하던
 * localStorage.getItem('mesa_token') 체크를 서버 사이드에서 중앙화.
 *
 * Next.js middleware는 Edge Runtime에서 실행되므로 localStorage 대신
 * 쿠키(mesa_token)를 사용해 인증 상태를 확인.
 * 로그인 시 api.ts의 setAuthToken()이 쿠키와 localStorage를 동시에 설정.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const { pathname } = request.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // 미인증 사용자가 보호된 라우트 접근 → /login 리다이렉트
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 인증된 사용자가 로그인 페이지 접근 → 홈으로 리다이렉트
  if (token && AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 미들웨어 적용:
     * - api routes
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - 정적 에셋 (아이콘, manifest, sw.js 등)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
}
