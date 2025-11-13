/**
 * Login Page - WeTee MVP (임시)
 * Screen: S-003 (로그인 화면)
 *
 * Step 3 테스트용 임시 로그인 페이지
 * TODO (Step 5): 실제 로그인 UI 구현 (UX_UI_설계서.md Section 4.2 참조)
 * TODO: 이메일/비밀번호 입력 폼
 * TODO: 소셜 로그인 버튼
 * TODO: 회원가입 링크
 * TODO: 비밀번호 찾기 링크
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // 테스트용 가짜 로그인 (쿠키 설정)
  const handleTestLogin = () => {
    // 쿠키에 임시 토큰 설정 (1일 유효)
    const expires = new Date();
    expires.setDate(expires.getDate() + 1);
    document.cookie = `wetee_access_token=dummy_token_for_testing; expires=${expires.toUTCString()}; path=/`;

    // 메인 페이지로 이동
    router.push('/');
    router.refresh(); // 미들웨어 재실행을 위해 새로고침
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        {/* 로고 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">WeTee</h1>
          <p className="mt-2 text-gray-600">과외의 모든 것, 하나로</p>
        </div>

        {/* Step 3 테스트 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-yellow-900 mb-2">
            ⚠️ Step 3 테스트 페이지
          </h2>
          <p className="text-xs text-yellow-800">
            이 페이지는 Route Guard 테스트용 임시 페이지입니다.
            <br />
            실제 로그인 UI는 Step 5에서 구현됩니다.
          </p>
        </div>

        {/* 테스트용 로그인 버튼 */}
        <div className="space-y-4">
          <button
            onClick={handleTestLogin}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            테스트 로그인 (쿠키 설정)
          </button>

          <p className="text-xs text-gray-600 text-center">
            위 버튼을 클릭하면 쿠키에 <code className="bg-gray-100 px-1 rounded">wetee_access_token</code>이
            설정되고 메인 페이지로 이동합니다.
          </p>
        </div>

        {/* 미들웨어 동작 확인 가이드 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            ✅ Route Guard 동작 확인
          </h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>1. 이 페이지는 비로그인 전용 (로그인 시 / 로 리다이렉트)</li>
            <li>2. 테스트 로그인 클릭 → 쿠키 설정 → / 로 이동</li>
            <li>3. 로그인 상태에서 /login 접근 시 → / 로 리다이렉트</li>
            <li>4. 개발자 도구에서 쿠키 삭제 후 → / 접근 시 → /login으로 리다이렉트</li>
          </ul>
        </div>

        {/* 수동 테스트 가이드 */}
        <details className="mt-4">
          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
            📋 수동 테스트 방법 (콘솔 사용)
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded text-xs space-y-2">
            <div>
              <strong>쿠키 설정:</strong>
              <pre className="mt-1 p-2 bg-white border rounded overflow-x-auto text-[10px]">
                {`document.cookie = "wetee_access_token=dummy; path=/";`}
              </pre>
            </div>
            <div>
              <strong>쿠키 삭제:</strong>
              <pre className="mt-1 p-2 bg-white border rounded overflow-x-auto text-[10px]">
                {`document.cookie = "wetee_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";`}
              </pre>
            </div>
            <div>
              <strong>쿠키 확인:</strong>
              <pre className="mt-1 p-2 bg-white border rounded overflow-x-auto text-[10px]">
                {`document.cookie`}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
