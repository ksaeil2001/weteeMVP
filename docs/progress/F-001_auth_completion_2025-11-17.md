# F-001 회원가입 및 로그인 최종 디버깅 보고서 (MVP)

## 1. 개요

- 기능 ID: F-001 회원가입 및 로그인
- 보고 일자: 2025-11-17
- 기준 브랜치: main (F-001 관련 변경 사항 머지 완료 시점)
- 관련 커밋: `c4a7f4c` (Implement logout API endpoint for F-001 authentication)
- 범위:
  - 이메일/비밀번호 기반 회원가입
  - 로그인 및 로그아웃
  - JWT 기반 인증 흐름의 엔드투엔드(E2E) 검증
- 목적:
  - F-001 기능 명세서, API 명세서, 데이터베이스 설계서, UX/UI 설계서 기준으로
    MVP 단계에서 필요한 기본 인증 플로우가 정상 동작하는지 최종 확인하는 것

## 2. 구현 내용 요약

### 2.1 백엔드 (FastAPI)

#### 2.1.1 User 모델 (backend/app/models/user.py)

- F-001 및 데이터베이스 설계서와 일치하는 구조
- 주요 필드
  - user_id: UUID
  - email: Unique 제약조건
  - password_hash: bcrypt 해시(평문 비밀번호 저장 없음)
  - role: Enum (TEACHER, STUDENT, PARENT)
  - is_email_verified: 이메일 인증 여부
  - last_login_at: 마지막 로그인 시각
- 추후 확장 가능 필드: 기본 프로필 및 감사(audit)용 필드 등은 유지

#### 2.1.2 Auth Router (backend/app/routers/auth.py)

- 회원가입 (POST /api/v1/auth/register)
  - 이메일 중복 검사
  - 비밀번호 해싱 후 저장
  - 역할 값 검증 (TEACHER, STUDENT, PARENT)
  - 성공 시 201 Created 및 사용자 정보 반환
- 로그인 (POST /api/v1/auth/login)
  - 이메일로 사용자 조회
  - bcrypt 기반 비밀번호 검증
  - 로그인 성공 시
    - Access Token 발급
    - Refresh Token 발급
    - last_login_at 갱신
- 로그아웃 (POST /api/v1/auth/logout)
  - 변경 전: 501 Not Implemented
  - 변경 후:
    - current_user dependency를 통해 인증 토큰 필수
    - stateless JWT 방식 (서버 측 세션 상태 없음)
    - HTTP 200 OK
    - 응답 바디: success: true, message: "로그아웃되었습니다. 클라이언트에서 토큰을 삭제해주세요."
    - 향후 서버 측 토큰 무효화, 블랙리스트 도입 관련 TODO 주석 추가
- 에러 핸들링
  - 이메일 중복 시 409 Conflict (AUTH001)
  - 잘못된 인증 정보 시 401 Unauthorized (AUTH004)
  - DB 예외(OperationalError, IntegrityError 등)에 대한 방어 코드 존재

#### 2.1.3 보안 유틸 (backend/app/core/security.py)

- bcrypt 기반 비밀번호 해싱 및 검증 함수 구현
- JWT 생성
  - Access Token: 약 15분 만료
  - Refresh Token: 약 7일 만료
  - type 클레임(access, refresh)로 토큰 종류 구분
- 토큰 타입 검증 및 파싱 로직 구현

#### 2.1.4 스키마 검증 (backend/app/schemas/auth.py 등)

- Pydantic 기반 요청 및 응답 스키마 정의
- 주요 검증 규칙
  - 비밀번호: 최소 8자, 영문과 숫자 포함
  - 전화번호: 010-XXXX-XXXX 형식 검증
- 공통 응답 포맷(코드, 메시지)과 연동 가능하도록 설계

### 2.2 프론트엔드 (Next.js + TypeScript)

#### 2.2.1 로그인 페이지 (frontend/src/app/(auth)/login/page.tsx)

- 로그인 API 연동: POST /api/v1/auth/login
- 에러 코드별 메시지 분기 처리
  - 예시: AUTH004, AUTH006 등에 따라 사용자 메시지 구분
- 로딩 상태 관리 및 버튼 비활성화 처리
- 로그인 성공 시
  - 토큰 및 사용자 정보 저장
  - 메인 페이지(서비스 진입 화면)로 이동

#### 2.2.2 회원가입 페이지 (frontend/src/app/(auth)/signup/page.tsx)

- 회원가입 API 연동: POST /api/v1/auth/register
- 클라이언트 측 비밀번호 확인(비밀번호와 비밀번호 확인 일치 여부 검사)
- 중복 이메일(409 Conflict) 발생 시
  - "이미 가입된 이메일입니다."와 같은 사용자 친화적 메시지 표시
- 개발 환경에서만 상세 에러 정보를 볼 수 있는 패널 제공

#### 2.2.3 로그아웃 페이지 (frontend/src/app/logout/page.tsx)

- 컴포넌트 마운트 시 useAuth.logout() 자동 호출
- 로그아웃 처리 내용
  - 토큰 및 사용자 정보 삭제
  - 인증 상태 초기화
- UX
  - 약 2초 카운트다운 후 로그인 페이지로 자동 이동

#### 2.2.4 인증 훅 (frontend/src/lib/hooks/useAuth.ts)

- Zustand 기반 전역 인증 상태 관리 훅
- 토큰 저장 전략
  - 쿠키와 localStorage를 병행 사용
  - 페이지 새로고침 시 상태 복원(hydration)
- API 클라이언트 연동
  - accessTokenProvider를 통해 API 호출 시 토큰을 주입할 수 있는 구조 제공
- 추후 401 응답 시 Refresh Token을 사용해 자동 갱신하는 로직을 추가할 수 있도록 설계됨

## 3. 시나리오별 API 테스트 결과

### 3.1 회원가입

#### 3.1.1 성공 시나리오

- 엔드포인트: POST /api/v1/auth/register
- Request Body 예시
  - email: testteacher@example.com
  - password: SecurePass123
  - name: 테스트선생
  - phone: 01012345678
  - role: TEACHER
- 결과
  - HTTP 201 Created
  - Response 예시 필드
    - user_id: 생성된 UUID
    - email: testteacher@example.com
    - name: 테스트선생
    - role: teacher
    - is_email_verified: false
    - created_at: 2025-11-17T20:05:22.031119

#### 3.1.2 실패 시나리오 (중복 이메일)

- 동일 이메일로 재시도
- 결과
  - HTTP 409 Conflict
  - Response detail.code: AUTH001
  - Response detail.message: 이미 가입된 이메일입니다.

### 3.2 로그인

#### 3.2.1 성공 시나리오

- 엔드포인트: POST /api/v1/auth/login
- Request Body 예시
  - email: testteacher@example.com
  - password: SecurePass123
- 결과
  - HTTP 200 OK
  - Response 필드
    - access_token: JWT 문자열
    - refresh_token: JWT 문자열
    - token_type: bearer
    - user
      - user_id, email, name, role, is_email_verified, created_at 등의 필드 포함

#### 3.2.2 실패 시나리오 (잘못된 비밀번호 또는 존재하지 않는 이메일)

- 잘못된 비밀번호 또는 존재하지 않는 이메일로 로그인 요청
- 결과
  - HTTP 401 Unauthorized
  - Response detail.code: AUTH004
  - Response detail.message: 이메일 또는 비밀번호가 일치하지 않습니다.
- 보안 관점
  - 이메일 존재 여부를 따로 노출하지 않고, 비밀번호 오류와 동일한 메시지로 처리하여 정보 노출을 최소화

### 3.3 로그아웃

#### 3.3.1 성공 시나리오

- 엔드포인트: POST /api/v1/auth/logout
- Request Header
  - Authorization: Bearer 액세스 토큰
- 결과
  - HTTP 200 OK
  - Response
    - success: true
    - message: 로그아웃되었습니다. 클라이언트에서 토큰을 삭제해주세요.

#### 3.3.2 실패 시나리오 (토큰 없음)

- Authorization 헤더 없이 호출
- 결과
  - HTTP 401 Unauthorized
  - Response detail.code: AUTH001
  - Response detail.message: 인증이 필요합니다.

### 3.4 테스트 요약 표

- POST /auth/register
  - 신규 회원가입: 201, 성공
  - 중복 이메일: 409, 에러 메시지 정상
- POST /auth/login
  - 정상 로그인: 200, 토큰 발급
  - 잘못된 비밀번호: 401, 보안 메시지
  - 존재하지 않는 이메일: 401, 보안 메시지
- POST /auth/logout
  - 토큰 있음: 200, 성공
  - 토큰 없음: 401, 인증 필요 에러

(표는 GitHub에서 보기 좋게 다시 재구성할 수 있음)

## 4. 코드 품질 및 명세 부합성

- F-001 기능 명세서, API 명세서, 데이터베이스 설계서와 구현 내용이 일치함
- UX/UI 설계서 기준 화면 ID
  - 로그인: S-003
  - 회원가입: S-004
- 보안
  - 비밀번호 해싱 필수 적용(bcrypt)
  - JWT 기반 인증(Access, Refresh 분리)
  - 에러 메시지를 코드 기반으로 통일하여, 불필요한 정보 노출 방지
- 에러 처리
  - HTTP 상태 코드와 에러 코드(AUTH001, AUTH004 등)를 일관되게 사용
  - 프론트엔드에서 에러 코드를 기준으로 분기 처리 가능

## 5. F-001 범위 내 TODO 및 향후 구현 예정 항목

### 5.1 이메일 인증

- 위치: backend/app/routers/auth.py 280–293 라인 인근
- 내용
  - 6자리 인증 코드를 이메일로 발송
  - 인증 코드 검증 후 is_email_verified 갱신
  - 인증 코드 재발송 로직 (예: 1분 간격 제한)

### 5.2 비밀번호 재설정

- 위치: backend/app/routers/auth.py 326–353 라인 인근
- 내용
  - 비밀번호 재설정 링크를 이메일로 발송
  - 토큰 검증 후 새 비밀번호 저장
  - 비밀번호 재설정 이후 기존 토큰 무효화 처리

### 5.3 토큰 갱신 (Refresh Token 기반)

- 위치: backend/app/routers/auth.py 296–308 라인 인근
- 내용
  - Refresh Token으로 새로운 Access, Refresh Token 발급
  - 프론트엔드에서는 401 응답 발생 시 인터셉터에서 자동 갱신 후 요청 재시도하는 구조 필요

### 5.4 로그인 보안 강화

- 내용
  - 5회 연속 로그인 실패 시 계정 잠금
  - 일정 시간(예: 10분) 경과 후 잠금 해제
  - 계정 잠금 상태에 대한 별도 에러 코드 및 메시지 정의

### 5.5 학생 및 학부모 초대 코드 기반 회원가입 (F-002 연계)

- 위치: backend/app/routers/auth.py 76–83 라인 인근
- 내용
  - 현재: TEACHER만 직접 가입 가능
  - 계획: STUDENT, PARENT는 초대 코드 기반 가입 플로우로 확장
  - F-002(과외 그룹 생성 및 매칭) 기능과 연계하여 상세 설계 필요

## 6. 실행 및 테스트 로그 요약

### 6.1 백엔드 서버 실행 정보

- 데이터베이스 URL: sqlite:///./wetee.db
- DB 파일 위치: /home/user/weteeMVP/backend/wetee.db
- 주요 테이블
  - users 테이블 존재 확인
- 서버 실행 로그 예시
  - Uvicorn running on http://0.0.0.0:8000

### 6.2 Health Check 예시 응답

- success: true
- data.status: ok
- meta.timestamp: 2025-11-17T20:04:04.659311Z
- meta.request_id: 8e57d4ff-4e0a-40f0-8085-07a93339a972

## 7. Git 커밋 정보

- 커밋 ID: c4a7f4c
- 요약
  - Implement logout API endpoint for F-001 authentication
- 주요 변경 파일
  - backend/app/routers/auth.py
    - 로그아웃 API 구현
    - stateless JWT 방식으로 200 OK 응답 및 TODO 주석 추가

## 8. 결론 및 향후 계획

### 8.1 결론

- F-001 회원가입 및 로그인 기능의 핵심 인증 플로우는 MVP 기준으로 정상 동작한다.
- 백엔드
  - User 모델, 인증 라우터, 보안 유틸, 스키마 검증이 명세와 일치한다.
- 프론트엔드
  - 로그인, 회원가입, 로그아웃 화면과 useAuth 기반 인증 상태 관리가 실제 API와 연동된 상태로 정상 동작한다.
- 종합
  - 회원가입에서 시작해 로그인, 보호된 리소스 접근, 로그아웃까지 이어지는 엔드투엔드 흐름이 실제 서비스에서 사용할 수 있는 수준으로 확보되었다.

### 8.2 향후 계획 (우선순위 제안)

1. 이메일 인증 기능 구현 (F-001 명세 완성)
2. 학생 및 학부모 초대 코드 기반 회원가입 구현 (F-002와 연계)
3. Refresh Token 기반 자동 토큰 갱신 로직 구현 (401 응답 시 재발급 후 재시도)
4. 로그인 실패 횟수 기반 계정 잠금 등 보안 강화
5. 소셜 로그인(카카오, 구글) 및 비밀번호 강도 체크 UI, 실시간 이메일 중복 검사 등 UX 개선

이 보고서를 기준으로 F-001은 MVP 인증 인프라 완료 상태로 간주하며, 이후 기능(F-002~F-008) 개발 시 로그인 및 권한 관리의 기반으로 활용할 수 있다.
