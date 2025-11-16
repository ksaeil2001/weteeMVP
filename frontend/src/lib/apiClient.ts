/**
 * Common API Client
 * Step 11-13: 공통 API 클라이언트 (REST 호출 헬퍼)
 *
 * 역할:
 * - Base URL, 공통 헤더, 공통 성공/에러 처리를 담당하는 API 클라이언트
 * - 로그인뿐 아니라 이후 F-002~F-008의 모든 REST 호출에서 재사용 가능한 최소 클라이언트 레이어
 * - Step 13: Access Token 공급자 패턴을 통한 Authorization 헤더 자동 첨부
 *
 * 관련 문서:
 * - API_명세서.md - 공통 응답 구조 섹션
 * - 기술스택_설계서.md - 프론트엔드 API 연동 구조
 *
 * TODO: 인터셉터, 공통 에러 핸들링, 로깅 등으로 확장 예정
 * - 토큰 자동 갱신 로직 (401/403 발생 시)
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
 * Access Token 공급자 함수 타입
 *
 * - 토큰이 없으면 null 또는 undefined 를 반환
 * - authStore에서 토큰을 가져오는 콜백을 등록할 때 사용
 */
type AccessTokenProvider = () => string | null;

/**
 * Access Token 공급자 인스턴스
 *
 * - useAuth 훅에서 setAccessTokenProvider를 통해 등록
 * - apiRequest에서 이 함수를 호출하여 토큰을 가져옴
 */
let accessTokenProvider: AccessTokenProvider | null = null;

/**
 * Access Token 공급자 등록 함수
 *
 * - useAuth 훅(또는 authStore)에서 토큰 조회 함수를 전달
 * - apiRequest는 이 함수를 통해 Authorization 헤더를 자동으로 설정
 *
 * @param provider 토큰을 반환하는 콜백 함수
 *
 * @example
 * ```ts
 * setAccessTokenProvider(() => {
 *   const state = useAuthStore.getState();
 *   return state.accessToken ?? null;
 * });
 * ```
 */
export function setAccessTokenProvider(provider: AccessTokenProvider) {
  accessTokenProvider = provider;
}

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

  // 기본 헤더 설정
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  // Access Token이 있으면 Authorization 헤더 자동 첨부
  if (accessTokenProvider) {
    const token = accessTokenProvider();
    if (token) {
      (defaultHeaders as Record<string, string>)['Authorization'] =
        `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: defaultHeaders,
    body: options.body,
  });

  // JSON 파싱 시도 (실패하면 null)
  let json: any = null;
  try {
    json = await response.json();
  } catch (parseError) {
    // JSON 파싱 실패 → 서버가 HTML 에러 페이지를 반환했을 가능성
    if (!response.ok) {
      const err: ApiError = new Error(
        `서버 오류가 발생했습니다 (HTTP ${response.status})`,
      );
      err.status = response.status;
      err.code = `HTTP_${response.status}`;
      throw err;
    }
  }

  // 공통 응답 구조: { success: boolean, data, error, meta }
  // success가 false이거나 HTTP 상태가 오류인 경우 에러 발생
  if (!response.ok || !json?.success) {
    const err: ApiError = new Error(
      json?.error?.message ??
        `요청 처리 중 오류가 발생했습니다 (HTTP ${response.status})`,
    );
    err.status = response.status;
    err.code = json?.error?.code ?? `HTTP_${response.status}`;
    err.details = json?.error?.details;
    throw err;
  }

  return json.data as T;
}
