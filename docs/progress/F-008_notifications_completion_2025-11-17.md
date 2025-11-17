# F-008 필수 알림 시스템 백엔드 구현 및 연동 보고서 (MVP)

## 1. 개요

- 기능 ID: F-008 필수 알림 시스템
- 보고 일자: 2025-11-17
- 기준 브랜치: main (F-008 백엔드 및 연동 완료 시점)
- 관련 커밋:
  - `c573a71` (Implement F-008 notification system backend and update frontend API client)
  - `ec30607` (Merge pull request #29)
- 범위:
  - 알림 데이터 모델 및 DB 스키마 구현
  - 알림 CRUD REST API 엔드포인트 구현
  - 프론트엔드 API 클라이언트 백엔드 연동
  - 카테고리별 필터링, 페이지네이션, 읽음 처리, 삭제 기능
- 목적:
  - F-008 기능 명세서, API 명세서, 데이터베이스 설계서 기준으로
    MVP 단계에서 필요한 핵심 알림 시스템 백엔드 인프라와 프론트엔드 API 연동을 완료하는 것

## 2. 구현 내용 요약

### 2.1 백엔드 (FastAPI)

#### 2.1.1 Notification 모델 (backend/app/models/notification.py)

- F-008 및 데이터베이스 설계서와 일치하는 구조
- 주요 Enum 정의
  - NotificationType: SCHEDULE, ATTENDANCE, LESSON_RECORD, PAYMENT, SYSTEM, GROUP
  - NotificationCategory: SCHEDULE, PAYMENT, LESSON, SYSTEM (프론트엔드 카테고리 필터링용)
  - NotificationPriority: LOW, MEDIUM, HIGH, URGENT
  - NotificationChannel: IN_APP, EMAIL, SMS, PUSH (Phase 2: PUSH 확장 예정)
  - NotificationDeliveryStatus: PENDING, SENT, FAILED, READ
- 주요 필드
  - id: Integer (Primary Key)
  - user_id: UUID (FK → users)
  - type: NotificationType
  - category: NotificationCategory
  - title: 알림 제목 (최대 200자)
  - message: 알림 본문 (최대 1000자)
  - priority: NotificationPriority
  - is_read: Boolean (읽음 여부)
  - read_at: DateTime (읽은 시각)
  - related_entity_type: String (관련 엔티티 타입, 예: schedule, payment)
  - related_entity_id: String (관련 엔티티 ID)
  - action_url: String (클릭 시 이동할 URL)
  - delivery_status: NotificationDeliveryStatus
  - channels: JSON (전송 채널 목록)
  - created_at: DateTime
  - updated_at: DateTime
- 메서드
  - to_dict(): 프론트엔드 NotificationItem 타입과 호환되는 딕셔너리 반환

#### 2.1.2 Notification 스키마 (backend/app/schemas/notification.py)

- Pydantic 기반 요청 및 응답 스키마 정의
- 주요 스키마
  - NotificationOut: 단일 알림 응답
  - NotificationListResponse: 알림 리스트 + 페이지네이션 정보
  - NotificationSummary: 카테고리별 unread 집계 정보
  - PaginationInfo: 페이지 번호, 페이지 크기, 총 개수, 총 페이지 수
  - MarkAllReadResponse: 읽음 처리 결과(성공 여부, 업데이트된 알림 수)
- 프론트엔드 TypeScript 타입과 필드 이름 및 구조 완전 일치

#### 2.1.3 Notification 서비스 (backend/app/services/notification_service.py)

- 비즈니스 로직 레이어 (DB 접근 및 데이터 가공)
- 주요 함수
  - get_notifications(db, user_id, category, is_read, page, limit)
    - 사용자별 알림 조회 (카테고리 및 읽음 상태 필터링)
    - 페이지네이션 지원 (기본: page=1, limit=20)
    - 최신 알림 우선 정렬 (created_at DESC)
  - get_summary(db, user_id)
    - 카테고리별 읽지 않은 알림 개수 집계
    - 전체 unread 개수 반환
  - mark_as_read(db, notification_id, user_id)
    - 특정 알림을 읽음 처리
    - read_at 타임스탬프 갱신
  - mark_all_as_read(db, user_id, category)
    - 특정 카테고리(또는 전체) 알림을 읽음 처리
    - 업데이트된 알림 수 반환
  - delete_notification(db, notification_id, user_id)
    - 특정 알림 삭제 (소유자 검증 포함)
  - create_test_notification(db, user_id, notification_type)
    - 개발/테스트용 알림 생성 함수
    - 타입별로 미리 정의된 제목, 메시지, 카테고리, 우선순위 사용

#### 2.1.4 Notification Router (backend/app/routers/notifications.py)

- REST API 엔드포인트 정의
- 주요 엔드포인트
  - GET /api/v1/notifications
    - 알림 리스트 조회 (페이지네이션, 필터링)
    - Query Params: category, is_read, page, limit
  - GET /api/v1/notifications/summary
    - 카테고리별 unread 알림 개수 집계
  - PATCH /api/v1/notifications/{id}/read
    - 특정 알림 읽음 처리
  - POST /api/v1/notifications/read-all
    - 전체 또는 특정 카테고리 알림 읽음 처리
    - Request Body: { category?: string }
  - DELETE /api/v1/notifications/{id}
    - 특정 알림 삭제
  - POST /api/v1/notifications/test
    - 테스트 알림 생성 (개발용)
    - Request Body: { type: NotificationType }
  - POST /api/v1/notifications/fcm-token (현재 501 Not Implemented)
    - Phase 2: FCM 토큰 등록 (푸시 알림용)
  - DELETE /api/v1/notifications/fcm-token (현재 501 Not Implemented)
    - Phase 2: FCM 토큰 삭제
- 인증
  - 모든 엔드포인트는 current_user dependency로 JWT 인증 필수
- 에러 핸들링
  - 404: 알림을 찾을 수 없음
  - 403: 권한 없음 (다른 사용자의 알림 접근 시도)
  - 400: 잘못된 요청 파라미터

#### 2.1.5 Main App 등록 (backend/app/main.py)

- notifications 라우터를 `/api/v1/notifications` prefix로 등록
- 모든 알림 API는 `/api/v1/notifications/*` 경로로 접근 가능

### 2.2 데이터베이스 (SQLite)

#### 2.2.1 notifications 테이블

- 스키마 구조 (SQLAlchemy 모델 기준)
  - id: INTEGER PRIMARY KEY
  - user_id: VARCHAR(36) (FK → users.user_id)
  - type: VARCHAR(20)
  - category: VARCHAR(20)
  - title: VARCHAR(200)
  - message: VARCHAR(1000)
  - priority: VARCHAR(10)
  - is_read: BOOLEAN (기본값: 0/false)
  - read_at: DATETIME (NULL 허용)
  - related_entity_type: VARCHAR(50) (NULL 허용)
  - related_entity_id: VARCHAR(100) (NULL 허용)
  - action_url: VARCHAR(500) (NULL 허용)
  - delivery_status: VARCHAR(20)
  - channels: JSON
  - created_at: DATETIME
  - updated_at: DATETIME
- 인덱스
  - user_id (조회 성능 최적화)
  - category (필터링 성능 최적화)
  - is_read (읽음 상태 필터링)
  - created_at (시간 순 정렬)
  - delivery_status (전송 상태 관리)

#### 2.2.2 마이그레이션

- 현재: SQLAlchemy의 create_all()로 자동 생성
- 운영 환경: Alembic 기반 마이그레이션 도입 예정 (TODO)

### 2.3 프론트엔드 (Next.js + TypeScript)

#### 2.3.1 API 클라이언트 (frontend/src/lib/api/notifications.ts)

- 변경 전
  - 목업 데이터 기반 구현
  - 로컬 상태로만 동작
- 변경 후
  - 공통 apiRequest() 유틸 함수 사용
  - 실제 FastAPI 백엔드 엔드포인트 호출
  - JWT 토큰 자동 주입 (Authorization 헤더)
- 주요 함수
  - fetchNotifications(params)
    - GET /api/v1/notifications
    - Params: category, is_read, page, limit
    - 반환: NotificationListResponse
  - fetchNotificationSummary()
    - GET /api/v1/notifications/summary
    - 반환: NotificationSummary
  - markNotificationAsRead(id)
    - PATCH /api/v1/notifications/{id}/read
    - 반환: NotificationOut
  - markAllNotificationsAsRead(category?)
    - POST /api/v1/notifications/read-all
    - 반환: MarkAllReadResponse
  - deleteNotification(id)
    - DELETE /api/v1/notifications/{id}
    - 반환: { success: true }
  - createTestNotification(type)
    - POST /api/v1/notifications/test
    - 반환: NotificationOut
  - fetchRecentNotifications(limit)
    - GET /api/v1/notifications (limit 파라미터)
    - 반환: NotificationItem[]
  - registerFCMToken(token) (Phase 2 placeholder)
    - 현재: 에러 throw
  - unregisterFCMToken() (Phase 2 placeholder)
    - 현재: 에러 throw

#### 2.3.2 타입 정의 (frontend/src/types/notification.ts)

- 백엔드 스키마와 완전히 일치하는 TypeScript 타입
- 주요 타입
  - NotificationType, NotificationCategory, NotificationPriority 등 Enum 타입
  - NotificationItem: 단일 알림 객체
  - NotificationSummary: 카테고리별 unread 집계
  - NotificationListResponse: 알림 리스트 + 페이지네이션

#### 2.3.3 기존 UI 컴포넌트 (frontend/src/app/notifications/page.tsx)

- 알림 센터 메인 페이지
- 이미 구현된 기능
  - 카테고리 탭 (전체, 수업, 정산, 시스템)
  - 상태 필터 (전체, 읽지 않음, 읽음)
  - 알림 리스트 표시
  - 읽음 처리, 삭제 버튼
  - 페이지네이션
- 변경 사항
  - 목업 데이터 → 실제 API 호출로 전환 완료

## 3. 시나리오별 API 테스트 결과

### 3.1 알림 생성 (테스트용)

#### 3.1.1 성공 시나리오

- 엔드포인트: POST /api/v1/notifications/test
- Request Header
  - Authorization: Bearer {액세스 토큰}
- Request Body 예시
  - type: SCHEDULE
- 결과
  - HTTP 200 OK
  - Response 예시 필드
    - id: 1
    - user_id: {사용자 UUID}
    - type: schedule
    - category: schedule
    - title: 수업 일정 알림
    - message: 오늘 오후 3시에 수학 수업이 예정되어 있습니다.
    - priority: medium
    - is_read: false
    - created_at: 2025-11-17T22:30:15.123456

### 3.2 알림 리스트 조회

#### 3.2.1 성공 시나리오 (전체 조회)

- 엔드포인트: GET /api/v1/notifications?page=1&limit=20
- Request Header
  - Authorization: Bearer {액세스 토큰}
- 결과
  - HTTP 200 OK
  - Response 필드
    - items: NotificationItem[] (최신순 정렬)
    - pagination
      - page: 1
      - limit: 20
      - total: 5
      - total_pages: 1
      - has_next: false
      - has_prev: false

#### 3.2.2 성공 시나리오 (카테고리 필터링)

- 엔드포인트: GET /api/v1/notifications?category=payment&is_read=false&page=1&limit=10
- Request Header
  - Authorization: Bearer {액세스 토큰}
- 결과
  - HTTP 200 OK
  - items: 정산 카테고리의 읽지 않은 알림만 반환

### 3.3 알림 요약 조회

#### 3.3.1 성공 시나리오

- 엔드포인트: GET /api/v1/notifications/summary
- Request Header
  - Authorization: Bearer {액세스 토큰}
- 결과
  - HTTP 200 OK
  - Response 예시
    - total_unread: 5
    - by_category
      - schedule: 2
      - payment: 1
      - lesson: 1
      - system: 1

### 3.4 알림 읽음 처리

#### 3.4.1 성공 시나리오 (단일 알림)

- 엔드포인트: PATCH /api/v1/notifications/1/read
- Request Header
  - Authorization: Bearer {액세스 토큰}
- 결과
  - HTTP 200 OK
  - Response
    - id: 1
    - is_read: true
    - read_at: 2025-11-17T22:35:20.123456

#### 3.4.2 성공 시나리오 (전체 읽음 처리)

- 엔드포인트: POST /api/v1/notifications/read-all
- Request Header
  - Authorization: Bearer {액세스 토큰}
- Request Body
  - {} (전체 알림)
  - 또는 { "category": "schedule" } (특정 카테고리)
- 결과
  - HTTP 200 OK
  - Response
    - success: true
    - updated_count: 5

#### 3.4.3 실패 시나리오 (존재하지 않는 알림)

- 엔드포인트: PATCH /api/v1/notifications/99999/read
- 결과
  - HTTP 404 Not Found
  - detail: "알림을 찾을 수 없습니다."

#### 3.4.4 실패 시나리오 (권한 없음)

- 다른 사용자의 알림 ID로 요청
- 결과
  - HTTP 403 Forbidden
  - detail: "이 알림에 대한 권한이 없습니다."

### 3.5 알림 삭제

#### 3.5.1 성공 시나리오

- 엔드포인트: DELETE /api/v1/notifications/1
- Request Header
  - Authorization: Bearer {액세스 토큰}
- 결과
  - HTTP 200 OK
  - Response
    - success: true

#### 3.5.2 실패 시나리오

- 존재하지 않거나 권한 없는 알림 삭제 시도
- 결과
  - HTTP 404 Not Found 또는 403 Forbidden

### 3.6 FCM 토큰 관리 (현재 미구현)

#### 3.6.1 현재 상태

- 엔드포인트: POST /api/v1/notifications/fcm-token
- 결과
  - HTTP 501 Not Implemented
  - detail: "FCM 푸시 알림은 Phase 2에서 구현 예정입니다."

### 3.7 테스트 요약 표

- POST /notifications/test
  - 테스트 알림 생성: 200, 성공
- GET /notifications
  - 알림 리스트 조회: 200, 페이지네이션 정상
  - 카테고리 필터링: 200, 필터링 정상
- GET /notifications/summary
  - 카테고리별 집계: 200, 정상
- PATCH /notifications/{id}/read
  - 읽음 처리: 200, 성공
  - 존재하지 않는 알림: 404, 에러
  - 권한 없음: 403, 에러
- POST /notifications/read-all
  - 전체 읽음 처리: 200, 성공
  - 카테고리별 읽음 처리: 200, 성공
- DELETE /notifications/{id}
  - 삭제: 200, 성공
  - 존재하지 않는 알림: 404, 에러

## 4. 코드 품질 및 명세 부합성

- F-008 기능 명세서, API 명세서, 데이터베이스 설계서와 구현 내용이 일치함
- UX/UI 설계서 기준 화면 ID
  - 알림 센터: S-025 (추정)
  - 헤더 알림 드롭다운: 공통 레이아웃 컴포넌트
- 보안
  - 모든 알림 API는 JWT 기반 인증 필수
  - 사용자는 자신의 알림만 조회/수정/삭제 가능 (소유자 검증)
  - 다른 사용자의 알림 접근 시 403 Forbidden
- 에러 처리
  - HTTP 상태 코드와 일관된 에러 메시지 사용
  - 404: 리소스를 찾을 수 없음
  - 403: 권한 없음
  - 400: 잘못된 요청
  - 501: 미구현 기능 (FCM)
- 프론트엔드-백엔드 타입 일치
  - TypeScript 타입과 Pydantic 스키마의 필드 이름 및 구조 완전 일치
  - Enum 값 일치 (snake_case ↔ lowercase 변환 고려)

## 5. F-008 범위 내 TODO 및 향후 구현 예정 항목

### 5.1 실제 이벤트 기반 알림 생성

- 위치: backend/app/services/notification_service.py 및 관련 도메인 서비스
- 내용
  - 현재: 테스트 알림 생성 함수만 존재
  - 계획: 다른 기능(F-003~F-006)과 연계하여 실제 이벤트 발생 시 알림 자동 생성
  - 예시
    - F-003: 수업 일정 생성/변경 시 SCHEDULE 알림
    - F-004: 출결 기록 시 ATTENDANCE 알림
    - F-005: 수업 기록 저장 시 LESSON_RECORD 알림
    - F-006: 정산 생성/결제 완료 시 PAYMENT 알림

### 5.2 FCM 푸시 알림 (Phase 2)

- 위치: backend/app/routers/notifications.py 의 fcm-token 엔드포인트
- 내용
  - FCM 서버 키 설정 및 firebase-admin SDK 통합
  - 사용자별 FCM 토큰 저장 (DB 테이블 또는 users 테이블에 컬럼 추가)
  - 알림 생성 시 IN_APP 외에 PUSH 채널로도 전송
  - 토큰 만료/갱신 처리

### 5.3 이메일/SMS 알림 (Phase 2)

- 위치: backend/app/services/notification_service.py
- 내용
  - 이메일 발송: SMTP 또는 SendGrid 등 이메일 서비스 연동
  - SMS 발송: Twilio, 알리고 등 SMS 서비스 연동
  - 채널별 템플릿 관리
  - 발송 실패 시 재시도 로직

### 5.4 알림 설정 (사용자별 on/off)

- 위치: F-007 프로필 및 설정과 연계
- 내용
  - 사용자별 알림 카테고리/채널 설정 저장
  - 예: "정산 알림은 이메일로만 받기", "수업 알림은 모두 끄기"
  - settings 테이블 또는 user_notification_settings 테이블 활용

### 5.5 알림 배치(Batch) 처리 및 스케줄링

- 위치: backend/app/tasks/ (Celery 또는 APScheduler 등 태스크 큐 도입)
- 내용
  - 예: 매일 오전 9시에 "오늘의 수업 일정" 요약 알림
  - 예: 정산 마감 3일 전 리마인더 알림
  - 비동기 알림 전송 큐

### 5.6 알림 보관 기간 및 자동 삭제

- 위치: backend/app/services/notification_service.py 또는 배치 작업
- 내용
  - 읽은 알림: 30일 후 자동 삭제
  - 읽지 않은 알림: 90일 후 자동 삭제
  - 또는 사용자별 보관 정책 설정

### 5.7 알림 검색 및 고급 필터링

- 위치: backend/app/routers/notifications.py
- 내용
  - 제목/메시지 키워드 검색
  - 날짜 범위 필터링
  - 우선순위 필터링
  - 관련 엔티티 타입 필터링

## 6. 실행 및 테스트 로그 요약

### 6.1 백엔드 서버 실행 정보

- 데이터베이스 URL: sqlite:///./wetee.db
- DB 파일 위치: /home/user/weteeMVP/backend/wetee.db
- 주요 테이블
  - notifications 테이블 존재 확인
  - users 테이블과 FK 연결 확인
- 서버 실행 로그 예시
  - Uvicorn running on http://0.0.0.0:8000
  - Notification router registered at /api/v1/notifications

### 6.2 Swagger UI 테스트

- URL: http://localhost:8000/docs
- 테스트 순서
  1. POST /auth/login → 액세스 토큰 획득
  2. Authorize 버튼 클릭 → Bearer {토큰} 입력
  3. POST /notifications/test → 테스트 알림 생성
  4. GET /notifications → 알림 리스트 조회
  5. GET /notifications/summary → 카테고리별 집계 확인
  6. PATCH /notifications/{id}/read → 읽음 처리
  7. DELETE /notifications/{id} → 삭제

### 6.3 프론트엔드 연동 확인

- URL: http://localhost:3000
- 테스트 페이지
  - /notifications (알림 센터)
  - / (헤더 우측 상단 🔔 드롭다운)
- 테스트 시나리오
  1. 로그인
  2. 헤더 알림 아이콘 클릭 → 최근 알림 5개 표시
  3. "알림 센터 열기" → /notifications 페이지 이동
  4. 카테고리 탭 전환 (전체, 수업, 정산, 시스템)
  5. 상태 필터 전환 (전체, 읽지 않음, 읽음)
  6. 알림 클릭 → 읽음 처리 확인
  7. "모두 읽음" 버튼 → 전체 읽음 처리
  8. 삭제 버튼 → 알림 삭제
  9. 페이지네이션 → 다음/이전 페이지 이동

### 6.4 알려진 이슈

#### 6.4.1 bcrypt/passlib 환경 이슈 (F-001 관련)

- 증상: 일부 환경에서 bcrypt 설치 또는 passlib 초기화 실패
- 해결: requirements.txt에 bcrypt 명시적 추가, passlib[bcrypt] 사용
- 현재 상태: 해결 완료

#### 6.4.2 SQLite JSON 타입

- 증상: SQLite는 네이티브 JSON 타입을 지원하지 않음 (TEXT로 저장)
- 영향: channels 필드 (JSON 배열)
- 해결: SQLAlchemy의 JSON 타입이 자동으로 직렬화/역직렬화 처리
- 현재 상태: 정상 동작

#### 6.4.3 FCM 엔드포인트 501 에러

- 증상: FCM 토큰 관련 엔드포인트 호출 시 501 Not Implemented
- 원인: Phase 2 예정 기능
- 해결: 프론트엔드에서 해당 함수 호출 시 에러 핸들링 필요
- 현재 상태: 정상 (의도된 동작)

## 7. Git 커밋 정보

### 7.1 주요 커밋

- 커밋 ID: c573a71
- 요약
  - Implement F-008 notification system backend and update frontend API client
- 주요 변경 파일
  - backend/app/models/notification.py
    - Notification 모델 및 Enum 정의
  - backend/app/schemas/notification.py
    - Pydantic 스키마 정의
  - backend/app/services/notification_service.py
    - 비즈니스 로직 구현
  - backend/app/routers/notifications.py
    - REST API 엔드포인트 구현
  - backend/app/main.py
    - notifications 라우터 등록
  - frontend/src/lib/api/notifications.ts
    - 목업 → 실제 API 호출로 전환
  - backend/.gitignore
    - *.db 추가 (SQLite 파일 버전 관리 제외)

### 7.2 관련 PR

- PR #29: F-008 notifications backend
- PR #28: F-008 notifications frontend skeleton (이전 단계)

## 8. 결론 및 향후 계획

### 8.1 결론

- F-008 필수 알림 시스템의 핵심 백엔드 인프라는 MVP 기준으로 정상 동작한다.
- 백엔드
  - Notification 모델, 스키마, 서비스, 라우터가 명세와 일치한다.
  - 알림 CRUD, 필터링, 페이지네이션, 읽음 처리, 삭제 기능이 완전히 구현되었다.
  - 카테고리별 집계 기능으로 헤더 알림 뱃지 표시가 가능하다.
- 프론트엔드
  - API 클라이언트가 실제 백엔드와 연동되어 알림 센터 UI가 정상 동작한다.
  - 목업 데이터 제거 및 실제 API 호출로 완전히 전환되었다.
- 종합
  - 알림 생성부터 조회, 읽음 처리, 삭제까지 이어지는 엔드투엔드 흐름이 실제 서비스에서 사용할 수 있는 수준으로 확보되었다.
  - 다른 기능(F-003~F-006)에서 알림을 생성할 수 있는 인프라가 준비되었다.

### 8.2 향후 계획 (우선순위 제안)

1. 실제 이벤트 기반 알림 생성 (F-003~F-006 연계)
   - 수업 일정, 출결, 수업 기록, 정산 이벤트 발생 시 자동 알림 생성
2. FCM 푸시 알림 구현 (Phase 2)
   - firebase-admin SDK 통합
   - 사용자별 FCM 토큰 저장 및 관리
   - 알림 생성 시 PUSH 채널로 전송
3. 이메일/SMS 알림 구현 (Phase 2)
   - SMTP 또는 이메일 서비스 연동
   - SMS 서비스 연동
4. 알림 설정 (F-007 연계)
   - 사용자별 알림 카테고리/채널 on/off 설정
5. 알림 배치 처리 및 스케줄링
   - 일일 요약 알림, 리마인더 알림 등
6. 알림 보관 기간 및 자동 삭제 정책 구현

이 보고서를 기준으로 F-008은 MVP 알림 시스템 백엔드 및 연동 완료 상태로 간주하며, 이후 다른 기능과의 연계 및 고급 기능 확장을 진행할 수 있다.
