/**
 * Auth Type Definitions
 * Step 11-12: 인증(Auth) 관련 타입 정의
 *
 * 역할:
 * - F-001(회원가입 및 로그인) API 연동을 위한 공통 타입 정의
 * - 로그인/회원가입 요청/응답, 사용자 정보 타입 등 프론트엔드에서 재사용되는 타입의 단일 소스
 *
 * 관련 문서:
 * - F-001_회원가입_및_로그인.md
 * - API_명세서.md - F-001 섹션
 *
 * TODO: 추후 비밀번호 재설정, 이메일 인증 등으로 확장 예정
 * - AuthSession 타입 (사용자 + 토큰 + 만료 정보)
 * - TokenMeta (expiresAt, issuedAt 등)
 * - AuthErrorShape (code, message, fieldErrors 등)
 * - EmailVerificationRequest / EmailVerificationResponse
 * - ResendVerificationEmailPayload
 * - PasswordResetRequest / PasswordResetConfirmPayload
 * - RegisterValidationErrorShape (필드별 에러 매핑용)
 * - SocialLoginPayload / SocialRegisterPayload (구글/카카오 등)
 */

/**
 * 사용자 역할 코드
 * - TEACHER: 선생님
 * - STUDENT: 학생
 * - PARENT: 학부모
 */
export type UserRoleCode = 'TEACHER' | 'STUDENT' | 'PARENT';

/**
 * 인증된 사용자 정보
 *
 * 참고: 백엔드 응답은 snake_case(user_id)이지만,
 * 프론트엔드에서는 camelCase(userId)로 변환하여 사용
 */
export interface AuthUser {
  /** 사용자 ID (백엔드 user_id) */
  userId: string;

  /** 이메일 주소 */
  email: string;

  /** 사용자 이름 */
  name: string;

  /** 역할 코드 */
  role: UserRoleCode;
}

/**
 * 로그인 요청 페이로드
 *
 * API 엔드포인트: POST /api/v1/auth/login
 */
export interface LoginRequestPayload {
  /** 이메일 주소 */
  email: string;

  /** 비밀번호 */
  password: string;

  /**
   * 디바이스 정보 (선택)
   * 생략 시 authApi에서 기본값('web') 자동 설정
   */
  deviceInfo?: {
    /** 디바이스 타입 (예: 'web', 'mobile') */
    deviceType: string;

    /** OS 정보 (예: 'Windows', 'macOS', 'iOS', 'Android') */
    os: string;

    /** 앱 버전 (예: 'web-1.0.0') */
    appVersion: string;
  };
}

/**
 * 로그인 응답 데이터
 *
 * 참고: 백엔드 응답 구조는 { success: true, data: LoginResponseData }
 * 여기서는 data 필드 내부 구조만 정의
 */
export interface LoginResponseData {
  /** Access Token (JWT) */
  accessToken: string;

  /** Refresh Token */
  refreshToken: string;

  /** 로그인한 사용자 정보 */
  user: AuthUser;
}

/**
 * 회원가입 요청 페이로드
 *
 * API 엔드포인트: POST /api/v1/auth/register
 *
 * 참고:
 * - role은 반드시 대문자 형태('TEACHER' | 'STUDENT' | 'PARENT')로 전송
 * - profile은 선택 필드이며, 값이 없을 경우 요청 바디에서 생략 가능
 * - inviteCode는 STUDENT/PARENT 역할일 때 필수
 */
export interface RegisterRequestPayload {
  /** 이메일 주소 */
  email: string;

  /** 비밀번호 */
  password: string;

  /** 사용자 이름 */
  name: string;

  /** 전화번호 */
  phone: string;

  /** 역할 코드 */
  role: UserRoleCode;

  /**
   * 초대 코드 (STUDENT/PARENT 필수)
   * 선생님으로부터 받은 6자리 코드
   */
  inviteCode?: string;

  /**
   * 프로필 추가 정보 (선택)
   * 선생님/학생의 경우 과목, 학교 정보 등을 포함
   */
  profile?: {
    /** 과목 목록 (예: ['수학', '영어']) */
    subjects?: string[];

    /** 학교 이름 (재학 중인 학교 또는 출신 학교) */
    school?: string;
  };
}

/**
 * 초대 코드 검증 요청 페이로드
 *
 * API 엔드포인트: POST /api/v1/auth/verify-invite-code
 */
export interface VerifyInviteCodeRequestPayload {
  /** 6자리 초대 코드 */
  code: string;

  /** 가입하려는 역할 (STUDENT/PARENT) */
  roleType: 'STUDENT' | 'PARENT';
}

/**
 * 초대 코드 검증 응답 데이터
 */
export interface VerifyInviteCodeResponseData {
  /** 코드 유효 여부 */
  valid: boolean;

  /** 그룹 ID */
  groupId: string;

  /** 그룹 이름 */
  groupName: string;

  /** 선생님 이름 */
  teacherName: string;

  /** 과목 */
  subject: string;

  /** 만료 시각 (ISO 8601) */
  expiresAt: string;
}

/**
 * 회원가입 응답 데이터
 *
 * 참고: 백엔드 응답 구조는 { success: true, data: RegisterResponseData }
 * 여기서는 data 필드 내부 구조만 정의
 */
export interface RegisterResponseData {
  /** 생성된 사용자 ID */
  userId: string;

  /** 이메일 주소 */
  email: string;

  /** 사용자 이름 */
  name: string;

  /** 역할 코드 */
  role: UserRoleCode;

  /** 이메일 인증 여부 (가입 직후에는 false) */
  emailVerified: boolean;
}

/**
 * 인증 토큰 쌍
 *
 * - accessToken: API 호출 시 Authorization 헤더에 사용
 * - refreshToken: accessToken 만료 시 갱신 요청에 사용
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * 토큰 갱신 요청 페이로드
 *
 * API 엔드포인트: POST /api/v1/auth/refresh
 */
export interface RefreshTokenRequestPayload {
  refreshToken: string;
}

/**
 * 토큰 갱신 응답 데이터
 *
 * 참고: 백엔드 응답 구조는 { success: true, data: RefreshTokenResponseData }
 * 여기서는 data 필드 내부 구조만 정의
 */
export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
}
