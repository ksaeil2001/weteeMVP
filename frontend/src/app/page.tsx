/**
 * Root Page - WeTee MVP
 *
 * 이 파일은 Next.js 기본 루트 페이지입니다.
 * 실제 "/" 경로는 src/app/(main)/page.tsx에서 처리됩니다.
 *
 * Next.js 라우팅 우선순위:
 * 1. src/app/(main)/page.tsx - Route Group, MainLayout 적용
 * 2. src/app/page.tsx - 기본 루트 (현재 파일)
 *
 * (main) Route Group이 layout.tsx를 가지고 있으므로,
 * 실제로는 (main)/page.tsx가 "/" 경로를 담당합니다.
 *
 * 이 파일은 Next.js 초기 설정에서 자동 생성된 것이며,
 * Step 5에서 정리를 위해 리다이렉트 페이지로 변경합니다.
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  // (main) Route Group으로 리다이렉트
  // 미들웨어에서 이미 인증 체크를 하므로,
  // 여기서는 단순히 리다이렉트만 수행
  redirect('/');
}
