/**
 * Common API Client
 * Step 11: 공통 API 클라이언트 (REST 호출 헬퍼)
 *
 * 역할:
 * - Base URL, 공통 헤더, 공통 성공/에러 처리를 담당하는 API 클라이언트
 * - 로그인뿐 아니라 이후 F-002~F-008의 모든 REST 호출에서 재사용 가능한 최소 클라이언트 레이어
 *
 * 관련 문서:
 * - API_명세서.md - 공통 응답 구조 섹션
 * - 기술스택_설계서.md - 프론트엔드 API 연동 구조
 *
 * TODO: 인터셉터(토큰 자동 첨부), 공통 에러 핸들링, 로깅 등으로 확장 예정
 * - Authorization 헤더 자동 첨부 (Step 13~14에서 구현)
 * - 토큰 자동 갱신 로직
 * - 요청/응답 로깅 (개발 환경)
 * - 공통 에러 처리 미들웨어
 */

/**
 * API Base URL 설정
 *
 * 환경 변수에서 우선 읽고, 없으면 기본값(localhost:8000) 사용
 * - 개발: http://localhost:8000/api/v1
 * - 운영: 환경 변수로 주입 예정
 */
const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

/**
 * API 에러 타입
 *
 * 백엔드 에러 응답 구조를 프론트엔드에서 처리하기 위한 타입
 */
export interface ApiError extends Error {
  /** HTTP 상태 코드 (예: 400, 401, 500) */
  status?: number;

  /** 에러 코드 (예: 'AUTH004', 'GROUP002') */
  code?: string;

  /** 추가 에러 상세 정보 */
  details?: unknown;
}

/**
 * 공통 API 요청 함수
 *
 * @param path API 경로 (예: '/auth/login', '/groups')
 * @param options fetch RequestInit 옵션
 * @returns API 응답 data 필드
 *
 * @throws {ApiError} API 호출 실패 시 에러 발생
 *
 * @example
 * ```ts
 * const user = await apiRequest<UserData>('/auth/login', {
 *   method: 'POST',
 *   body: JSON.stringify({ email, password }),
 * });
 * ```
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body,
  });

  // JSON 파싱 시도 (실패하면 null)
  const json = await response.json().catch(() => null);

  // 공통 응답 구조: { success: boolean, data, error, meta }
  // success가 false이거나 HTTP 상태가 오류인 경우 에러 발생
  if (!response.ok || !json?.success) {
    const err: ApiError = new Error(
      json?.error?.message ?? '요청 처리 중 오류가 발생했습니다.',
    );
    err.status = response.status;
    err.code = json?.error?.code;
    err.details = json?.error?.details;
    throw err;
  }

  return json.data as T;
}
