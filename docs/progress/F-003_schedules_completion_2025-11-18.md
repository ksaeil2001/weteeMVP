# F-003 수업 일정 관리 백엔드 구현 및 연동 보고서 (MVP)

## 1. 개요

- 기능 ID: F-003 수업 일정 관리
- 보고 일자: 2025-11-18
- 기준 브랜치: main (F-003 백엔드 및 연동 완료 시점)
- 관련 커밋:
  - `a03dfa4` (Implement F-003 schedule backend: models and schemas)
  - `1bb43eb` (Implement F-003 schedule backend: service layer and router)
  - `8d2eff9` (Integrate F-003 schedule frontend with backend API)
  - `00f76c4` (Merge pull request #34)
- 범위:
  - 수업 일정 생성 및 관리 (CRUD)
  - 정규 수업 (반복 일정) 자동 생성
  - 단일 일정 (보강, 시험, 휴강 등) 생성
  - 일정 수정 및 삭제 (권한 및 시간 제약)
  - 일정 목록 조회 및 페이지네이션
  - 프론트엔드 API 클라이언트 백엔드 연동
- 목적:
  - F-003 기능 명세서, API 명세서, 데이터베이스 설계서 기준으로
    MVP 단계에서 필요한 핵심 일정 관리 기능과 프론트엔드 API 연동을 완료하는 것

## 2. 구현 내용 요약

### 2.1 백엔드 (FastAPI)

#### 2.1.1 Schedule 모델 (backend/app/models/schedule.py)

- F-003 및 데이터베이스 설계서와 일치하는 구조
- 주요 Enum 정의
  - ScheduleType: REGULAR, MAKEUP, EXAM, HOLIDAY, OTHER
  - ScheduleStatus: SCHEDULED, DONE, CANCELED, RESCHEDULED
- Schedule 모델 주요 필드
  - id: String(36) UUID (Primary Key)
  - group_id: FK to groups (인덱스)
  - title: 일정 제목 (최대 200자)
  - type: ScheduleType (기본값 REGULAR, 인덱스)
  - start_at: DateTime (시작 시각, 인덱스)
  - end_at: DateTime (종료 시각)
  - status: ScheduleStatus (기본값 SCHEDULED, 인덱스)
  - recurrence_rule: JSON (반복 규칙, NULL이면 단일 일정)
  - location: 수업 장소 (최대 200자, 선택)
  - memo: 메모 (Text, 선택)
  - original_schedule_id: 원래 일정 ID (보강/변경인 경우, 인덱스)
  - cancel_reason, reschedule_reason: Text (선택)
  - created_at, updated_at: DateTime
- Recurrence Rule JSON 구조
  - frequency: "daily" | "weekly" | "biweekly" | "monthly"
  - interval: 간격 (1=매주, 2=격주)
  - days_of_week: 요일 목록 (1=월요일, 7=일요일)
  - start_date: 시작 날짜 (YYYY-MM-DD)
  - end_type: "date" | "count" | "never"
  - end_date / end_count: 종료 조건
- 메서드
  - to_dict(): API 응답용 딕셔너리 반환

#### 2.1.2 Schedule 스키마 (backend/app/schemas/schedule.py)

- Pydantic 기반 요청 및 응답 스키마 정의
- 주요 스키마
  - ScheduleBase: 일정 기본 필드 (title, location, memo)
  - RecurrenceRuleSchema: 반복 규칙 스키마
  - CreateRegularSchedulePayload: 정규 수업 등록 요청 (POST /schedules/regular)
    - group_id, title, start_time (HH:mm), duration (분), recurrence
  - CreateSchedulePayload: 단일 일정 생성 요청 (POST /schedules)
    - group_id, title, type, start_at, end_at, original_schedule_id
  - UpdateSchedulePayload: 일정 수정 요청 (PATCH /schedules/{id})
    - title, start_at, end_at, location, memo, status, reschedule_reason, cancel_reason
  - ScheduleOut: 단일 일정 응답
    - schedule_id, group_id, group_name, title, type, start_at, end_at, status
    - recurrence_rule, location, memo, teacher_id, teacher_name, student_ids, student_names
    - original_schedule_id, cancel_reason, reschedule_reason
  - ScheduleListResponse: 일정 리스트 + 페이지네이션 정보
  - PaginationInfo: 페이지 번호, 크기, 총 개수, 총 페이지 수, has_next/has_prev
- 프론트엔드 TypeScript 타입과 필드 이름 및 구조 완전 일치

#### 2.1.3 Schedule 서비스 (backend/app/services/schedule_service.py)

- 비즈니스 로직 레이어 (DB 접근 및 데이터 가공)
- 주요 메서드
  - _check_group_access(db, user, group_id, required_role)
    - 그룹 접근 권한 확인 헬퍼 메서드
    - 그룹 존재 여부, 멤버십, 역할 확인
    - HTTPException 발생 (404/403)
  - _generate_recurring_schedules(payload, group, teacher_id)
    - 반복 규칙에 따라 일정 인스턴스 생성
    - frequency, interval, days_of_week 기반 계산
    - end_type에 따라 종료 조건 처리 (date/count/never)
    - 최대 200개까지 생성 (MAX_SCHEDULES_PER_CREATION)
  - create_regular_schedule(db, user, payload)
    - 정규 수업 일정 등록 (반복 일정 자동 생성)
    - TEACHER 역할만 생성 가능
    - 반복 규칙에 따라 여러 일정 인스턴스 생성
    - 트랜잭션 처리 (bulk insert)
  - create_schedule(db, user, payload)
    - 단일 일정 생성 (보강, 시험, 휴강 등)
    - TEACHER 역할만 생성 가능
  - get_schedules(db, user, group_id, type, status, from_date, to_date, page, size)
    - 일정 목록 조회 (페이지네이션)
    - 사용자가 속한 그룹의 일정만 조회
    - 날짜 범위, 타입, 상태 필터링 지원
    - 시작 시간순 정렬 (start_at ASC)
  - get_schedule_detail(db, user, schedule_id)
    - 일정 상세 조회
    - 그룹 멤버만 조회 가능
  - update_schedule(db, user, schedule_id, payload)
    - 일정 수정
    - TEACHER 역할만 수정 가능
    - 24시간 이내 일정 수정 불가 (비즈니스 규칙)
    - DONE 상태 일정 수정 불가 (비즈니스 규칙)
    - status 변경 시 사유 필수 (cancel_reason, reschedule_reason)
  - delete_schedule(db, user, schedule_id)
    - 일정 삭제
    - TEACHER 역할만 삭제 가능
    - 24시간 이내 일정 삭제 불가
    - DONE 상태 일정 삭제 불가
- 비즈니스 규칙
  - 24시간 룰: 수업 시작 24시간 전부터는 수정/삭제 불가
  - DONE 일정 보호: 완료된 일정은 수정/삭제 불가 (기록 보존)
  - 반복 일정 생성 상한: 최대 200개 (성능 및 DB 부하 고려)

#### 2.1.4 Schedule Router (backend/app/routers/schedules.py)

- REST API 엔드포인트 정의
- 주요 엔드포인트
  - GET /api/v1/schedules
    - 일정 목록 조회 (페이지네이션, 필터링)
    - Query Params: group_id, type, status, from_date, to_date, page, size
    - Response: ScheduleListResponse
  - POST /api/v1/schedules/regular
    - 정규 수업 일정 등록 (반복 일정 자동 생성)
    - Request Body: CreateRegularSchedulePayload
    - Response: List[ScheduleOut] (201 Created)
  - POST /api/v1/schedules
    - 단일 일정 생성
    - Request Body: CreateSchedulePayload
    - Response: ScheduleOut (201 Created)
  - GET /api/v1/schedules/{schedule_id}
    - 일정 상세 조회
    - Response: ScheduleOut
  - PATCH /api/v1/schedules/{schedule_id}
    - 일정 수정
    - Request Body: UpdateSchedulePayload
    - Response: ScheduleOut
  - DELETE /api/v1/schedules/{schedule_id}
    - 일정 삭제
    - Response: 204 No Content
- 인증
  - 모든 엔드포인트는 current_user dependency로 JWT 인증 필수
- 에러 핸들링
  - 404: 일정/그룹을 찾을 수 없음
  - 403: 권한 없음 (TEACHER가 아니거나 그룹 멤버가 아님)
  - 400: 잘못된 요청 (24시간 룰 위반, DONE 일정 수정 등)
  - 500: 서버 오류

#### 2.1.5 Main App 등록 (backend/app/main.py)

- schedules 라우터를 `/api/v1/schedules` prefix로 등록
- 모든 일정 API는 `/api/v1/schedules/*` 경로로 접근 가능

### 2.2 데이터베이스 (SQLite)

#### 2.2.1 schedules 테이블

- 스키마 구조 (SQLAlchemy 모델 기준)
  - id: VARCHAR(36) PRIMARY KEY (UUID)
  - group_id: VARCHAR(36) NOT NULL (FK → groups.id, 인덱스)
  - title: VARCHAR(200) NOT NULL
  - type: VARCHAR(20) (기본값: REGULAR, 인덱스)
  - start_at: DATETIME NOT NULL (인덱스)
  - end_at: DATETIME NOT NULL
  - status: VARCHAR(20) (기본값: SCHEDULED, 인덱스)
  - recurrence_rule: JSON (NULL 허용)
  - location: VARCHAR(200) (NULL 허용)
  - memo: TEXT (NULL 허용)
  - original_schedule_id: VARCHAR(36) (NULL 허용, 인덱스)
  - cancel_reason: TEXT (NULL 허용)
  - reschedule_reason: TEXT (NULL 허용)
  - created_at: DATETIME
  - updated_at: DATETIME
- 인덱스
  - id (Primary Key)
  - group_id (조회 성능 최적화)
  - type (필터링 성능 최적화)
  - start_at (날짜 범위 조회 성능 최적화)
  - status (필터링 성능 최적화)
  - original_schedule_id (보강 일정 추적)

#### 2.2.2 마이그레이션

- 현재: SQLAlchemy의 create_all()로 자동 생성
- 운영 환경: Alembic 기반 마이그레이션 도입 예정 (TODO)

### 2.3 프론트엔드 (Next.js + TypeScript)

#### 2.3.1 API 클라이언트 (frontend/src/lib/api/schedules.ts)

- 공통 apiRequest() 유틸 함수 사용
- 실제 FastAPI 백엔드 엔드포인트 호출
- JWT 토큰 자동 주입 (Authorization 헤더)
- 어댑터 패턴 (Backend snake_case ↔ Frontend camelCase)
  - adaptScheduleFromBackend(): 백엔드 ScheduleOut → 프론트엔드 Schedule
  - adaptCreateRegularSchedulePayload(): 프론트엔드 payload → 백엔드 요청
  - adaptCreateSchedulePayload(): 프론트엔드 payload → 백엔드 요청
  - adaptUpdateSchedulePayload(): 프론트엔드 payload → 백엔드 요청
- 주요 함수
  - fetchSchedules(params)
    - GET /api/v1/schedules
    - Params: from, to, groupId, type, status, page, size
    - 반환: Schedule[]
  - createRegularSchedule(payload)
    - POST /api/v1/schedules/regular
    - 반환: Schedule[]
  - createSchedule(payload)
    - POST /api/v1/schedules
    - 반환: Schedule
  - fetchScheduleById(scheduleId)
    - GET /api/v1/schedules/{scheduleId}
    - 반환: Schedule
  - updateSchedule(scheduleId, payload)
    - PATCH /api/v1/schedules/{scheduleId}
    - 반환: Schedule
  - deleteSchedule(scheduleId)
    - DELETE /api/v1/schedules/{scheduleId}
    - 반환: void
- Phase 2 함수 (TODO: 백엔드 미구현)
  - createMakeupSlot(payload): 보강 가능 시간 오픈
  - fetchMakeupSlots(groupId): 보강 가능 시간 조회
  - bookMakeupSlot(payload): 보강 시간 예약
  - createExamSchedule(payload): 시험 일정 등록
  - fetchExamSchedules(studentId): 시험 일정 조회

#### 2.3.2 타입 정의 (frontend/src/types/schedule.ts)

- 백엔드 스키마와 완전히 일치하는 TypeScript 타입
- 주요 타입
  - ScheduleType, ScheduleStatus, RecurrenceFrequency Enum 타입
  - RecurrenceRule: 반복 규칙 객체
  - Schedule: 단일 일정 객체
  - CreateRegularSchedulePayload, CreateSchedulePayload, UpdateSchedulePayload
  - ScheduleListParams: 일정 목록 조회 파라미터

#### 2.3.3 기존 UI 컴포넌트 (frontend/src/app/(main)/schedule/page.tsx)

- 일정 메인 페이지 (Screen S-012)
- 이미 구현된 기능
  - 일정 목록 표시 (리스트 뷰)
  - 오늘 일정, 이번 주 일정 필터링
  - 일정 타입별 배지 표시 (정규/보강/시험/휴강)
  - 로딩/에러 상태 UI
- 변경 사항
  - 목업 데이터 → 실제 API 호출로 전환 완료
  - fetchSchedules() 사용
  - 현재 월 기준 날짜 범위 계산 및 조회
- 개발 안내 배너
  - "F-003 백엔드 API 연동 완료 (MVP 1단계)"
- TODO (향후)
  - 달력 컴포넌트 라이브러리 연동 (react-big-calendar 등)
  - 월간/주간/일간 뷰 전환 기능
  - 일정 드래그&드롭 기능
  - 그룹/과목별 색상 구분

## 3. 시나리오별 API 테스트 결과

### 3.1 정규 수업 일정 등록 (선생님)

#### 3.1.1 성공 시나리오

- 엔드포인트: POST /api/v1/schedules/regular
- Request Header
  - Authorization: Bearer {액세스 토큰}
- Request Body 예시
  - group_id: "group-123"
  - title: "수학 정규 수업"
  - start_time: "15:00"
  - duration: 120
  - location: "학생 집"
  - memo: "이차함수 진도"
  - recurrence:
    - frequency: "weekly"
    - interval: 1
    - days_of_week: [1, 3, 5] (월, 수, 금)
    - start_date: "2025-11-18"
    - end_type: "count"
    - end_count: 40
- 결과
  - HTTP 201 Created
  - Response: List[ScheduleOut] (40개 일정 생성)
  - 각 일정의 recurrence_rule 필드에 반복 규칙 저장
- 비즈니스 규칙
  - days_of_week에 해당하는 요일에만 일정 생성
  - 최대 200개까지 생성 (MAX_SCHEDULES_PER_CREATION)

### 3.2 단일 일정 생성 (보강 수업)

#### 3.2.1 성공 시나리오

- 엔드포인트: POST /api/v1/schedules
- Request Header
  - Authorization: Bearer {액세스 토큰}
- Request Body 예시
  - group_id: "group-123"
  - title: "수학 보강 수업"
  - type: "MAKEUP"
  - start_at: "2025-11-20T10:00:00Z"
  - end_at: "2025-11-20T12:00:00Z"
  - location: "학생 집"
  - original_schedule_id: "schedule-456" (취소된 원래 일정 ID)
- 결과
  - HTTP 201 Created
  - Response: ScheduleOut

### 3.3 일정 목록 조회

#### 3.3.1 성공 시나리오 (날짜 범위 조회)

- 엔드포인트: GET /api/v1/schedules?from_date=2025-11-01&to_date=2025-11-30&page=1&size=20
- Request Header
  - Authorization: Bearer {액세스 토큰}
- 결과
  - HTTP 200 OK
  - Response 필드
    - items: ScheduleOut[] (시작 시간순 정렬)
    - pagination
      - page: 1
      - size: 20
      - total: 50
      - total_pages: 3
      - has_next: true
      - has_prev: false

#### 3.3.2 성공 시나리오 (그룹 및 타입 필터링)

- 엔드포인트: GET /api/v1/schedules?group_id=group-123&type=REGULAR&status=SCHEDULED
- Request Header
  - Authorization: Bearer {액세스 토큰}
- 결과
  - HTTP 200 OK
  - items: 특정 그룹의 정규 수업 중 예정된 일정만 반환

### 3.4 일정 상세 조회

#### 3.4.1 성공 시나리오

- 엔드포인트: GET /api/v1/schedules/{schedule_id}
- Request Header
  - Authorization: Bearer {액세스 토큰}
- 결과
  - HTTP 200 OK
  - Response: ScheduleOut (그룹 이름, 선생님 이름 포함)

#### 3.4.2 실패 시나리오 (그룹 멤버가 아님)

- 엔드포인트: GET /api/v1/schedules/{schedule_id}
- 사용자가 해당 일정의 그룹 멤버가 아닌 경우
- 결과
  - HTTP 403 Forbidden
  - detail.code: "NOT_GROUP_MEMBER"
  - detail.message: "이 그룹의 멤버가 아닙니다."

### 3.5 일정 수정

#### 3.5.1 성공 시나리오 (시간 변경)

- 엔드포인트: PATCH /api/v1/schedules/{schedule_id}
- Request Header
  - Authorization: Bearer {액세스 토큰}
- Request Body
  - start_at: "2025-11-21T15:00:00Z"
  - end_at: "2025-11-21T17:00:00Z"
  - reschedule_reason: "가족 일정으로 시간 변경"
- 결과
  - HTTP 200 OK
  - Response: ScheduleOut (수정된 일정)

#### 3.5.2 실패 시나리오 (24시간 룰 위반)

- 엔드포인트: PATCH /api/v1/schedules/{schedule_id}
- 수업 시작 24시간 이내에 수정 시도
- 결과
  - HTTP 400 Bad Request
  - detail.code: "SCHEDULE_IMMINENT"
  - detail.message: "수업 시작 24시간 전부터는 수정할 수 없습니다."

#### 3.5.3 실패 시나리오 (DONE 일정 수정)

- 엔드포인트: PATCH /api/v1/schedules/{schedule_id}
- 완료된 일정 수정 시도
- 결과
  - HTTP 400 Bad Request
  - detail.code: "SCHEDULE_DONE"
  - detail.message: "완료된 일정은 수정할 수 없습니다."

### 3.6 일정 취소

#### 3.6.1 성공 시나리오

- 엔드포인트: PATCH /api/v1/schedules/{schedule_id}
- Request Body
  - status: "CANCELED"
  - cancel_reason: "학생 개인 사정으로 취소"
- 결과
  - HTTP 200 OK
  - Response: ScheduleOut (status: "CANCELED")

### 3.7 일정 삭제

#### 3.7.1 성공 시나리오

- 엔드포인트: DELETE /api/v1/schedules/{schedule_id}
- Request Header
  - Authorization: Bearer {액세스 토큰}
- 결과
  - HTTP 204 No Content

#### 3.7.2 실패 시나리오 (권한 없음)

- 엔드포인트: DELETE /api/v1/schedules/{schedule_id}
- TEACHER 역할이 아닌 사용자가 삭제 시도
- 결과
  - HTTP 403 Forbidden
  - detail.code: "INSUFFICIENT_PERMISSION"
  - detail.message: "TEACHER 권한이 필요합니다."

### 3.8 테스트 요약 표

- POST /schedules/regular
  - 정규 수업 생성 (반복 일정): 201, 성공
  - 40개 일정 자동 생성: 성공
- POST /schedules
  - 단일 일정 생성: 201, 성공
  - 보강 수업 (original_schedule_id 포함): 성공
- GET /schedules
  - 목록 조회: 200, 페이지네이션 정상
  - 날짜 범위 필터링: 200, 필터링 정상
  - 그룹/타입/상태 필터링: 200, 필터링 정상
- GET /schedules/{id}
  - 상세 조회 (멤버): 200, 성공
  - 권한 없음: 403, 에러
- PATCH /schedules/{id}
  - 수정 (TEACHER): 200, 성공
  - 24시간 룰 위반: 400, 에러
  - DONE 일정 수정: 400, 에러
  - 권한 없음: 403, 에러
- DELETE /schedules/{id}
  - 삭제 (TEACHER): 204, 성공
  - 24시간 룰 위반: 400, 에러
  - DONE 일정 삭제: 400, 에러
  - 권한 없음: 403, 에러

## 4. 코드 품질 및 명세 부합성

- F-003 기능 명세서, API 명세서, 데이터베이스 설계서와 구현 내용이 일치함
- UX/UI 설계서 기준 화면 ID
  - 달력 메인: S-012
  - 일정 생성: S-013 (추정, 프론트엔드 구현 예정)
  - 일정 상세: S-014 (추정, 프론트엔드 구현 예정)
- 보안
  - 모든 일정 API는 JWT 기반 인증 필수
  - 사용자는 자신이 속한 그룹의 일정만 조회 가능 (멤버십 검증)
  - TEACHER만 일정 생성/수정/삭제 가능 (역할 검증)
  - 24시간 룰과 DONE 일정 보호 로직으로 무단 수정 방지
- 에러 처리
  - HTTP 상태 코드와 일관된 에러 메시지 사용
  - 404: 리소스를 찾을 수 없음
  - 403: 권한 없음
  - 400: 비즈니스 규칙 위반 (24시간 룰, DONE 일정 등)
  - 500: 서버 오류 (로그 출력)
- 프론트엔드-백엔드 타입 일치
  - TypeScript 타입과 Pydantic 스키마의 필드 이름 및 구조 완전 일치
  - 어댑터 패턴으로 snake_case ↔ camelCase 변환
- 권한 규칙 (MVP 구현 완료)
  - 일정 생성: TEACHER (그룹 멤버)
  - 일정 조회: 그룹 멤버
  - 일정 수정/삭제: TEACHER (그룹 멤버)
- 비즈니스 규칙 (MVP 구현 완료)
  - 24시간 룰: 수업 시작 24시간 전부터는 수정/삭제 불가
  - DONE 일정 보호: 완료된 일정은 수정/삭제 불가
  - 반복 일정 생성 상한: 최대 200개

## 5. F-003 범위 내 TODO 및 향후 구현 예정 항목

### 5.1 보강 가능 시간 오픈 기능 (Phase 2)

- 위치: backend/app/models/schedule.py (158-163 라인 주석)
- 내용
  - MakeupSlot 모델 추가
    - 선생님이 보강 가능 시간 오픈
    - 학생/학부모가 원하는 시간 예약
  - makeup_slots 테이블
    - 그룹 ID, 시작 시각, 종료 시각, 최대 예약 수, 현재 예약 수 등
  - API 엔드포인트
    - POST /schedules/makeup-slots (보강 시간 오픈)
    - GET /schedules/makeup-slots?groupId=... (보강 시간 조회)
    - POST /schedules/makeup-slots/{slotId}/book (보강 시간 예약)

### 5.2 시험 일정 별도 모델 (Phase 2)

- 내용
  - ExamSchedule 모델 추가 또는 Schedule 모델 확장
  - 시험 타입 (중간고사, 기말고사, 모의고사 등)
  - 시험 과목, 범위 정보
  - API 엔드포인트
    - POST /schedules/exam (시험 일정 등록)
    - GET /schedules/exam?studentId=... (학생별 시험 일정 조회)

### 5.3 일정 충돌 감지 (Phase 2)

- 내용
  - 새 일정 생성 시 기존 일정과 시간 충돌 여부 확인
  - 경고 메시지 또는 자동 조정 제안
  - 선생님/학생별 일정 충돌 검증

### 5.4 공휴일 처리 (Phase 2)

- 내용
  - 공휴일 데이터베이스 또는 외부 API 연동
  - 정규 수업 생성 시 공휴일 자동 제외
  - 공휴일에 수업 생성 시 경고

### 5.5 일정 알림 연동 (F-008 연계)

- 내용
  - 일정 생성 시 알림 자동 생성
    - 수업 1시간 전 알림
    - 수업 1일 전 알림
  - 일정 변경/취소 시 알림
  - F-008 알림 시스템과 연계

### 5.6 출결 및 정산 연동 (F-004, F-006 연계)

- 내용
  - 일정과 출결 기록 연결 (1:1 관계)
  - 출결 기록을 기반으로 정산 자동 계산
  - 일정 삭제 시 출결/정산 데이터 보존 정책

### 5.7 일정 검색 및 고급 필터링 (Phase 2)

- 내용
  - 일정 제목, 메모 키워드 검색
  - 선생님별, 학생별 필터링
  - 과목별 필터링
  - 완료율 기반 필터링

### 5.8 일정 대량 수정 (Phase 2)

- 내용
  - 정규 수업의 모든 미래 일정 일괄 수정
  - 특정 날짜 이후의 일정 일괄 수정
  - 드래그&드롭으로 일정 이동 (프론트엔드)

## 6. 실행 및 테스트 로그 요약

### 6.1 백엔드 서버 실행 정보

- 데이터베이스 URL: sqlite:///./wetee.db
- DB 파일 위치: /home/user/weteeMVP/backend/wetee.db
- 주요 테이블
  - schedules 테이블 존재 확인
  - groups 테이블과 FK 연결 확인
- 서버 실행 로그 예시
  - Uvicorn running on http://0.0.0.0:8000
  - Schedule router registered at /api/v1/schedules

### 6.2 Swagger UI 테스트

- URL: http://localhost:8000/docs
- 테스트 순서
  1. POST /auth/login → 액세스 토큰 획득
  2. Authorize 버튼 클릭 → Bearer {토큰} 입력
  3. POST /groups → 그룹 생성 (F-002)
  4. POST /schedules/regular → 정규 수업 일정 등록 (40개 생성)
  5. GET /schedules → 일정 목록 조회
  6. GET /schedules/{id} → 일정 상세 조회
  7. PATCH /schedules/{id} → 일정 수정
  8. DELETE /schedules/{id} → 일정 삭제

### 6.3 프론트엔드 연동 확인

- URL: http://localhost:3000
- 테스트 페이지
  - /schedule (일정 목록/달력)
  - /schedule/new (일정 생성, 프론트엔드 구현 예정)
  - /schedule/{id} (일정 상세, 프론트엔드 구현 예정)
- 테스트 시나리오
  1. 로그인 (선생님 계정)
  2. /schedule 페이지 이동
  3. 일정 목록 표시 확인
  4. 오늘 일정, 이번 주 일정 필터링 확인
  5. 일정 타입별 배지 표시 확인

### 6.4 알려진 이슈

#### 6.4.1 달력 뷰 프론트엔드 미구현

- 증상: 현재는 리스트 뷰만 구현됨
- 원인: 달력 컴포넌트 라이브러리 연동 우선순위
- 해결: Phase 2에서 react-big-calendar 등 연동 예정
- 현재 상태: API는 정상 동작, 리스트 뷰로 대체

#### 6.4.2 일정 생성 페이지 프론트엔드 미구현

- 증상: /schedule/new 페이지 없음
- 원인: 프론트엔드 구현 우선순위
- 해결: Phase 2에서 정규 수업, 보강 수업 생성 폼 구현 예정
- 현재 상태: API는 정상 동작, UI만 미구현

#### 6.4.3 보강 시간 오픈 기능 미구현

- 증상: 보강 시간 오픈 관련 API 호출 시 에러
- 원인: Phase 2 예정 기능
- 해결: 프론트엔드에서 해당 함수 호출 시 에러 핸들링 필요
- 현재 상태: 정상 (의도된 동작, 에러 throw)

## 7. Git 커밋 정보

### 7.1 주요 커밋

#### 7.1.1 백엔드 모델/스키마 구현 커밋

- 커밋 ID: a03dfa4
- 요약: Implement F-003 schedule backend: models and schemas
- 브랜치: claude/implement-schedule-backend-01Ja8UmTKafagSu8iMWGssaF
- 주요 변경 파일
  - backend/app/models/schedule.py
    - Schedule 모델 및 Enum 정의
  - backend/app/schemas/schedule.py
    - Pydantic 스키마 정의 (CreateRegularSchedulePayload, CreateSchedulePayload, UpdateSchedulePayload, ScheduleOut, ScheduleListResponse 등)

#### 7.1.2 백엔드 서비스/라우터 구현 커밋

- 커밋 ID: 1bb43eb
- 요약: Implement F-003 schedule backend: service layer and router
- 브랜치: claude/implement-schedule-backend-01Ja8UmTKafagSu8iMWGssaF
- 주요 변경 파일
  - backend/app/services/schedule_service.py
    - 비즈니스 로직 구현 (반복 일정 생성, CRUD, 권한 검증, 24시간 룰, DONE 일정 보호)
  - backend/app/routers/schedules.py
    - REST API 엔드포인트 구현
  - backend/app/main.py
    - schedules 라우터 등록

#### 7.1.3 프론트엔드 연동 커밋

- 커밋 ID: 8d2eff9
- 요약: Integrate F-003 schedule frontend with backend API
- 브랜치: claude/integrate-schedule-api-0146sGDdUQ9xy8yhPQfjTY11
- 주요 변경 파일
  - frontend/src/lib/api/schedules.ts
    - 목업 → 실제 API 호출로 전환
    - apiRequest 사용, 어댑터 패턴 구현
  - frontend/src/app/(main)/schedule/page.tsx
    - fetchSchedules() 호출
    - 로딩/에러 상태 UI
    - 개발 안내 배너 추가

### 7.2 관련 PR

- PR #34: Integrate F-003 schedule frontend with backend API
- PR #33: Implement F-003 schedule backend

## 8. 결론 및 향후 계획

### 8.1 결론

- F-003 수업 일정 관리 기능의 핵심 백엔드 인프라는 MVP 기준으로 정상 동작한다.
- 백엔드
  - Schedule 모델, 스키마, 서비스, 라우터가 명세와 일치한다.
  - 정규 수업 (반복 일정) 자동 생성 기능이 완전히 구현되었다.
  - 단일 일정 생성, 수정, 삭제, 조회 기능이 완전히 구현되었다.
  - 24시간 룰과 DONE 일정 보호 등 비즈니스 규칙이 정상 동작한다.
  - 권한 검증 (TEACHER만 생성/수정/삭제) 및 멤버십 검증이 정상 동작한다.
- 프론트엔드
  - API 클라이언트가 실제 백엔드와 연동되어 일정 목록 페이지가 정상 동작한다.
  - 어댑터 패턴으로 snake_case ↔ camelCase 변환이 정상 동작한다.
- 종합
  - 정규 수업 등록부터 단일 일정 생성, 수정, 삭제, 조회까지 이어지는 엔드투엔드 흐름이 실제 서비스에서 사용할 수 있는 수준으로 확보되었다.
  - 다른 기능(F-004 출결, F-006 정산)에서 일정 정보를 사용할 수 있는 인프라가 준비되었다.

### 8.2 향후 계획 (우선순위 제안)

1. 일정 생성/수정 프론트엔드 구현
   - /schedule/new 페이지 (정규 수업, 단일 일정 생성 폼)
   - /schedule/{id} 페이지 (일정 상세 및 수정)
2. 달력 뷰 프론트엔드 구현
   - react-big-calendar 또는 FullCalendar 라이브러리 연동
   - 월간/주간/일간 뷰 전환
   - 일정 드래그&드롭 기능
3. 보강 가능 시간 오픈 기능 (Phase 2)
   - MakeupSlot 모델 및 API
   - 보강 시간 예약 플로우
4. 일정 알림 연동 (F-008 연계)
   - 일정 생성/변경 시 알림 자동 생성
5. 출결 및 정산 연동 (F-004, F-006 연계)
   - 일정과 출결 기록 연결
   - 출결 기록 기반 정산 자동 계산
6. 일정 충돌 감지 및 공휴일 처리 (Phase 2)
   - 새 일정 생성 시 충돌 여부 확인
   - 공휴일 자동 제외 로직

이 보고서를 기준으로 F-003은 MVP 일정 관리 백엔드 및 연동 완료 상태로 간주하며, 이후 다른 기능과의 연계 및 고급 기능 확장을 진행할 수 있다.
