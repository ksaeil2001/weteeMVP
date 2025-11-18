# F-005 수업 기록 및 진도 관리 백엔드 구현 보고서 (MVP)

## 1. 개요

- 기능 ID: F-005 수업 기록 및 진도 관리
- 보고 일자: 2025-11-18
- 기준 브랜치: claude/implement-f005-lesson-progress-016pTKojTZEcPTrwVJkbQd9t
- 범위:
  - 수업 기록 작성 및 관리 (CRUD)
  - 교재 등록 및 관리 (CRUD)
  - 진도 기록 및 추적
  - 교재별 진도 요약 및 히스토리 조회
  - 진도율 계산 및 통계
  - 백엔드 도메인 레이어 완전 구현 (모델, 스키마, 서비스, 라우터)
- 목적:
  - F-005 기능 명세서, API 명세서, 데이터베이스 설계서 기준으로
    MVP 단계에서 필요한 핵심 수업 기록 및 진도 관리 기능의 백엔드를 완료하는 것

## 2. 구현 내용 요약

### 2.1 백엔드 (FastAPI)

#### 2.1.1 도메인 모델 (backend/app/models/)

##### Textbook 모델 (backend/app/models/textbook.py)

- F-005 및 데이터베이스 설계서와 일치하는 구조
- Textbook 모델 주요 필드
  - id: String(36) UUID (Primary Key)
  - group_id: FK to groups (CASCADE 삭제, 인덱스)
  - title: String(200) (교재명, 필수)
  - publisher: String(100) (출판사, 선택)
  - total_pages: Integer (전체 페이지 수, 진도율 계산용, 선택)
  - start_page: Integer (시작 페이지, 기본값 1)
  - is_active: Boolean (활성 상태, 숨기기용)
  - created_at: DateTime
  - updated_at: DateTime
- Relationship
  - progress_records: ProgressRecord 모델과 1:N 관계 (cascade delete)
  - TODO: Group 모델에 textbooks relationship 추가 필요
- 메서드
  - to_dict(): API 응답용 딕셔너리 반환

##### LessonRecord 모델 (backend/app/models/lesson.py)

- F-005 및 데이터베이스 설계서와 일치하는 구조
- LessonRecord 모델 주요 필드
  - id: String(36) UUID (Primary Key)
  - schedule_id: FK to schedules (CASCADE 삭제, UNIQUE, 인덱스)
    - 한 일정당 하나의 수업 기록만 가능 (1:1 관계)
  - group_id: FK to groups (인덱스)
  - content: Text (오늘 배운 내용, 필수, 10-2000자)
  - student_feedback: Text (학생 상태/피드백, 선택, 최대 500자)
  - homework: Text (숙제, 선택, 최대 1000자)
  - created_by: FK to users (작성한 선생님, 인덱스)
  - is_shared: Boolean (학부모에게 공유 여부, 기본값 True)
  - shared_at: DateTime (공유 시각)
  - parent_viewed_at: DateTime (학부모가 읽은 시각)
  - student_viewed_at: DateTime (학생이 읽은 시각)
  - created_at: DateTime (인덱스)
  - updated_at: DateTime
- Relationship
  - progress_records: ProgressRecord 모델과 1:N 관계 (cascade delete)
  - TODO: Schedule, Group, User 모델에 역관계 추가
- 비즈니스 규칙
  - 작성 후 30일 이내만 수정 가능 (서비스 레이어에서 검증)
  - 작성 후 24시간 이내만 삭제 가능 (서비스 레이어에서 검증)
- 메서드
  - to_dict(): API 응답용 딕셔너리 반환

##### ProgressRecord 모델 (backend/app/models/lesson.py)

- F-005 및 데이터베이스 설계서와 일치하는 구조
- ProgressRecord 모델 주요 필드
  - id: String(36) UUID (Primary Key)
  - lesson_record_id: FK to lesson_records (CASCADE 삭제, 인덱스)
  - textbook_id: FK to textbooks (인덱스)
  - start_page: Integer (시작 페이지, >= 1)
  - end_page: Integer (끝 페이지, >= start_page)
  - created_at: DateTime
- Check Constraints
  - start_page > 0
  - end_page >= start_page
- Property
  - pages_covered: 진도량 자동 계산 (end_page - start_page + 1)
    - PostgreSQL GENERATED 컬럼 대신 Python property 사용 (SQLite 호환)
- Relationship
  - lesson_record: LessonRecord 모델과 N:1 관계
  - textbook: Textbook 모델과 N:1 관계
- 메서드
  - to_dict(): API 응답용 딕셔너리 반환 (pages_covered 포함)

#### 2.1.2 API 스키마 (backend/app/schemas/)

##### Textbook 스키마 (backend/app/schemas/textbook.py)

- Pydantic 기반 요청 및 응답 스키마 정의
- 주요 스키마
  - TextbookBase: 교재 기본 필드 (title, publisher, total_pages, start_page)
  - CreateTextbookPayload: 교재 등록 요청 (POST /textbooks/groups/{group_id})
    - title (필수, 1-200자)
    - publisher, total_pages, start_page (선택)
  - UpdateTextbookPayload: 교재 수정 요청 (PATCH /textbooks/{textbook_id})
    - title, publisher, total_pages, is_active (모두 선택)
  - TextbookOut: 교재 응답
    - textbook_id, group_id, title, publisher, total_pages, start_page, is_active
    - current_page: 현재 진도 (마지막 end_page, 계산됨)
    - progress_percentage: 진도율 (%, 계산됨)
    - created_at, updated_at
  - TextbookListResponse: 교재 목록 응답
    - items: List[TextbookOut]

##### Lesson Record & Progress 스키마 (backend/app/schemas/lesson.py)

- Pydantic 기반 요청 및 응답 스키마 정의
- 주요 스키마
  - ProgressRecordBase: 진도 기록 기본 필드 (textbook_id, start_page, end_page)
    - field_validator: end_page >= start_page 검증
  - ProgressRecordCreate: 진도 기록 생성 (LessonRecord 생성 시 포함)
  - ProgressRecordOut: 진도 기록 응답
    - progress_record_id, lesson_record_id, textbook_id, textbook_title
    - start_page, end_page, pages_covered
    - created_at
  - LessonRecordBase: 수업 기록 기본 필드 (content, student_feedback, homework)
    - content: 필수, 10-2000자
    - student_feedback: 선택, 최대 500자
    - homework: 선택, 최대 1000자
  - CreateLessonRecordPayload: 수업 기록 작성 요청 (POST /lesson-records/schedules/{schedule_id})
    - content, student_feedback, homework
    - progress_records: List[ProgressRecordCreate] (최대 5개, 여러 교재 진도 동시 기록)
  - UpdateLessonRecordPayload: 수업 기록 수정 요청 (PATCH /lesson-records/{lesson_record_id})
    - content, student_feedback, homework (모두 선택)
    - 진도 기록은 수정 불가 (새로 추가만 가능)
  - LessonRecordOut: 수업 기록 응답
    - lesson_record_id, schedule_id, group_id
    - content, student_feedback, homework
    - created_by, teacher_name
    - is_shared, shared_at
    - parent_viewed_at, student_viewed_at
    - created_at, updated_at
    - progress_records: List[ProgressRecordOut] (선택, 상세 조회 시 포함)
    - schedule_title, schedule_date (조인 결과)
  - PaginationInfo: 페이지네이션 정보
  - LessonRecordListResponse: 수업 기록 목록 응답
    - items: List[LessonRecordOut]
    - pagination: PaginationInfo
  - ProgressSummary: 교재별 진도 요약
    - textbook_id, textbook_title, publisher, total_pages, start_page
    - current_page, progress_percentage
    - total_lessons, average_pages_per_lesson
    - first_lesson_date, last_lesson_date
  - ProgressHistoryItem: 진도 히스토리 항목
    - progress_record_id, lesson_record_id, lesson_date
    - start_page, end_page, pages_covered
    - content_preview (수업 내용 미리보기)
  - ProgressHistoryResponse: 교재별 진도 히스토리 응답
    - summary: ProgressSummary
    - history: List[ProgressHistoryItem]
    - chart_labels, chart_values (차트 데이터, 선택)

#### 2.1.3 Service Layer (backend/app/services/)

##### Lesson Service (backend/app/services/lesson_service.py)

- 비즈니스 로직 레이어 (수업 기록 CRUD 및 권한 검증)
- 상수 정의
  - MAX_EDIT_DAYS = 30: 작성 후 최대 수정 가능 일수 (F-005 규칙)
  - MAX_DELETE_HOURS = 24: 작성 후 최대 삭제 가능 시간 (F-005 규칙)
  - MAX_PROGRESS_RECORDS_PER_LESSON = 5: 한 수업당 최대 진도 기록 수
- 주요 메서드
  - _check_schedule_access(db, user, schedule_id)
    - 일정 접근 권한 확인 헬퍼 메서드
    - 일정 존재, 그룹 확인, 멤버십 확인
    - HTTPException 발생 (404/403)
  - _check_teacher_permission(db, user, group)
    - 선생님 권한 확인 헬퍼 메서드
    - TEACHER 역할이 아니면 403
  - create_lesson_record(db, user, schedule_id, payload)
    - 수업 기록 작성
    - TEACHER만 작성 가능
    - 한 일정당 하나의 수업 기록만 가능 (중복 체크)
    - 진도 기록 수 제한 (최대 5개)
    - 교재가 해당 그룹에 속하는지 검증
    - LessonRecord + ProgressRecord 원자적 생성
    - 기본값: is_shared=True, shared_at=now()
  - get_lesson_record(db, user, lesson_record_id)
    - 수업 기록 상세 조회
    - 그룹 멤버만 조회 가능
    - 읽음 상태 자동 업데이트 (parent_viewed_at, student_viewed_at)
  - update_lesson_record(db, user, lesson_record_id, payload)
    - 수업 기록 수정
    - 본인이 작성한 기록만 수정 가능
    - 30일 이내만 수정 가능 (F-005 규칙)
    - 진도 기록은 수정 불가
  - delete_lesson_record(db, user, lesson_record_id)
    - 수업 기록 삭제
    - 본인이 작성한 기록만 삭제 가능
    - 24시간 이내만 삭제 가능 (F-005 규칙)
    - CASCADE로 진도 기록도 함께 삭제
  - _build_lesson_record_out(db, lesson_record)
    - LessonRecord 모델을 LessonRecordOut 스키마로 변환
    - 진도 기록 조회 및 포함
    - 선생님 이름, 일정 정보 조인

##### Textbook Service (backend/app/services/textbook_service.py)

- 비즈니스 로직 레이어 (교재 CRUD 및 진도 통계)
- 주요 메서드
  - _check_group_access(db, user, group_id)
    - 그룹 접근 권한 확인 헬퍼 메서드
  - _check_teacher_permission(db, user, group)
    - 선생님 권한 확인 헬퍼 메서드
  - create_textbook(db, user, group_id, payload)
    - 교재 등록
    - TEACHER만 등록 가능
    - 교재명 중복 허용
  - get_textbooks(db, user, group_id, include_inactive)
    - 그룹의 교재 목록 조회
    - 그룹 멤버만 조회 가능
    - 비활성 교재 포함 여부 옵션
  - update_textbook(db, user, textbook_id, payload)
    - 교재 수정
    - TEACHER만 수정 가능
    - is_active=False로 숨기기 가능
  - delete_textbook(db, user, textbook_id)
    - 교재 삭제
    - TEACHER만 삭제 가능
    - 진도 기록이 있으면 삭제 불가 (F-005 규칙)
    - 409 Conflict 반환 (HAS_PROGRESS_RECORDS)
  - get_progress_summary(db, user, group_id, textbook_id)
    - 교재별 진도 요약 및 히스토리 조회
    - 그룹 멤버만 조회 가능
    - 진도율 계산: (current_page / total_pages) * 100
    - 평균 진도 계산: 총 페이지 / 수업 횟수
    - 차트 데이터 생성 (날짜별 누적 진도)
  - _build_textbook_out(db, textbook)
    - Textbook 모델을 TextbookOut 스키마로 변환
    - 현재 진도 계산 (마지막 end_page)
    - 진도율 계산

#### 2.1.4 Routers (backend/app/routers/)

##### Lesson Records Router (backend/app/routers/lessons.py)

- API 엔드포인트 레이어
- 주요 엔드포인트
  - POST /api/v1/lesson-records/schedules/{schedule_id}
    - 수업 기록 작성
    - @router.post, response_model=LessonRecordOut, 201
  - GET /api/v1/lesson-records/{lesson_record_id}
    - 수업 기록 상세 조회
    - @router.get, response_model=LessonRecordOut
  - PATCH /api/v1/lesson-records/{lesson_record_id}
    - 수업 기록 수정
    - @router.patch, response_model=LessonRecordOut
  - DELETE /api/v1/lesson-records/{lesson_record_id}
    - 수업 기록 삭제
    - @router.delete, 204 No Content
- TODO (Phase 2)
  - GET /api/v1/groups/{group_id}/lesson-records: 수업 기록 목록 조회 (페이지네이션)
  - 수업 기록 검색/필터링
  - 진도 리포트 생성

##### Textbooks Router (backend/app/routers/textbooks.py)

- API 엔드포인트 레이어
- 주요 엔드포인트
  - POST /api/v1/textbooks/groups/{group_id}
    - 교재 등록
    - @router.post, response_model=TextbookOut, 201
  - GET /api/v1/textbooks/groups/{group_id}
    - 교재 목록 조회
    - @router.get, response_model=TextbookListResponse
    - Query Parameter: include_inactive (기본값: false)
  - PATCH /api/v1/textbooks/{textbook_id}
    - 교재 수정
    - @router.patch, response_model=TextbookOut
  - DELETE /api/v1/textbooks/{textbook_id}
    - 교재 삭제
    - @router.delete, 204 No Content
  - GET /api/v1/textbooks/groups/{group_id}/progress/{textbook_id}
    - 교재별 진도 요약 및 히스토리 조회
    - @router.get, response_model=ProgressHistoryResponse
- 에러 코드
  - TEXTBOOK001: 교재 등록 오류
  - TEXTBOOK002: 교재 목록 조회 오류
  - TEXTBOOK003: 교재 수정 오류
  - TEXTBOOK004: 교재 삭제 오류
  - TEXTBOOK005: 진도 조회 오류

#### 2.1.5 Main Application 등록 (backend/app/main.py)

- Router 등록
  - lessons_router: /api/v1/lesson-records
  - textbooks_router: /api/v1/textbooks
- Database 초기화 시 새 모델 테이블 자동 생성

## 3. 주요 엔드포인트 목록

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|----------|------|------|
| POST | /api/v1/lesson-records/schedules/{schedule_id} | 수업 기록 작성 | TEACHER |
| GET | /api/v1/lesson-records/{lesson_record_id} | 수업 기록 상세 조회 | 그룹 멤버 |
| PATCH | /api/v1/lesson-records/{lesson_record_id} | 수업 기록 수정 | TEACHER (작성자) |
| DELETE | /api/v1/lesson-records/{lesson_record_id} | 수업 기록 삭제 | TEACHER (작성자) |
| POST | /api/v1/textbooks/groups/{group_id} | 교재 등록 | TEACHER |
| GET | /api/v1/textbooks/groups/{group_id} | 교재 목록 조회 | 그룹 멤버 |
| PATCH | /api/v1/textbooks/{textbook_id} | 교재 수정 | TEACHER |
| DELETE | /api/v1/textbooks/{textbook_id} | 교재 삭제 | TEACHER |
| GET | /api/v1/textbooks/groups/{group_id}/progress/{textbook_id} | 진도 요약 및 히스토리 조회 | 그룹 멤버 |

## 4. 비즈니스 규칙 구현

### 4.1 수업 기록 관련

- 한 일정당 하나의 수업 기록만 가능 (schedule_id UNIQUE)
- TEACHER만 수업 기록 작성/수정/삭제 가능
- 작성 후 30일 이내만 수정 가능 (MAX_EDIT_DAYS)
- 작성 후 24시간 이내만 삭제 가능 (MAX_DELETE_HOURS)
- 본인이 작성한 기록만 수정/삭제 가능
- 학부모/학생 조회 시 읽음 상태 자동 업데이트
- 기본값: is_shared=True (자동 공유)

### 4.2 진도 기록 관련

- 한 수업에 최대 5개 교재의 진도 기록 가능 (MAX_PROGRESS_RECORDS_PER_LESSON)
- 진도 기록은 LessonRecord와 함께 생성 (원자적)
- 진도 기록은 수정 불가 (LessonRecord 수정 시에도)
- start_page > 0, end_page >= start_page 검증
- pages_covered 자동 계산 (end_page - start_page + 1)

### 4.3 교재 관련

- TEACHER만 교재 등록/수정/삭제 가능
- 교재명 중복 허용 (예: "수학의 정석 상권", "수학의 정석 하권")
- 진도 기록이 있는 교재는 삭제 불가, 숨기기만 가능 (is_active=False)
- 현재 진도 = 마지막 ProgressRecord의 end_page
- 진도율 = (current_page / total_pages) * 100

### 4.4 권한 분리

- 선생님:
  - 수업 기록 작성/수정/삭제
  - 교재 등록/수정/삭제
  - 진도 요약 조회
- 학생/학부모:
  - 수업 기록 조회 (읽기 전용)
  - 교재 목록 조회 (읽기 전용)
  - 진도 요약 조회 (읽기 전용)

## 5. DB 모델 및 관계 변경사항

### 5.1 새로 추가된 테이블

- `textbooks`: 교재 정보
- `lesson_records`: 수업 기록
- `progress_records`: 진도 기록

### 5.2 관계 정의

- Group (1) ──< (N) Textbook
- Schedule (1) ─── (1) LessonRecord (UNIQUE 제약)
- Group (1) ──< (N) LessonRecord
- User (1) ──< (N) LessonRecord (created_by)
- LessonRecord (1) ──< (N) ProgressRecord (CASCADE 삭제)
- Textbook (1) ──< (N) ProgressRecord

### 5.3 역관계 추가 필요 (TODO)

- Group 모델에 textbooks, lesson_records relationship 추가
- Schedule 모델에 lesson_record relationship 추가
- User 모델에 lesson_records relationship 추가 (선택사항)

## 6. 테스트 및 검증

### 6.1 구문 검증

- Python 구문 체크 완료 (py_compile)
  - models/textbook.py ✅
  - models/lesson.py ✅
  - schemas/textbook.py ✅
  - schemas/lesson.py ✅
  - services/lesson_service.py ✅
  - services/textbook_service.py ✅
  - routers/lessons.py ✅
  - routers/textbooks.py ✅

### 6.2 Import 검증

- models/__init__.py에 Textbook, LessonRecord, ProgressRecord 등록 완료
- schemas/__init__.py에 모든 스키마 등록 완료
- routers/__init__.py에 lessons_router, textbooks_router 등록 완료
- main.py에 라우터 등록 완료

### 6.3 데이터베이스

- SQLite 개발 환경: 테이블 자동 생성 (init_db)
- PostgreSQL 운영 환경: Alembic 마이그레이션 필요 (TODO Phase 2)

## 7. 남은 작업 (TODO)

### 7.1 MVP 범위 외 (Phase 2)

- 수업 기록 목록 조회 (페이지네이션)
  - GET /api/v1/groups/{group_id}/lesson-records?page=1&size=20
- 수업 기록 검색/필터링
  - 날짜 범위, 교재, 키워드 검색
- 진도 리포트 생성 및 공유
  - 기간별 진도 요약, PDF 생성
- 알림 전송 (F-008 연동)
  - 수업 기록 작성 시 학부모/학생에게 자동 알림
  - 진도 리포트 공유 시 알림
- 수업 기록 수정 이력 추적 (LessonRecordHistory 테이블)
- 정산 완료 후 수업 기록 수정 불가 (F-006 연동)

### 7.2 모델 역관계 추가

- Group 모델에 textbooks, lesson_records relationship 추가
- Schedule 모델에 lesson_record relationship 추가
- User 모델에 lesson_records relationship 추가 (선택)

### 7.3 추가 검증 로직

- 교재의 total_pages 대비 end_page 초과 경고
- 지난번 진도와 순서 불일치 경고 (예: 67페이지까지 했는데 30페이지부터 시작)

## 8. 파일 변경 목록

### 8.1 신규 파일

- backend/app/models/textbook.py
- backend/app/models/lesson.py
- backend/app/schemas/textbook.py
- backend/app/schemas/lesson.py
- backend/app/services/lesson_service.py
- backend/app/services/textbook_service.py
- backend/app/routers/lessons.py
- backend/app/routers/textbooks.py

### 8.2 수정된 파일

- backend/app/models/__init__.py
  - Textbook, LessonRecord, ProgressRecord import 추가
- backend/app/schemas/__init__.py
  - 모든 신규 스키마 import 추가
- backend/app/routers/__init__.py
  - lessons_router, textbooks_router import 추가
- backend/app/main.py
  - 라우터 등록 추가 (F-005 섹션)

## 9. 다음 단계

### 9.1 프론트엔드 구현

- TypeScript 타입 정의 (types/lesson.ts, types/textbook.ts)
- API 클라이언트 (lib/lessonApi.ts, lib/textbookApi.ts)
- 수업 기록 작성 화면 (S-0XX)
- 수업 기록 상세 화면 (S-0XX)
- 진도 히스토리 화면 (S-0XX)
- 교재 관리 화면 (S-0XX)

### 9.2 통합 테스트

- F-003 (일정) → F-004 (출결) → F-005 (수업 기록) 플로우 테스트
- 여러 교재 진도 동시 기록 테스트
- 진도율 계산 정확성 테스트
- 권한 분리 테스트 (선생님/학생/학부모)

### 9.3 F-006 정산 연동

- 수업 기록 존재 여부 확인 (정산 시)
- 정산 완료 후 수업 기록 수정 불가 검증

## 10. 참고 문서

- F-005_수업_기록_및_진도_관리.md
- API_명세서.md (6.5 F-005 섹션)
- 데이터베이스_설계서.md (3.10~3.12 테이블)
- CLAUDE.md (F-005 구현 가이드라인)
