# WeTee MVP - 인증(Auth) 기능 구현 가이드

## 개요

이 문서는 WeTee MVP 프론트엔드의 **F-001 회원가입 및 로그인** 기능 구현에 대한 테스트 시나리오와 사용 가이드를 제공합니다.

### 구현된 기능

- ✅ 이메일/비밀번호 기반 회원가입 (POST `/api/v1/auth/register`)
- ✅ 이메일/비밀번호 기반 로그인 (POST `/api/v1/auth/login`)
- ✅ JWT 토큰 기반 인증 (Access Token + Refresh Token)
- ✅ 현재 사용자 정보 조회 (GET `/api/v1/auth/account`)
- ✅ 자동 로그인 복원 (페이지 새로고침 시 토큰으로 사용자 정보 복원)
- ✅ Protected Route Guard (인증이 필요한 페이지 접근 제어)
- ✅ 전역 인증 상태 관리 (Zustand)
- ✅ 토큰 저장 및 관리 (쿠키 + localStorage)

### 관련 문서

- `F-001_회원가입_및_로그인.md` - 기능 명세서
- `UX_UI_설계서.md` - UI/UX 설계 (S-003: 로그인, S-004: 회원가입)
- `API_명세서.md` - API 스펙 (F-001 섹션)
- `데이터베이스_설계서.md` - DB 설계 (users, teachers, students, parents 테이블)

---

## 파일 구조

### 새로 추가된 파일

```
frontend/
├── src/
│   ├── components/
│   │   └── providers/
│   │       └── AuthProvider.tsx              # 앱 초기화 시 자동 로그인 복원
│   └── app/
│       └── layout.tsx                         # AuthProvider 적용 (수정됨)
├── .env.local                                 # 환경 변수 (API Base URL)
├── .env.local.example                         # 환경 변수 예시 파일
└── README_AUTH.md                             # 이 문서
```

### 기존 파일 수정

```
frontend/src/
├── lib/
│   ├── authApi.ts                            # getCurrentAccount() 함수 추가
│   └── hooks/
│       └── useAuth.ts                        # loadMe() 함수 추가
```

### 기존 구현 (이미 존재하던 파일)

```
frontend/src/
├── lib/
│   ├── apiClient.ts                          # Axios 기반 API 클라이언트
│   ├── authApi.ts                            # 인증 API (login, register, refresh)
│   └── hooks/
│       └── useAuth.ts                        # Zustand 기반 전역 Auth 상태 관리
├── middleware.ts                             # Next.js 미들웨어 (Protected Route Guard)
└── app/
    └── (auth)/
        ├── login/
        │   └── page.tsx                      # S-003: 로그인 화면
        └── signup/
            └── page.tsx                      # S-004: 회원가입 화면
```

---

## 개발 서버 실행 방법

### 1. 환경 변수 설정

프론트엔드 루트 디렉터리에 `.env.local` 파일이 이미 생성되어 있습니다.

```bash
# 파일 확인
cat frontend/.env.local
```

내용:
```
# WeTee Frontend Environment Variables
# DO NOT COMMIT THIS FILE

# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

> **참고**: `.env.local`은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다.
> 팀원은 `.env.local.example`을 복사하여 사용하면 됩니다.

### 2. 백엔드 서버 실행

먼저 백엔드 API 서버가 실행 중이어야 합니다.

```bash
# 터미널 1: 백엔드 서버 실행
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

백엔드가 정상 실행되면 다음 URL에서 API 문서를 확인할 수 있습니다:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. 프론트엔드 개발 서버 실행

```bash
# 터미널 2: 프론트엔드 개발 서버 실행
cd frontend
npm run dev
```

개발 서버가 실행되면 다음 URL로 접속합니다:
- 프론트엔드: http://localhost:3000

---

## 테스트 시나리오

### 시나리오 1: 회원가입 (새로운 선생님 계정 생성)

#### 1.1 회원가입 화면 접속

1. 브라우저에서 http://localhost:3000/signup 접속
2. 또는 로그인 페이지(http://localhost:3000/login)에서 "회원가입" 링크 클릭

#### 1.2 회원가입 폼 작성

다음 정보를 입력합니다:

| 필드 | 입력값 예시 | 설명 |
|------|------------|------|
| 이메일 | `teacher@example.com` | 유효한 이메일 형식 |
| 비밀번호 | `SecurePassword123!` | 8자 이상 권장 |
| 비밀번호 확인 | `SecurePassword123!` | 비밀번호와 동일 |
| 이름 | `김선생` | 사용자 실명 |
| 전화번호 | `010-1234-5678` | 연락처 |
| 역할 | **선생님** 선택 | TEACHER 역할 |
| 과목 (선택) | `수학, 영어` | 선생님인 경우 과목 입력 가능 |
| 학교 (선택) | `서울대학교` | 선생님인 경우 학교 입력 가능 |

#### 1.3 회원가입 버튼 클릭

"회원가입" 버튼을 클릭합니다.

#### 1.4 예상 결과

- ✅ **성공 케이스**:
  - 회원가입이 완료되고 자동으로 로그인 페이지(`/login`)로 이동
  - 또는 회원가입 성공 메시지가 표시되고 로그인 화면으로 리다이렉트

- ❌ **실패 케이스**:
  - 이메일 중복: "이미 가입된 이메일입니다." 에러 메시지 표시
  - 입력값 검증 실패: 각 필드 아래에 에러 메시지 표시
  - 네트워크 에러: "회원가입 중 오류가 발생했습니다." 메시지 표시

#### 1.5 백엔드 확인 (선택)

백엔드 콘솔에서 다음과 같은 로그를 확인할 수 있습니다:

```
INFO:     POST /api/v1/auth/register - 201 Created
```

---

### 시나리오 2: 로그인 (방금 만든 계정으로 로그인)

#### 2.1 로그인 화면 접속

1. 브라우저에서 http://localhost:3000/login 접속
2. 또는 회원가입 후 자동으로 이동된 로그인 화면

#### 2.2 로그인 폼 작성

| 필드 | 입력값 |
|------|--------|
| 이메일 | `teacher@example.com` |
| 비밀번호 | `SecurePassword123!` |

#### 2.3 로그인 버튼 클릭

"로그인" 버튼을 클릭합니다.

#### 2.4 예상 결과

- ✅ **성공 케이스**:
  - 로그인이 완료되고 메인 페이지(`/`)로 리다이렉트
  - 브라우저 개발자도구 > Application > Cookies에서 다음 쿠키 확인:
    - `wetee_access_token`: JWT Access Token
  - 브라우저 개발자도구 > Application > Local Storage에서 다음 키 확인:
    - `wetee_refresh_token`: JWT Refresh Token
    - `wetee_user`: 사용자 정보 JSON

- ❌ **실패 케이스**:
  - 이메일/비밀번호 불일치: "이메일 또는 비밀번호가 올바르지 않습니다." 에러 메시지
  - 계정 잠김: "계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해주세요."
  - 네트워크 에러: "로그인 중 오류가 발생했습니다."

#### 2.5 백엔드 확인 (선택)

```
INFO:     POST /api/v1/auth/login - 200 OK
```

---

### 시나리오 3: 로그인 상태 확인 (사용자 정보 표시)

#### 3.1 메인 페이지 확인

로그인 후 메인 페이지(`/`)에 도착하면:

1. **상단 네비게이션 바** 또는 **사이드바**에서 사용자 정보 확인
2. 현재 구현에 따라 다음 중 하나가 표시될 수 있습니다:
   - 사용자 이름: `김선생`
   - 사용자 이메일: `teacher@example.com`
   - 역할 뱃지: `선생님` 또는 `TEACHER`
   - 프로필 이미지 또는 이니셜 아이콘

#### 3.2 개발자도구로 상태 확인

**Option 1: React DevTools 사용**

1. Chrome 확장 프로그램 "React Developer Tools" 설치
2. 개발자도구 > Components 탭
3. App 컴포넌트 검색
4. Zustand 스토어 상태 확인:
   ```javascript
   {
     user: {
       id: "uuid-string",
       email: "teacher@example.com",
       name: "김선생",
       role: "teacher",
       ...
     },
     isAuthenticated: true,
     accessToken: "eyJhbGci...",
     refreshToken: "eyJhbGci...",
   }
   ```

**Option 2: 브라우저 콘솔 사용**

1. 개발자도구 > Console 탭
2. 다음 명령어 입력:
   ```javascript
   // localStorage에서 사용자 정보 확인
   JSON.parse(localStorage.getItem('wetee_user'))

   // 출력 예시:
   // {
   //   id: "uuid-string",
   //   email: "teacher@example.com",
   //   name: "김선생",
   //   role: "teacher",
   //   ...
   // }
   ```

#### 3.3 예상 결과

- ✅ 사용자 이름 또는 이메일이 UI에 정상 표시됨
- ✅ 역할(선생님/학생/학부모)이 정확하게 표시됨
- ✅ 로그아웃 버튼이 보임 (구현되어 있는 경우)

---

### 시나리오 4: 자동 로그인 복원 (페이지 새로고침)

이 시나리오는 **가장 중요한 테스트**입니다. 페이지를 새로고침해도 로그인 상태가 유지되는지 확인합니다.

#### 4.1 페이지 새로고침

1. 로그인된 상태에서 메인 페이지(`/`) 또는 아무 페이지에서 **F5** 또는 **Cmd+R** (Mac)로 새로고침
2. 또는 브라우저 주소창에서 **Enter**

#### 4.2 예상 동작 과정

다음과 같은 순서로 자동 로그인이 복원됩니다:

1. **페이지 로드 시작**
   - Next.js 앱이 다시 마운트됨
   - `AuthProvider` 컴포넌트가 실행됨

2. **토큰 확인**
   - `useAuth` 훅이 쿠키에서 `wetee_access_token` 확인
   - localStorage에서 `wetee_user` 확인

3. **사용자 정보 복원**
   - Access Token은 있지만 `user` 상태가 없는 경우:
   - `AuthProvider`가 자동으로 `loadMe()` 호출
   - `GET /api/v1/auth/account` API 요청
   - 응답받은 사용자 정보로 Zustand 스토어 업데이트
   - localStorage에 사용자 정보 저장

4. **UI 업데이트**
   - 사용자 이름/이메일이 다시 표시됨
   - 로그인 상태 유지됨

#### 4.3 콘솔 로그 확인

브라우저 개발자도구 > Console 탭에서 다음과 같은 로그를 확인할 수 있습니다:

```
[AuthProvider] 토큰 존재, 사용자 정보 로드 시작
[useAuth.loadMe] 사용자 정보 로드 완료: teacher@example.com
```

#### 4.4 백엔드 로그 확인

백엔드 콘솔에서 다음 로그가 출력됩니다:

```
INFO:     GET /api/v1/auth/account - 200 OK
```

#### 4.5 예상 결과

- ✅ **성공 케이스**:
  - 페이지 새로고침 후에도 사용자 이름/이메일이 그대로 표시됨
  - 로그인 상태가 유지되어 메인 페이지(`/`)에 계속 머물러 있음
  - 로그인 화면으로 리다이렉트되지 않음

- ❌ **실패 케이스**:
  - Access Token이 만료된 경우:
    - `GET /api/v1/auth/account` 요청이 401 Unauthorized 반환
    - 자동으로 로그아웃 처리됨
    - 로그인 페이지(`/login`)로 리다이렉트
    - 콘솔에 에러 로그: `[useAuth.loadMe] 사용자 정보 로드 실패`

#### 4.6 토큰 만료 테스트 (고급)

Access Token 만료 상황을 시뮬레이션하려면:

1. 개발자도구 > Application > Cookies
2. `wetee_access_token` 쿠키의 값을 임의의 문자열로 변경 (예: `invalid_token`)
3. 페이지 새로고침 (F5)
4. **예상 결과**:
   - `/api/v1/auth/account` 요청이 401 에러 반환
   - 자동 로그아웃 처리
   - `/login` 페이지로 리다이렉트

---

### 시나리오 5: Protected Route Guard (인증 필요 페이지 접근)

#### 5.1 로그아웃 상태에서 보호된 페이지 접근

1. **로그아웃 처리** (구현되어 있는 경우):
   - UI에서 "로그아웃" 버튼 클릭
   - 또는 개발자도구 > Console에서 다음 실행:
     ```javascript
     localStorage.clear()
     document.cookie.split(";").forEach(c => {
       document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
     });
     location.reload();
     ```

2. 메인 페이지(`/`) 또는 보호된 페이지 접속 시도

#### 5.2 예상 결과

- ✅ 자동으로 로그인 페이지(`/login`)로 리다이렉트
- ✅ URL에 리다이렉트 정보가 포함될 수 있음 (예: `/login?from=/`)

#### 5.3 미들웨어 동작 확인

`frontend/src/middleware.ts` 파일이 다음과 같이 동작합니다:

1. 요청 인터셉트
2. 쿠키에서 `wetee_access_token` 확인
3. 토큰이 없고 보호된 경로일 경우 `/login`으로 리다이렉트
4. 토큰이 있으면 요청 통과

---

## 주요 구현 내용

### 1. API 클라이언트 (`src/lib/apiClient.ts`)

- Axios 기반 HTTP 클라이언트
- 자동 Authorization 헤더 첨부 (Access Token)
- 공통 에러 처리
- snake_case ↔ camelCase 변환 (향후 확장)

```typescript
const apiRequest = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  // 1. 쿠키에서 Access Token 추출
  const accessToken = getAccessToken();

  // 2. Authorization 헤더 자동 첨부
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  // 3. API 요청
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 4. 에러 처리
  if (!response.ok) {
    throw new ApiError(response.status, errorData.code, errorData.message);
  }

  return data;
};
```

### 2. 인증 API (`src/lib/authApi.ts`)

#### 추가된 함수: `getCurrentAccount()`

```typescript
export async function getCurrentAccount(): Promise<RegisterResponseData> {
  // GET /api/v1/auth/account
  const responseData = await apiRequest<{
    user_id: string;
    email: string;
    name: string;
    role: string;
    is_email_verified: boolean;
  }>('/auth/account', {
    method: 'GET',
  });

  // snake_case → camelCase 변환
  return {
    userId: responseData.user_id,
    email: responseData.email,
    name: responseData.name,
    role: responseData.role.toUpperCase() as 'TEACHER' | 'STUDENT' | 'PARENT',
    emailVerified: responseData.is_email_verified,
  };
}
```

**역할**:
- 현재 로그인한 사용자 정보를 백엔드에서 가져옴
- Authorization 헤더의 Access Token을 사용
- 페이지 새로고침 시 사용자 정보 복원에 사용됨

### 3. 전역 Auth 상태 관리 (`src/lib/hooks/useAuth.ts`)

#### 추가된 함수: `loadMe()`

```typescript
const useAuthStore = create<AuthState>((set, get) => ({
  // ... 기존 상태 ...

  loadMe: async () => {
    const state = get();

    // 1. Access Token 확인
    if (!state.accessToken) {
      console.warn('[useAuth.loadMe] Access Token이 없습니다.');
      return;
    }

    try {
      set({ isLoading: true });

      // 2. 백엔드에서 사용자 정보 가져오기
      const userData = await getCurrentAccount();

      // 3. User 객체 변환
      const user: User = {
        id: userData.userId,
        email: userData.email,
        name: userData.name,
        role: userData.role.toLowerCase() as UserRole,
        ...
      };

      // 4. Zustand 스토어 업데이트
      set({ user });

      // 5. localStorage에 저장
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(WETEE_USER_KEY, JSON.stringify(user));
      }

      console.log('[useAuth.loadMe] 사용자 정보 로드 완료:', user.email);
    } catch (error) {
      console.error('[useAuth.loadMe] 사용자 정보 로드 실패:', error);

      // 6. 실패 시 자동 로그아웃
      get().logout();
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
```

**역할**:
- Access Token을 사용하여 백엔드에서 최신 사용자 정보 가져오기
- Zustand 스토어 및 localStorage 동기화
- 에러 발생 시 자동 로그아웃 처리

### 4. 앱 초기화 Provider (`src/components/providers/AuthProvider.tsx`)

```typescript
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, currentUser, loadMe } = useAuth();

  useEffect(() => {
    // 토큰은 있지만 사용자 정보가 없는 경우 → 자동 로그인 복원
    if (accessToken && !currentUser) {
      console.log('[AuthProvider] 토큰 존재, 사용자 정보 로드 시작');
      loadMe().catch((error) => {
        console.error('[AuthProvider] 사용자 정보 로드 실패:', error);
      });
    }
  }, [accessToken, currentUser, loadMe]);

  return <>{children}</>;
}
```

**역할**:
- 앱 최상위 레벨에서 자동 로그인 복원 로직 실행
- `accessToken`은 있지만 `currentUser`가 없으면 `loadMe()` 호출
- 페이지 새로고침 시 사용자 정보 자동 복원

### 5. 루트 레이아웃 (`src/app/layout.tsx`)

```typescript
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**역할**:
- 모든 페이지를 `AuthProvider`로 감싸서 자동 로그인 복원 적용

### 6. 토큰 저장 전략

| 저장 위치 | 저장 항목 | 목적 |
|----------|---------|------|
| **Cookies** | `wetee_access_token` | - Next.js 미들웨어에서 서버사이드 접근 가능<br>- Protected Route Guard에 사용 |
| **localStorage** | `wetee_refresh_token` | - Refresh Token 저장<br>- Access Token 갱신에 사용 |
| **localStorage** | `wetee_user` | - 사용자 정보 캐싱<br>- 빠른 UI 렌더링 |
| **Zustand Store** | 모든 인증 상태 | - 클라이언트 사이드 전역 상태 관리<br>- 실시간 UI 업데이트 |

---

## 트러블슈팅

### 문제 1: 로그인 후 사용자 정보가 표시되지 않음

**증상**:
- 로그인은 성공했지만 상단바/사이드바에 사용자 이름이 안 보임
- 콘솔에 에러 없음

**해결 방법**:
1. 개발자도구 > Console에서 확인:
   ```javascript
   JSON.parse(localStorage.getItem('wetee_user'))
   ```
2. `null`이 출력되면 `loadMe()` 호출 확인:
   ```javascript
   // React DevTools > Components > AuthProvider
   // useEffect 훅이 실행되었는지 확인
   ```
3. 백엔드 로그에서 `/api/v1/auth/account` 요청이 있는지 확인

### 문제 2: 페이지 새로고침 시 로그인 화면으로 리다이렉트됨

**증상**:
- 로그인 후 페이지 새로고침하면 `/login`으로 리다이렉트됨

**원인**:
- Access Token이 쿠키에 저장되지 않음
- 또는 토큰이 만료됨

**해결 방법**:
1. 개발자도구 > Application > Cookies 확인:
   - `wetee_access_token` 쿠키가 있는지 확인
   - 쿠키의 만료 시간 확인
2. 백엔드 로그인 응답 확인:
   - `access_token` 필드가 응답에 포함되는지 확인
3. `useAuth.ts`의 `login()` 함수에서 쿠키 저장 로직 확인

### 문제 3: CORS 에러

**증상**:
```
Access to fetch at 'http://localhost:8000/api/v1/auth/login' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**해결 방법**:
1. 백엔드 `main.py`에서 CORS 설정 확인:
   ```python
   from fastapi.middleware.cors import CORSMiddleware

   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
2. 백엔드 재시작

### 문제 4: 환경 변수를 찾을 수 없음

**증상**:
```
API_BASE_URL is undefined
```

**해결 방법**:
1. `.env.local` 파일 존재 확인:
   ```bash
   ls -la frontend/.env.local
   ```
2. 파일 내용 확인:
   ```bash
   cat frontend/.env.local
   ```
3. 환경 변수명이 `NEXT_PUBLIC_`으로 시작하는지 확인
4. **개발 서버 재시작** (환경 변수 변경 시 필수):
   ```bash
   # Ctrl+C로 서버 중지 후
   npm run dev
   ```

### 문제 5: 401 Unauthorized 에러

**증상**:
```
GET /api/v1/auth/account - 401 Unauthorized
```

**원인**:
- Access Token이 만료됨
- 또는 잘못된 토큰

**해결 방법**:
1. 로그아웃 후 다시 로그인
2. 토큰 갱신 로직 구현 (향후 개선 사항)

---

## 다음 단계 (향후 개선 사항)

현재 구현된 기능은 MVP 1단계 요구사항을 충족합니다. 향후 다음 기능을 추가할 수 있습니다:

### 1. 토큰 자동 갱신 (Token Refresh)

**현재**: Access Token 만료 시 수동 로그아웃
**개선**: 401 에러 발생 시 자동으로 Refresh Token으로 Access Token 갱신

**구현 위치**: `src/lib/apiClient.ts`

```typescript
// 401 에러 발생 시
if (response.status === 401) {
  // 1. Refresh Token으로 새 Access Token 발급
  const newTokens = await refreshAccessToken({ refreshToken });

  // 2. 쿠키와 localStorage 업데이트
  setAccessToken(newTokens.accessToken);

  // 3. 원래 요청 재시도
  return apiRequest(endpoint, options);
}
```

### 2. 비밀번호 재설정

**화면**: `/reset-password`, `/reset-password/confirm`
**API**: `POST /api/v1/auth/password-reset`, `POST /api/v1/auth/password-reset/confirm`

### 3. 이메일 인증

**화면**: `/verify-email`
**API**: `POST /api/v1/auth/verify-email`, `POST /api/v1/auth/resend-verification`

### 4. 소셜 로그인 (구글, 카카오)

**화면**: 로그인/회원가입 페이지에 소셜 로그인 버튼 추가
**API**: `POST /api/v1/auth/social/google`, `POST /api/v1/auth/social/kakao`

### 5. 로그인 기록 조회

**화면**: 설정 > 보안 > 로그인 기록
**API**: `GET /api/v1/auth/login-history`

### 6. 다중 디바이스 세션 관리

**기능**: 다른 디바이스에서 로그인 시 알림, 원격 로그아웃

---

## 참고 자료

### 관련 문서

- [F-001_회원가입_및_로그인.md](../docs/features/F-001_회원가입_및_로그인.md)
- [UX_UI_설계서.md](../docs/UX_UI_설계서.md)
- [API_명세서.md](../docs/API_명세서.md)
- [데이터베이스_설계서.md](../docs/데이터베이스_설계서.md)

### 기술 스택

- **프론트엔드**: Next.js 14 (App Router), React 18, TypeScript
- **상태 관리**: Zustand
- **HTTP 클라이언트**: Axios, Fetch API
- **인증**: JWT (Access Token + Refresh Token)
- **백엔드**: FastAPI (Python), PostgreSQL

### 유용한 명령어

```bash
# 프론트엔드 개발 서버
cd frontend && npm run dev

# 백엔드 개발 서버
cd backend && python -m uvicorn app.main:app --reload

# 타입 체크
cd frontend && npm run type-check

# 린트
cd frontend && npm run lint

# 빌드
cd frontend && npm run build

# 프로덕션 실행
cd frontend && npm start
```

---

## 문의 및 버그 리포트

구현 중 문제가 발생하거나 개선 사항이 있으면 다음 방법으로 알려주세요:

1. GitHub Issues 등록
2. 개발팀 Slack 채널에 문의
3. `CLAUDE.md`의 문서 우선순위에 따라 관련 명세서 확인

---

**마지막 업데이트**: 2025-11-16
**작성자**: Claude Code (AI Assistant)
**버전**: v1.0.0 (MVP Phase 1 - F-001 Implementation)
