/**
 * Email Verification Page - WeTee MVP
 * Screen: S-004 (이메일 인증 화면)
 *
 * Based on: F-001_회원가입_및_로그인.md
 *
 * 구현 사항:
 * - 6자리 인증 코드 입력
 * - 자동 포커스 이동
 * - 인증 코드 재발송 (60초 쿨다운)
 * - 성공 시 로그인 페이지로 이동
 */

'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail, resendVerificationEmail } from '@/lib/authApi';
import { isApiError, type ApiError } from '@/lib/apiClient';

// 인증 코드 자릿수
const CODE_LENGTH = 6;
// 재발송 쿨다운 시간 (초)
const RESEND_COOLDOWN = 60;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  // 각 자리 입력값
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 상태
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 재발송 쿨다운
  const [cooldown, setCooldown] = useState(0);

  // 쿨다운 타이머
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 첫 번째 입력 필드에 자동 포커스
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 입력 핸들러
  const handleChange = (index: number, value: string) => {
    // 숫자만 허용
    const digit = value.replace(/\D/g, '').slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // 다음 필드로 자동 이동
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // 모든 자리가 입력되면 자동 제출
    if (digit && index === CODE_LENGTH - 1) {
      const fullCode = newCode.join('');
      if (fullCode.length === CODE_LENGTH) {
        handleVerify(fullCode);
      }
    }
  };

  // 키 입력 핸들러 (백스페이스)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 붙여넣기 핸들러
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);

    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);

      // 마지막 입력 필드로 포커스 이동
      const focusIndex = Math.min(pastedData.length, CODE_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();

      // 전체 코드가 입력되면 자동 제출
      if (pastedData.length === CODE_LENGTH) {
        handleVerify(pastedData);
      }
    }
  };

  // 인증 확인
  const handleVerify = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join('');

    if (codeToVerify.length !== CODE_LENGTH) {
      setErrorMessage('6자리 인증 코드를 모두 입력해주세요.');
      return;
    }

    if (!email) {
      setErrorMessage('이메일 정보가 없습니다. 회원가입을 다시 진행해주세요.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const result = await verifyEmail({
        email,
        code: codeToVerify,
      });

      if (result.verified) {
        setSuccessMessage('이메일 인증이 완료되었습니다! 로그인 페이지로 이동합니다.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      if (isApiError(error)) {
        const err = error as ApiError;
        if (err.status === 400) {
          setErrorMessage('잘못된 인증 코드입니다. 다시 확인해주세요.');
        } else if (err.status === 410) {
          setErrorMessage('인증 코드가 만료되었습니다. 새 코드를 요청해주세요.');
        } else {
          setErrorMessage(err.message || '인증 중 오류가 발생했습니다.');
        }
      } else {
        setErrorMessage('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }

      // 코드 초기화
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // 코드 재발송
  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      await resendVerificationEmail({ email });
      setCooldown(RESEND_COOLDOWN);
      setSuccessMessage('인증 코드가 재발송되었습니다. 이메일을 확인해주세요.');

      // 3초 후 성공 메시지 제거
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (isApiError(error)) {
        const err = error as ApiError;
        if (err.status === 429) {
          setErrorMessage('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
          setCooldown(RESEND_COOLDOWN);
        } else {
          setErrorMessage(err.message || '재발송 중 오류가 발생했습니다.');
        }
      } else {
        setErrorMessage('네트워크 오류가 발생했습니다.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* 로고 & 타이틀 */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-blue-600">WeTee</h1>
          </Link>
          <p className="mt-2 text-gray-600">과외의 모든 것, 하나로</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-2">이메일 인증</h2>
          <p className="text-center text-gray-600 mb-6">
            {email ? (
              <>
                <span className="font-medium text-blue-600">{email}</span>
                <br />
                으로 발송된 6자리 인증 코드를 입력해주세요.
              </>
            ) : (
              '이메일로 발송된 6자리 인증 코드를 입력해주세요.'
            )}
          </p>

          {/* 인증 코드 입력 필드 */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: CODE_LENGTH }).map((_, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isVerifying || !!successMessage}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                aria-label={`인증 코드 ${index + 1}번째 자리`}
              />
            ))}
          </div>

          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{errorMessage}</p>
            </div>
          )}

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 text-center">{successMessage}</p>
            </div>
          )}

          {/* 인증 버튼 */}
          <button
            onClick={() => handleVerify()}
            disabled={isVerifying || code.join('').length !== CODE_LENGTH || !!successMessage}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mb-4"
          >
            {isVerifying ? '인증 확인 중...' : '인증 확인'}
          </button>

          {/* 재발송 버튼 */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">인증 코드를 받지 못하셨나요?</p>
            <button
              onClick={handleResend}
              disabled={isResending || cooldown > 0 || !!successMessage}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isResending
                ? '발송 중...'
                : cooldown > 0
                ? `재발송 (${cooldown}초)`
                : '인증 코드 재발송'}
            </button>
          </div>
        </div>

        {/* 로그인 페이지 링크 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            이미 인증을 완료하셨나요?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
