/**
 * Next.js Middleware - WeTee MVP
 *
 * Route Guard: 인증 상태에 따라 페이지 접근 제어
 * Based on: F-001_회원가입_및_로그인.md
 *
 * 라우팅 규칙:
 * 1. 비로그인 상태:
 *    - (main) 그룹 하위 페이지 접근 시 → /login 리다이렉트
 *    - 예: /, /dashboard, /groups, /schedule 등
 *
 * 2. 로그인 상태:
 *    - (auth) 그룹 하위 페이지 접근 시 → / 리다이렉트
 *    - 예: /login, /signup, /reset-password 등
 *
 * 3. 공개 페이지:
 *    - /api/* : API 라우트 (제외)
 *    - /_next/* : Next.js 내부 리소스 (제외)
 *    - /favicon.ico, /images/* 등 정적 파일 (제외)
 *
 * 인증 확인 방법 (임시):
 * - 쿠키에 `wetee_access_token` 존재 여부로 판단
 *
 * TODO (향후 구현):
 * - JWT 토큰 검증 (서버 사이드)
 * - 역할별 권한 체크 (teacher/student/parent)
 * - 토큰 만료 체크 및 자동 갱신
 * - 백엔드 API와 연동하여 실제 인증 검증
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 인증이 필요한 경로 (로그인 필수)
 * (main) Route Group 하위 모든 경로
 */
const PROTECTED_PATHS = [
  '/',
  '/dashboard',
  '/groups',
  '/schedule',
  '/attendance',
  '/lessons',
  '/payments',
  '/notifications',
  '/settings',
  '/profile',
];

/**
 * 비로그인 전용 경로 (로그인 상태에서는 접근 불가)
 * (auth) Route Group 하위 모든 경로
 */
const AUTH_PATHS = [
  '/login',
  '/signup',
  '/reset-password',
  '/verify-email',
];

/**
 * 미들웨어에서 제외할 경로 (항상 접근 허용)
 */
const PUBLIC_PATHS = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
];

/**
 * Route Guard 미들웨어
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 공개 경로는 바로 통과
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. 인증 상태 확인 (임시: 쿠키로 판단)
  const accessToken = request.cookies.get('wetee_access_token')?.value;
  const isAuthenticated = !!accessToken;

  // 3. 보호된 경로 접근 체크
  const isProtectedPath = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  const isAuthPath = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // 4-1. 비로그인 상태에서 보호된 경로 접근 → /login으로 리다이렉트
  if (!isAuthenticated && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    // 로그인 후 원래 페이지로 돌아가기 위해 redirect 파라미터 추가
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4-2. 로그인 상태에서 인증 페이지 접근 → / (대시보드)로 리다이렉트
  if (isAuthenticated && isAuthPath) {
    const redirectPath = request.nextUrl.searchParams.get('redirect') || '/';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // 5. 그 외 모든 요청은 통과
  return NextResponse.next();
}

/**
 * 미들웨어 실행 조건 설정
 *
 * matcher: 미들웨어가 실행될 경로 패턴
 * - /(.*): 모든 경로에서 실행
 * - 단, /_next/static, /_next/image, /favicon.ico는 제외
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
