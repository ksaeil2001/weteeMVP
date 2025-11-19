# N+1 쿼리 최적화 요약

## 개요
WeTee MVP 백엔드의 N+1 쿼리 문제를 최적화했습니다. SQLAlchemy의 `joinedload`를 사용하여 관련 데이터를 eager loading하고, 복합 인덱스를 추가하여 쿼리 성능을 개선했습니다.

---

## 1. 서비스 레이어 최적화

### 1.1 GroupService

**파일**: `backend/app/services/group_service.py`

**변경사항**:
- `get_group_detail()` 메서드에서 `GroupMember` 조회 시 `user` 정보도 함께 로드
- 멤버 목록을 순회할 때 각 멤버마다 user를 조회하는 N+1 문제 해결

**Before**:
```python
members = (
    db.query(GroupMember)
    .filter(...)
    .all()
)
# 각 member마다 user 조회 시 추가 쿼리 발생 → N+1 문제
```

**After**:
```python
members = (
    db.query(GroupMember)
    .options(joinedload(GroupMember.user))  # ✅ user 정보 함께 로드
    .filter(...)
    .all()
)
```

**모델 변경**:
- `backend/app/models/group.py`: `GroupMember` 모델에 `user` relationship 추가

---

### 1.2 ScheduleService

**파일**: `backend/app/services/schedule_service.py`

**변경사항**:
- `get_schedules()`: 기존 `lesson_record` joinedload에 `attendances`도 추가
- `get_schedule_detail()`: `attendances`, `lesson_record` 함께 로드
- `update_schedule()`: `attendances`, `lesson_record` 함께 로드

**Before**:
```python
query = db.query(Schedule).options(
    joinedload(Schedule.lesson_record)
).filter(...)
# attendances는 로드하지 않음 → 필요 시 추가 쿼리 발생
```

**After**:
```python
query = db.query(Schedule).options(
    joinedload(Schedule.lesson_record),
    joinedload(Schedule.attendances)  # ✅ attendances도 함께 로드
).filter(...)
```

---

### 1.3 LessonService

**파일**: `backend/app/services/lesson_service.py`

**변경사항**:
- `get_lesson_record()`: `progress_records`와 각 진도의 `textbook`을 함께 로드
- `update_lesson_record()`: 동일하게 `progress_records.textbook` 함께 로드
- `create_lesson_record()`: 생성 후 refresh 시 `progress_records.textbook` 함께 로드
- `_build_lesson_record_out()`: 이미 로드된 relationship 사용하도록 개선

**Before**:
```python
# 진도 기록 조회
progress_records = db.query(ProgressRecord).filter(...).all()

for pr in progress_records:
    # 각 진도마다 textbook 조회 → N+1 문제
    textbook = db.query(Textbook).filter(Textbook.id == pr.textbook_id).first()
```

**After**:
```python
# 수업 기록 조회 시 진도와 교재를 함께 로드
lesson_record = db.query(LessonRecord).options(
    joinedload(LessonRecord.progress_records).joinedload(ProgressRecord.textbook)
).filter(...).first()

# 이미 로드된 relationship 사용
for pr in lesson_record.progress_records:
    textbook = pr.textbook  # ✅ 추가 쿼리 없음
```

---

## 2. 복합 인덱스 추가

### 2.1 Invoice 모델

**파일**: `backend/app/models/invoice.py`

**추가된 인덱스**:
```python
__table_args__ = (
    Index('idx_invoice_group_billing_period', 'group_id', 'billing_period_start', 'billing_period_end'),
)
```

**효과**: 그룹별 청구 기간으로 청구서를 조회할 때 성능 향상

---

### 2.2 LessonRecord 모델

**파일**: `backend/app/models/lesson.py`

**추가된 인덱스**:
```python
__table_args__ = (
    Index('idx_lesson_record_group_created', 'group_id', 'created_at'),
)
```

**효과**: 그룹별 수업 기록을 시간순으로 조회할 때 성능 향상

---

### 2.3 Attendance 모델

**파일**: `backend/app/models/attendance.py`

**기존 제약**:
```python
__table_args__ = (
    UniqueConstraint('schedule_id', 'student_id', name='uq_attendance_schedule_student'),
)
```

**설명**: UNIQUE 제약이 이미 `(schedule_id, student_id)` 복합 인덱스를 자동으로 생성하므로 추가 인덱스 불필요

---

## 3. 쿼리 개수 감소 예상

### Before (최적화 전)
- **GroupService.get_group_detail**: 1 + N개 쿼리 (N = 멤버 수)
  - 예: 멤버 10명 → 11개 쿼리
- **LessonService.get_lesson_record**: 1 + N개 쿼리 (N = 진도 기록 수)
  - 예: 진도 5개 → 6개 쿼리

### After (최적화 후)
- **GroupService.get_group_detail**: 1-3개 쿼리 (멤버 수와 무관)
- **LessonService.get_lesson_record**: 2-3개 쿼리 (진도 수와 무관)
- **ScheduleService.get_schedules**: 2-5개 쿼리 (일정 수와 무관)

---

## 4. 쿼리 로깅 활성화 방법

실제 환경에서 쿼리 개수를 확인하려면 SQLAlchemy 로깅을 활성화하세요.

### 방법 1: database.py에서 echo=True 설정

**파일**: `backend/app/database.py`

```python
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=True  # ✅ 모든 SQL 쿼리를 콘솔에 출력
)
```

### 방법 2: 환경변수 설정

**.env 파일**:
```bash
SQLALCHEMY_ECHO=True
```

**database.py**:
```python
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=settings.SQLALCHEMY_ECHO  # ✅ 환경변수로 제어
)
```

---

## 5. 테스트 스크립트

**파일**: `backend/test_n_plus_one.py`

테스트 스크립트가 제공되어 있지만, SQLAlchemy가 설치되지 않은 환경에서는 실행되지 않습니다.

**실행 방법** (가상환경 활성화 후):
```bash
cd /home/user/weteeMVP/backend
python test_n_plus_one.py
```

**기대 결과**:
- GroupService: 1-3개 쿼리
- ScheduleService: 2-5개 쿼리
- LessonService: 2-5개 쿼리

---

## 6. 수동 검증 방법

### 방법 1: API 호출 후 로그 확인

1. `echo=True` 설정
2. FastAPI 서버 실행:
   ```bash
   cd /home/user/weteeMVP/backend
   uvicorn app.main:app --reload
   ```
3. API 호출:
   ```bash
   # 그룹 상세 조회
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/v1/groups/{group_id}

   # 일정 목록 조회
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/v1/schedules?page=1&size=10

   # 수업 기록 조회
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/v1/lesson-records/{lesson_record_id}
   ```
4. 콘솔에 출력되는 SQL 쿼리 개수 확인

### 방법 2: 쿼리 카운터 이벤트 리스너 추가

**임시 코드** (main.py 또는 database.py에 추가):
```python
from sqlalchemy import event
from sqlalchemy.engine import Engine

query_count = 0

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
    global query_count
    query_count += 1
    print(f"Query #{query_count}: {statement[:80]}...")
```

---

## 7. 변경된 파일 목록

### 서비스 레이어
- ✅ `backend/app/services/group_service.py`
- ✅ `backend/app/services/schedule_service.py`
- ✅ `backend/app/services/lesson_service.py`

### 모델
- ✅ `backend/app/models/group.py` (GroupMember.user relationship 추가)
- ✅ `backend/app/models/invoice.py` (복합 인덱스 추가)
- ✅ `backend/app/models/lesson.py` (복합 인덱스 추가)
- ✅ `backend/app/models/attendance.py` (주석 추가)

### 테스트 스크립트
- ✅ `backend/test_n_plus_one.py` (신규 생성)
- ✅ `backend/N_PLUS_ONE_OPTIMIZATION_SUMMARY.md` (이 파일)

---

## 8. 데이터베이스 마이그레이션

SQLite 개발 환경에서는 DB 재생성이 필요합니다 (복합 인덱스 적용).

### 방법 1: DB 리셋 스크립트 실행

```bash
cd /home/user/weteeMVP/backend
python scripts/reset_dev_db.py --seed
```

### 방법 2: 수동 재생성

```bash
cd /home/user/weteeMVP/backend
rm wetee.db
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

**주의**: 기존 데이터가 삭제됩니다. 필요 시 백업하세요.

---

## 9. 성능 개선 요약

| 항목 | Before | After | 개선율 |
|------|--------|-------|--------|
| GroupService.get_group_detail (멤버 10명) | 11 queries | 1-3 queries | ~73% ↓ |
| LessonService.get_lesson_record (진도 5개) | 6 queries | 2-3 queries | ~50% ↓ |
| ScheduleService.get_schedules (일정 20개) | 1 + N queries | 2-5 queries | ~75% ↓ |

---

## 10. 추가 고려사항

### 10.1 Lazy Loading vs Eager Loading
- **Lazy Loading** (기본값): 필요할 때마다 쿼리 (N+1 문제 발생 가능)
- **Eager Loading** (joinedload): 미리 함께 로드 (N+1 문제 해결)

### 10.2 언제 joinedload를 사용해야 하는가?
- ✅ **사용해야 할 때**: 관련 데이터를 항상 사용하는 경우
  - 예: 그룹 상세에서 멤버 목록을 항상 표시
- ❌ **사용하지 말아야 할 때**: 관련 데이터를 거의 사용하지 않는 경우
  - 예: 목록 조회에서 상세 정보를 표시하지 않는 경우

### 10.3 다른 최적화 기법
- **selectinload**: 1:N 관계에서 IN 절을 사용한 로드 (대량 데이터에 유리)
- **subqueryload**: 서브쿼리를 사용한 로드
- **lazy='select'**: 개별 SELECT (기본값)
- **lazy='joined'**: 항상 JOIN (relationship 레벨에서 설정)

---

## 11. 참고 자료

- SQLAlchemy ORM Tutorial - Relationship Loading: https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html
- FastAPI Database Guide: https://fastapi.tiangolo.com/tutorial/sql-databases/
- N+1 Query Problem Explained: https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem-in-orm-object-relational-mapping

---

**작성일**: 2025-11-19
**작성자**: Claude Code
**프로젝트**: WeTee MVP Backend Optimization
