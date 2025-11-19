/**
 * Common API Client
 * Step 11-13: 공통 API 클라이언트 (REST 호출 헬퍼)
 *
 * 역할:
 * - Base URL, 공통 헤더, 공통 성공/에러 처리를 담당하는 API 클라이언트
 * - 로그인뿐 아니라 이후 F-002~F-008의 모든 REST 호출에서 재사용 가능한 최소 클라이언트 레이어
 * - Step 13: Access Token 공급자 패턴을 통한 Authorization 헤더 자동 첨부
 * - 토큰 자동 갱신 로직 (401 발생 시)
 *
 * 관련 문서:
 * - API_명세서.md - 공통 응답 구조 섹션, 3.1 JWT 인증
 * - 기술스택_설계서.md - 프론트엔드 API 연동 구조
 * - F-001 회원가입 및 로그인
 *
 * TODO: 추가 개선 예정
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
 * API 요청 타임아웃 설정 (밀리초)
 *
 * - 기본값: 30초 (30000ms)
 * - 느린 네트워크 환경에서도 안정적으로 처리하기 위한 시간
 * - 개별 요청에서 필요시 override 가능
 */
export const DEFAULT_TIMEOUT = 30000;

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
 * Token refresh state
 *
 * - isRefreshing: 현재 토큰 갱신 중인지 여부 (동시 갱신 방지)
 * - failedQueue: 토큰 갱신 대기 중인 요청들
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

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
 * Process queued requests after token refresh
 *
 * @param error 토큰 갱신 실패 시 에러 객체
 */
function processQueue(error: ApiError | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });

  failedQueue = [];
}

/**
 * Refresh access token using httpOnly cookie
 *
 * 토큰 갱신 로직:
 * 1. /auth/refresh 엔드포인트 호출 (refreshToken은 httpOnly 쿠키에서 자동 전송)
 * 2. 갱신 성공 시 새 토큰이 httpOnly 쿠키로 자동 설정됨
 * 3. 갱신 실패 시 로그인 페이지로 이동
 *
 * @returns 갱신 성공 시 resolve, 실패 시 reject
 */
async function refreshToken(): Promise<void> {
  const url = `${API_BASE_URL}/auth/refresh`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include', // httpOnly 쿠키 전송
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error('Token refresh failed');
    }

    // 갱신 성공 - 새 토큰은 httpOnly 쿠키에 자동으로 설정됨
  } catch (error) {
    // 갱신 실패 - 로그인 페이지로 이동
    if (typeof window !== 'undefined') {
      // 클라이언트 사이드에서만 리다이렉트
      window.location.href = '/login?session_expired=true';
    }
    throw error;
  }
}

/**
 * API Response Error Structure
 */
interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  success?: boolean;
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
 * ApiError 타입 가드
 *
 * unknown 타입의 에러 객체가 ApiError 인터페이스를 구현하는지 확인합니다.
 * 주로 catch 블록에서 에러 타입을 좁혀서 status, code 등을 안전하게 접근할 때 사용합니다.
 *
 * @param error 검사할 에러 객체
 * @returns ApiError 타입이면 true, 아니면 false
 *
 * @example
 * ```ts
 * try {
 *   await registerWithEmail({ ... });
 * } catch (error) {
 *   if (isApiError(error) && error.status === 409) {
 *     alert('이미 가입된 이메일입니다.');
 *   }
 * }
 * ```
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && 'status' in error;
}

/**
 * 공통 API 요청 함수 (토큰 자동 갱신 + 타임아웃 포함)
 *
 * 토큰 갱신 플로우:
 * 1. 401 Unauthorized 응답 시 자동으로 토큰 갱신 시도
 * 2. 갱신 성공 시 원래 요청 재시도 (최대 1회)
 * 3. 갱신 실패 시 로그인 페이지로 이동
 * 4. 동시 갱신 방지: isRefreshing 플래그로 중복 갱신 방지
 *
 * 타임아웃 처리:
 * 1. AbortController를 사용하여 타임아웃 구현
 * 2. 기본 타임아웃: 30초 (DEFAULT_TIMEOUT)
 * 3. 개별 요청에서 timeout 파라미터로 override 가능
 *
 * @param path API 경로 (예: '/auth/login', '/groups')
 * @param options fetch RequestInit 옵션
 * @param _retry 재시도 여부 (내부 사용, 무한 재시도 방지)
 * @param timeout 타임아웃 시간(ms), 기본값: DEFAULT_TIMEOUT (30초)
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
  _retry = true,
  timeout: number = DEFAULT_TIMEOUT,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  // AbortController 설정 (타임아웃 처리용)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: defaultHeaders,
      body: options.body,
      credentials: 'include', // httpOnly 쿠키 자동 전송 (보안 강화)
      signal: controller.signal, // 타임아웃용 AbortSignal
    });
  } catch (error) {
    clearTimeout(timeoutId);

    // 타임아웃 에러 처리
    if (error instanceof Error && error.name === 'AbortError') {
      const err: ApiError = new Error(
        `요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요. (${timeout / 1000}초)`,
      );
      err.status = 408; // Request Timeout
      err.code = 'TIMEOUT';
      throw err;
    }

    // 네트워크 에러 처리 (연결 실패, DNS 실패 등)
    if (error instanceof TypeError) {
      const err: ApiError = new Error(
        '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
      );
      err.status = 0; // 네트워크 에러는 status 0
      err.code = 'NETWORK_ERROR';
      throw err;
    }

    // 기타 에러
    throw error;
  } finally {
    // 타임아웃 타이머 정리
    clearTimeout(timeoutId);
  }

  // JSON 파싱 시도 (실패하면 null)
  let json: Record<string, unknown> | null = null;
  try {
    json = await response.json();
  } catch {
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

  // 401 Unauthorized 처리 - 토큰 자동 갱신
  if (response.status === 401 && _retry && path !== '/auth/refresh') {
    if (isRefreshing) {
      // 이미 토큰 갱신 중이면 큐에 대기
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        // 갱신 완료 후 원래 요청 재시도 (재시도 플래그 false로 설정, timeout 유지)
        return apiRequest<T>(path, options, false, timeout);
      });
    }

    // 토큰 갱신 시작
    isRefreshing = true;

    try {
      await refreshToken();
      // 갱신 성공 - 대기 중인 요청들 처리
      processQueue();
      isRefreshing = false;

      // 원래 요청 재시도 (재시도 플래그 false로 설정하여 무한 재시도 방지, timeout 유지)
      return apiRequest<T>(path, options, false, timeout);
    } catch {
      // 갱신 실패 - 대기 중인 요청들 모두 실패 처리
      const err: ApiError = new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
      err.status = 401;
      err.code = 'AUTH005';
      processQueue(err);
      isRefreshing = false;
      throw err;
    }
  }

  // 공통 응답 구조: { success: boolean, data, error, meta }
  // HTTP 상태 코드가 오류(4xx, 5xx)이거나 success가 명시적으로 false인 경우 에러 발생
  // 참고: HTTP 2xx (200 OK, 201 Created 등)는 모두 성공으로 처리
  if (!response.ok || (json && typeof json === 'object' && 'success' in json && json.success === false)) {
    const apiErrorResponse = json as ApiErrorResponse | null;
    const err: ApiError = new Error(
      (apiErrorResponse?.error?.message) ??
        `요청 처리 중 오류가 발생했습니다 (HTTP ${response.status})`,
    );
    err.status = response.status;
    err.code = apiErrorResponse?.error?.code ?? `HTTP_${response.status}`;
    err.details = apiErrorResponse?.error?.details;
    throw err;
  }

  if (!json || typeof json !== 'object') {
    throw new Error('Invalid API response format');
  }

  return (json as Record<string, T>).data;
}
