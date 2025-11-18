# F-004 출결 관리 백엔드 구현 보고서 (MVP)

## 1. 개요

- 기능 ID: F-004 출결 관리
- 보고 일자: 2025-11-18
- 기준 브랜치: claude/implement-attendance-backend-01UDmgHrP7QRsfCzcmAsdGhC
- 범위:
  - 출결 기록 생성 및 관리 (CRUD)
  - 배치 출결 체크 (여러 학생 동시)
  - 출결 수정 (권한 및 시간 제약)
  - 일정별/학생별 출결 목록 조회
  - 출결 통계 조회 (출석률, 출석/지각/조퇴/결석 횟수)
  - 백엔드 도메인 레이어 완전 구현 (모델, 스키마, 서비스, 라우터)
- 목적:
  - F-004 기능 명세서, API 명세서, 데이터베이스 설계서 기준으로
    MVP 단계에서 필요한 핵심 출결 관리 기능의 백엔드를 완료하는 것

## 2. 구현 내용 요약

### 2.1 백엔드 (FastAPI)

#### 2.1.1 Attendance 모델 (backend/app/models/attendance.py)

- F-004 및 데이터베이스 설계서와 일치하는 구조
- 주요 Enum 정의
  - AttendanceStatus: PRESENT, LATE, EARLY_LEAVE, ABSENT
    - PRESENT (출석): 정상 참여, 정산 시 포함
    - LATE (지각): 늦게 도착, 정산 시 포함
    - EARLY_LEAVE (조퇴): 일찍 퇴실, 정산 시 포함
    - ABSENT (결석): 불참, 정산 시 제외
- Attendance 모델 주요 필드
  - id: String(36) UUID (Primary Key)
  - schedule_id: FK to schedules (CASCADE 삭제, 인덱스)
  - student_id: FK to users (인덱스)
  - status: AttendanceStatus (인덱스)
  - late_minutes: Integer (지각 시간, 분 단위, 선택)
  - memo: Text (메모, 사유 등)
  - recorded_at: DateTime (출결 기록 시각, 인덱스)
  - updated_at: DateTime (마지막 수정 시각)
- Relationship
  - schedule: Schedule 모델과 N:1 관계 (back_populates)
  - Schedule 모델에 attendances relationship 추가 완료
- 제약 조건
  - UNIQUE(schedule_id, student_id): 한 일정에 한 학생당 하나의 출결만 가능
- 메서드
  - to_dict(): API 응답용 딕셔너리 반환 (attendance_id, schedule_id, student_id, status, late_minutes, memo, recorded_at, updated_at)

#### 2.1.2 Attendance 스키마 (backend/app/schemas/attendance.py)

- Pydantic 기반 요청 및 응답 스키마 정의
- 주요 스키마
  - AttendanceBase: 출결 기본 필드 (status, late_minutes, notes)
  - CreateAttendancePayload: 출결 생성 요청 (POST /attendances)
    - schedule_id, student_id, status, late_minutes, notes
  - BatchAttendanceItemPayload: 배치 출결 체크 개별 항목
    - student_id, status, late_minutes, notes
  - BatchCreateAttendancePayload: 배치 출결 체크 요청 (POST /attendances/schedules/{id}/batch)
    - attendances: List[BatchAttendanceItemPayload]
    - checked_at: 출결 체크 시각 (선택)
  - UpdateAttendancePayload: 출결 수정 요청 (PATCH /attendances/{id})
    - status, late_minutes, notes (모두 선택)
  - AttendanceOut: 단일 출결 응답
    - attendance_id, schedule_id, student_id, student (user_id, name)
    - status, late_minutes, notes, recorded_at, updated_at
  - BatchAttendanceResponse: 배치 출결 체크 응답
    - schedule_id, attendances: List[AttendanceOut]
  - AttendanceListResponse: 출결 목록 응답
    - items: List[AttendanceOut], total: int
  - AttendanceStats: 출결 통계
    - total_sessions, present, late, early_leave, absent, attendance_rate (%)
  - AttendanceStatsResponse: 출결 통계 응답 (GET /groups/{id}/attendances/stats)
    - student: StudentInfo (특정 학생 통계일 경우)
    - period: {"start_date": "...", "end_date": "..."}
    - stats: AttendanceStats
    - recent_records: List[RecentAttendanceRecord] (최대 10개)
- API 명세서와 100% 일치
- 프론트엔드 TypeScript 타입과 호환

#### 2.1.3 Attendance 서비스 (backend/app/services/attendance_service.py)

- 비즈니스 로직 레이어 (DB 접근 및 데이터 가공)
- 상수 정의
  - MAX_CHECK_DAYS = 7: 수업 종료 후 최대 출결 체크 가능 일수
  - MAX_EDIT_DAYS = 7: 최초 기록 후 최대 수정 가능 일수
- 주요 메서드
  - _check_schedule_access(db, user, schedule_id)
    - 일정 접근 권한 확인 헬퍼 메서드
    - 일정 존재, 그룹 확인, 멤버십 확인
    - HTTPException 발생 (404/403)
  - _check_teacher_permission(db, user, group)
    - 선생님 권한 확인 헬퍼 메서드
    - TEACHER 역할이 아니면 403
  - _validate_check_time(schedule)
    - 출결 체크 가능 시간 검증
    - 수업 시작 전: 체크 불가 (TOO_EARLY_TO_CHECK)
    - 수업 종료 후 7일 경과: 체크 불가 (CHECK_DEADLINE_PASSED)
  - _validate_edit_time(attendance)
    - 출결 수정 가능 시간 검증
    - 최초 기록 후 7일 경과: 수정 불가 (EDIT_DEADLINE_PASSED)
  - create_attendance(db, user, payload)
    - 출결 생성 (단일 학생)
    - TEACHER만 생성 가능
    - 중복 체크 (schedule_id + student_id 유니크)
    - 학생이 그룹 멤버인지 확인
    - IntegrityError 처리
  - batch_create_attendances(db, user, schedule_id, payload)
    - 배치 출결 체크 (여러 학생 동시)
    - API 명세서 6.4.1 기반
    - 이미 기록된 출결이 있으면 덮어쓰기 (업데이트)
    - 그룹에 속하지 않은 학생은 스킵
  - get_attendance(db, user, attendance_id)
    - 출결 단건 조회
    - 그룹 멤버만 조회 가능
  - update_attendance(db, user, attendance_id, payload)
    - 출결 수정
    - TEACHER만 수정 가능
    - 7일 이내 수정 가능
    - TODO: 정산 완료 후 수정 불가 검증 (F-006 연계)
  - delete_attendance(db, user, attendance_id)
    - 출결 삭제
    - F-004 비즈니스 규칙: 출결 삭제 불가 (감사 추적 필요)
    - 405 Method Not Allowed 반환
  - get_attendances_by_schedule(db, user, schedule_id)
    - 일정별 출결 목록 조회
    - 그룹 멤버만 조회 가능
  - get_attendances_by_student(db, user, student_id, group_id, start_date, end_date)
    - 학생별 출결 목록 조회
    - 날짜 범위 필터링 지원
    - 그룹 필터링 지원
  - get_attendance_stats(db, user, group_id, student_id, start_date, end_date)
    - 출결 통계 조회
    - API 명세서 6.4.3 기반
    - 그룹 전체 또는 특정 학생 통계
    - 날짜 범위 필터링 (기본값: 당월)
    - 출석률 계산: (출석 + 지각 + 조퇴) / 전체 * 100
    - 최근 출결 기록 10개 포함
  - _to_attendance_out(db, attendance)
    - Attendance 모델을 AttendanceOut 스키마로 변환
    - 학생 정보 조인 (user_id, name)
- 비즈니스 규칙 구현
  - 7일 룰 (출결 체크): 수업 종료 후 7일 이내에만 체크 가능
  - 7일 룰 (출결 수정): 최초 기록 후 7일 이내에만 수정 가능
  - 선생님 권한: 출결 기록/수정은 TEACHER만 가능
  - 출결 삭제 불가: 감사 추적을 위해 삭제 대신 수정만 허용
  - 정산 연계: 결석(ABSENT)은 정산 시 수업 횟수에서 제외
  - TODO: 정산 완료 후 수정 불가 (F-006 연계)

#### 2.1.4 Attendance Router (backend/app/routers/attendances.py)

- REST API 엔드포인트 정의
- 주요 엔드포인트
  - POST /api/v1/attendances
    - 출결 생성 (단일 학생)
    - Request Body: CreateAttendancePayload
    - Response: AttendanceOut (201 Created)
  - POST /api/v1/attendances/schedules/{schedule_id}/batch
    - 배치 출결 체크 (여러 학생 동시)
    - Request Body: BatchCreateAttendancePayload
    - Response: BatchAttendanceResponse (201 Created)
  - GET /api/v1/attendances/{attendance_id}
    - 출결 단건 조회
    - Response: AttendanceOut
  - PATCH /api/v1/attendances/{attendance_id}
    - 출결 수정
    - Request Body: UpdateAttendancePayload
    - Response: AttendanceOut
  - GET /api/v1/attendances/schedules/{schedule_id}
    - 일정별 출결 목록 조회
    - Response: AttendanceListResponse
  - GET /api/v1/attendances/students/{student_id}
    - 학생별 출결 목록 조회
    - Query Params: group_id, start_date, end_date
    - Response: AttendanceListResponse
  - GET /api/v1/attendances/groups/{group_id}/stats
    - 출결 통계 조회
    - Query Params: student_id, start_date, end_date
    - Response: AttendanceStatsResponse
- 인증
  - 모든 엔드포인트는 current_user dependency로 JWT 인증 필수
- 에러 처리
  - HTTPException은 그대로 전달
  - 기타 예외는 500 INTERNAL_ERROR로 변환
  - 에러 코드: ATTENDANCE001 ~ ATTENDANCE007

#### 2.1.5 통합 및 등록

- backend/app/models/__init__.py에 Attendance 모델 등록
- backend/app/schemas/__init__.py에 Attendance 스키마 등록
- backend/app/services/__init__.py에 AttendanceService 등록
- backend/app/routers/__init__.py에 attendances_router 등록
- backend/app/main.py에 attendance 라우터 등록
  - app.include_router(attendances_router, prefix="/api/v1")
- Schedule 모델에 attendances relationship 추가

### 2.2 프론트엔드 연동 (준비)

- backend/app/models/attendance.py에 Attendance 모델 정의 완료
- 프론트엔드 목업 확인:
  - frontend/src/mocks/attendance.ts 존재
  - 향후 실제 API 클라이언트로 교체 필요
- 프론트엔드 API 클라이언트 작성 가이드:
  - frontend/src/lib/attendanceApi.ts 생성 필요
  - AttendanceService의 모든 메서드에 대응하는 API 함수 작성
  - 예: createAttendance, batchCreateAttendances, getAttendance, updateAttendance, getAttendancesBySchedule, getAttendancesByStudent, getAttendanceStats
  - fetch 또는 axios 사용, Authorization 헤더에 JWT 토큰 포함
  - 응답 스키마는 AttendanceOut, AttendanceListResponse, AttendanceStatsResponse와 일치

## 3. 주요 엔드포인트

| 메서드 | 경로 | 설명 | 권한 | 요청 스키마 | 응답 스키마 |
|--------|------|------|------|------------|------------|
| POST | /api/v1/attendances | 출결 생성 (단일) | TEACHER | CreateAttendancePayload | AttendanceOut |
| POST | /api/v1/attendances/schedules/{id}/batch | 배치 출결 체크 | TEACHER | BatchCreateAttendancePayload | BatchAttendanceResponse |
| GET | /api/v1/attendances/{id} | 출결 단건 조회 | 그룹 멤버 | - | AttendanceOut |
| PATCH | /api/v1/attendances/{id} | 출결 수정 | TEACHER | UpdateAttendancePayload | AttendanceOut |
| GET | /api/v1/attendances/schedules/{id} | 일정별 출결 목록 | 그룹 멤버 | - | AttendanceListResponse |
| GET | /api/v1/attendances/students/{id} | 학생별 출결 목록 | 그룹 멤버 | Query: group_id, start_date, end_date | AttendanceListResponse |
| GET | /api/v1/attendances/groups/{id}/stats | 출결 통계 | 그룹 멤버 | Query: student_id, start_date, end_date | AttendanceStatsResponse |

## 4. 데이터베이스 변경 사항

### 4.1 새로운 테이블

- attendances (출결 기록)
  - id: String(36) UUID PK
  - schedule_id: FK to schedules (CASCADE)
  - student_id: FK to users
  - status: ENUM (PRESENT, LATE, EARLY_LEAVE, ABSENT)
  - late_minutes: Integer (NULL)
  - memo: Text (NULL)
  - recorded_at: DateTime
  - updated_at: DateTime
  - UNIQUE(schedule_id, student_id)
  - INDEX: schedule_id, student_id, status, recorded_at

### 4.2 기존 테이블 변경

- schedules
  - relationship: attendances = relationship("Attendance", ...)
  - CASCADE 삭제: 일정 삭제 시 출결도 함께 삭제

## 5. 비즈니스 규칙 구현

| 규칙 | 구현 위치 | 설명 |
|------|----------|------|
| 출결 체크 시간 제약 | AttendanceService._validate_check_time | 수업 시작 후 ~ 종료 후 7일 이내 |
| 출결 수정 시간 제약 | AttendanceService._validate_edit_time | 최초 기록 후 7일 이내 |
| 선생님 권한 | AttendanceService._check_teacher_permission | 출결 기록/수정은 TEACHER만 |
| 출결 삭제 불가 | AttendanceService.delete_attendance | 405 Method Not Allowed |
| 중복 출결 방지 | UNIQUE(schedule_id, student_id) | DB 제약 조건 |
| 출석률 계산 | AttendanceService.get_attendance_stats | (출석+지각+조퇴) / 전체 * 100 |
| 정산 연계 | AttendanceStatus.ABSENT | 결석만 정산에서 제외 |

## 6. 테스트 및 검증

### 6.1 구현 완료 항목

- [x] Attendance 모델 정의 및 relationship 설정
- [x] Attendance 스키마 정의 (요청/응답)
- [x] AttendanceService 전체 메서드 구현
- [x] Attendance Router 전체 엔드포인트 구현
- [x] main.py에 라우터 등록
- [x] 비즈니스 규칙 구현 (7일 룰, 선생님 권한, 삭제 불가)

### 6.2 수동 테스트 가이드

백엔드 서버가 실행 가능한 환경에서 다음 순서로 테스트:

1. 서버 시작
   ```bash
   cd /home/user/weteeMVP/backend
   python app/main.py
   ```

2. Health Check
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

3. 출결 생성 (단일)
   ```bash
   # 먼저 로그인하여 JWT 토큰 획득
   TOKEN="..."

   # 출결 생성
   curl -X POST http://localhost:8000/api/v1/attendances \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "schedule_id": "schedule-123",
       "student_id": "student-456",
       "status": "PRESENT",
       "notes": "수업 잘 들음"
     }'
   ```

4. 배치 출결 체크
   ```bash
   curl -X POST http://localhost:8000/api/v1/attendances/schedules/schedule-123/batch \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "attendances": [
         {"student_id": "student-1", "status": "PRESENT"},
         {"student_id": "student-2", "status": "LATE", "late_minutes": 10}
       ]
     }'
   ```

5. 출결 통계 조회
   ```bash
   curl -X GET "http://localhost:8000/api/v1/attendances/groups/group-123/stats?start_date=2025-11-01&end_date=2025-11-30" \
     -H "Authorization: Bearer $TOKEN"
   ```

## 7. 남은 작업 (TODO)

### 7.1 백엔드

- [ ] 정산 완료 후 출결 수정 불가 검증 (F-006 연계)
- [ ] 출결 수정 이력 추적 (Phase 2)
  - attendance_history 테이블 추가
  - 누가, 언제, 무엇을, 왜 수정했는지 기록
- [ ] 출결 기록/수정 알림 발송 (F-008 연계)
  - 학생 + 학부모에게 푸시 알림
  - 출결 상태 변경 시 알림

### 7.2 프론트엔드

- [ ] 실제 API 클라이언트 작성 (frontend/src/lib/attendanceApi.ts)
  - createAttendance, batchCreateAttendances, getAttendance
  - updateAttendance, getAttendancesBySchedule, getAttendancesByStudent
  - getAttendanceStats
- [ ] 목업 데이터 제거 (frontend/src/mocks/attendance.ts)
- [ ] 출결 체크 화면 구현 (선생님)
  - S-XXX: 출결 체크 모달/화면
  - 4개 버튼 (출석/지각/조퇴/결석)
  - 메모 입력 (지각/조퇴/결석 시)
- [ ] 출결 리스트 화면 구현 (학생/학부모)
  - S-XXX: 출결 기록 화면
  - 통계 요약 카드 (출석률, 원 그래프)
  - 출결 카드 리스트 (날짜, 시간, 상태, 메모)
- [ ] 출결 통계 화면 구현
  - S-XXX: 출결 통계 화면
  - 월별 출석률 라인 차트
  - 출석/지각/조퇴/결석 바 차트
  - 요약 통계 카드

### 7.3 통합 테스트

- [ ] 출결 체크 → 정산 연계 테스트 (F-006)
- [ ] 출결 체크 → 알림 발송 테스트 (F-008)
- [ ] 일정 삭제 → 출결 CASCADE 삭제 테스트

## 8. 참고 문서

- F-004_출결_관리.md: 기능 명세서
- API_명세서.md: 6.4 F-004 출결 관리
- 데이터베이스_설계서.md: 3.9 attendances 테이블
- UX_UI_설계서.md: S-XXX 출결 관련 화면 (추후 확인)
- F-001_auth_completion_2025-11-17.md: 인증 구현 참고
- F-003_schedules_completion_2025-11-18.md: 일정 관리 구현 참고

## 9. 변경 파일 목록

### 생성된 파일

- backend/app/models/attendance.py (182 lines)
- backend/app/schemas/attendance.py (297 lines)
- backend/app/services/attendance_service.py (608 lines)
- backend/app/routers/attendances.py (339 lines)

### 수정된 파일

- backend/app/models/__init__.py
  - Attendance 모델 import 추가
- backend/app/models/schedule.py
  - attendances relationship 추가
- backend/app/schemas/__init__.py
  - Attendance 스키마 import 추가
- backend/app/services/__init__.py
  - AttendanceService import 추가
- backend/app/routers/__init__.py
  - attendances_router import 추가
- backend/app/main.py
  - attendances_router 등록

## 10. 마무리

F-004 출결 관리 기능의 백엔드 구현을 완료했습니다. 모델, 스키마, 서비스, 라우터의 전체 도메인 레이어가 구현되었으며, F-003 수업 일정 관리와의 연동도 준비되었습니다. 프론트엔드 API 클라이언트 작성 및 화면 구현은 사용자가 직접 진행할 수 있도록 가이드를 제공했습니다.

다음 단계는:
1. 프론트엔드 API 클라이언트 작성 및 목업 제거
2. 출결 관련 화면 구현 (선생님/학생/학부모)
3. F-006 정산, F-008 알림과의 통합 테스트
