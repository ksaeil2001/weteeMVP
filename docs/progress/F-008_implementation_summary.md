# F-008 필수 알림 시스템 - MVP 구현 완료 보고서

**문서 작성일**: 2025-11-18
**상태**: MVP 코어 기능 구현 완료
**범위**: F-008 필수 알림 시스템 (알림 CRUD, 필터링, 페이지네이션)

---

## 1. 개요

F-008 필수 알림 시스템은 과외 관리 플랫폼에서 사용자들(선생님, 학생, 학부모)에게 중요한 이벤트를 실시간으로 알려주는 핵심 기능입니다.

**MVP 단계에서 구현된 내용**:
- ✅ 알림 데이터 모델 및 데이터베이스 스키마
- ✅ 알림 CRUD API (Create, Read, Update, Delete)
- ✅ 알림 필터링 및 페이지네이션
- ✅ 읽음/안 읽음 상태 관리
- ✅ 카테고리별 알림 집계
- ✅ 프론트엔드 UI 컴포넌트 및 API 클라이언트
- ✅ 일반 목적 알림 생성 함수 (이벤트 기반 알림용)

---

## 2. 백엔드 구현 상세

### 2.1 데이터 모델 (backend/app/models/notification.py)

**Notification 테이블 구조**:

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 알림 고유 ID |
| user_id | UUID | 알림 수신자 ID |
| type | Enum | 알림 타입 (SCHEDULE_REMINDER, ATTENDANCE_CHANGED 등) |
| category | Enum | 알림 카테고리 (schedule, attendance, payment, lesson, group, system) |
| title | String(200) | 알림 제목 (예: "🔔 1시간 후 수업") |
| message | Text | 알림 메시지 |
| priority | Enum | 우선순위 (CRITICAL > HIGH > NORMAL > LOW) |
| channel | Enum | 채널 (현재 IN_APP, 2단계: EMAIL, SMS, PUSH) |
| delivery_status | Enum | 전송 상태 (PENDING, SENT, FAILED, READ) |
| is_read | Boolean | 읽음 여부 |
| read_at | DateTime | 읽은 시각 |
| is_required | Boolean | 필수 알림 여부 (끌 수 없음) |
| related_resource_type | String | 관련 리소스 타입 (schedule, attendance, lesson, payment) |
| related_resource_id | String | 관련 리소스 ID |
| created_at | DateTime | 생성 시각 |
| expires_at | DateTime | 만료 시각 (기본 90일) |

**주요 Enum 타입**:

```python
# NotificationType - 13가지 알림 타입
SCHEDULE_REMINDER, SCHEDULE_CHANGED, SCHEDULE_CANCELLED,
ATTENDANCE_CHANGED, LESSON_RECORD_CREATED, HOMEWORK_ASSIGNED,
MAKEUP_CLASS_AVAILABLE, MAKEUP_CLASS_REQUESTED,
BILLING_ISSUED, PAYMENT_CONFIRMED, PAYMENT_FAILED,
GROUP_INVITE, SYSTEM_NOTICE

# NotificationCategory - 6가지 카테고리 (필터링용)
SCHEDULE, ATTENDANCE, PAYMENT, LESSON, GROUP, SYSTEM

# NotificationPriority
CRITICAL (정산 알림),
HIGH (수업 리마인더),
NORMAL (출결 변동, 수업 기록),
LOW (보강 오픈)
```

### 2.2 비즈니스 로직 (backend/app/services/notification_service.py)

**주요 메서드**:

#### 1) 알림 조회
```python
@staticmethod
def get_notifications(
    db: Session,
    user_id: str,
    category: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    size: int = 20,
) -> NotificationListResponse
```
- 사용자별 알림 조회
- 카테고리 및 읽음 상태로 필터링
- 페이지네이션 지원 (기본 20개/페이지)
- 최신순 정렬

#### 2) 알림 요약
```python
@staticmethod
def get_summary(db: Session, user_id: str) -> NotificationSummary
```
- 전체 읽지 않은 알림 개수
- 카테고리별 읽지 않은 알림 개수
- 가장 최근 알림 1개

#### 3) 읽음 처리
```python
@staticmethod
def mark_as_read(db: Session, user_id: str, notification_id: str) -> bool
```
- 단일 알림 읽음 처리
- read_at 타임스탠프 업데이트

#### 4) 일괄 읽음 처리
```python
@staticmethod
def mark_all_as_read(
    db: Session,
    user_id: str,
    category: Optional[str] = None
) -> MarkAllReadResponse
```
- 전체 또는 카테고리별 일괄 읽음 처리
- 읽음 처리된 개수 반환

#### 5) 알림 삭제
```python
@staticmethod
def delete_notification(db: Session, user_id: str, notification_id: str) -> bool
```
- 특정 알림 삭제

#### 6) **[NEW]** 알림 생성 (실제 이벤트용)
```python
@staticmethod
def create_notification(
    db: Session,
    user_id: str,
    notification_type: NotificationType,
    title: str,
    message: str,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    category: Optional[NotificationCategory] = None,
    related_resource_type: Optional[str] = None,
    related_resource_id: Optional[str] = None,
    is_required: bool = False,
) -> NotificationOut
```
- 실제 이벤트 기반 알림 생성
- F-003~F-006 등 다른 서비스에서 호출 가능
- 카테고리 자동 결정

#### 7) **[NEW]** 그룹 알림 생성
```python
@staticmethod
def create_notifications_for_group(
    db: Session,
    user_ids: List[str],
    notification_type: NotificationType,
    ...
) -> List[NotificationOut]
```
- 여러 사용자에게 동일 알림 일괄 전송
- F-002 그룹 이벤트 시 사용

#### 8) 테스트 알림 생성
```python
@staticmethod
def create_test_notification(
    db: Session,
    user_id: str,
    test_type: str
) -> NotificationOut
```
- 개발/테스트용 알림
- 4가지 타입 제공 (schedule, payment, attendance, lesson)

### 2.3 REST API 엔드포인트 (backend/app/routers/notifications.py)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/v1/notifications` | 알림 목록 조회 (페이지네이션, 필터링) |
| GET | `/api/v1/notifications/summary` | 알림 요약 (헤더 뱃지용) |
| PATCH | `/api/v1/notifications/{id}/read` | 단일 알림 읽음 처리 |
| POST | `/api/v1/notifications/read-all` | 일괄 읽음 처리 |
| DELETE | `/api/v1/notifications/{id}` | 알림 삭제 |
| POST | `/api/v1/notifications/test` | 테스트 알림 생성 |
| POST | `/api/v1/notifications/fcm-token` | FCM 토큰 등록 (2단계) |
| DELETE | `/api/v1/notifications/fcm-token` | FCM 토큰 삭제 (2단계) |

**인증**: 모든 엔드포인트는 JWT 기반 인증 필요 (`Authorization: Bearer <token>`)

**에러 코드**:
- 404: 알림을 찾을 수 없음
- 403: 다른 사용자의 알림에 접근 시도
- 500: 서버 오류

### 2.4 스키마 (backend/app/schemas/notification.py)

**NotificationOut**: 단일 알림 응답
```json
{
  "notification_id": "uuid-123",
  "category": "schedule",
  "type": "SCHEDULE_REMINDER",
  "title": "🔔 1시간 후 수업",
  "message": "최학생 - 수학 (오후 3시)",
  "status": "unread",
  "priority": "HIGH",
  "created_at": "2025-11-18T10:00:00Z",
  "read_at": null,
  "related_resource": {
    "type": "schedule",
    "id": "schedule-456"
  },
  "is_required": false
}
```

**NotificationListResponse**: 알림 목록 + 페이지네이션
```json
{
  "items": [...],
  "pagination": {
    "total": 42,
    "page": 1,
    "size": 20,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "unread_count": 12
}
```

**NotificationSummary**: 알림 요약
```json
{
  "total_unread": 12,
  "by_category": {
    "schedule": 5,
    "attendance": 2,
    "payment": 3,
    "lesson": 1,
    "group": 1,
    "system": 0
  },
  "latest_notification": {...}
}
```

---

## 3. 프론트엔드 구현 상세

### 3.1 타입 정의 (frontend/src/types/notifications.ts)

- NotificationType: 13가지 알림 타입 정의
- NotificationCategory: 6가지 카테고리
- NotificationItem: 단일 알림 인터페이스
- NotificationListResponse: 목록 응답 구조
- NotificationSummary: 요약 데이터 구조
- 아이콘 및 색상 맵핑 상수 제공

### 3.2 API 클라이언트 (frontend/src/lib/api/notifications.ts)

**주요 함수**:

```typescript
// 알림 목록 조회
export async function fetchNotifications(
  params: NotificationFilter = {}
): Promise<NotificationListResponse>

// 알림 요약 조회
export async function fetchNotificationSummary(): Promise<NotificationSummary>

// 단일 알림 읽음 처리
export async function markNotificationAsRead(notificationId: string): Promise<void>

// 일괄 읽음 처리
export async function markAllNotificationsAsRead(
  category?: NotificationCategory
): Promise<MarkAllReadResponse>

// 알림 삭제
export async function deleteNotification(notificationId: string): Promise<void>

// 최근 알림 조회 (헤더 드롭다운용)
export async function fetchRecentNotifications(limit: number = 5): Promise<NotificationItem[]>

// 테스트 알림 생성
export async function createTestNotification(
  type: 'schedule' | 'payment' | 'attendance' | 'lesson'
): Promise<NotificationItem>
```

### 3.3 UI 컴포넌트

**주요 파일**:
- `frontend/src/app/(main)/notifications/page.tsx`: 알림 센터 메인 페이지
- `frontend/src/components/notifications/NotificationList.tsx`: 알림 리스트 컴포넌트
- `frontend/src/components/notifications/NotificationStatusBadge.tsx`: 읽음 상태 배지

**기능**:
- 카테고리 탭 (전체, 수업, 정산, 출결, 기타)
- 상태 필터 (전체, 읽지 않음, 읽음)
- 알림 카드 (아이콘, 제목, 메시지, 시간)
- 페이지네이션
- 읽음 처리 및 삭제 버튼
- 모두 읽음 처리

---

## 4. 사용 예시

### 4.1 백엔드에서 알림 생성 (다른 서비스에서)

```python
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType, NotificationPriority

# 예: F-003에서 수업 일정 생성 후 학생에게 알림
NotificationService.create_notification(
    db=db,
    user_id=student_id,
    notification_type=NotificationType.SCHEDULE_REMINDER,
    title="🔔 1시간 후 수업",
    message=f"{subject} - 선생님 이름 ({time})",
    priority=NotificationPriority.HIGH,
    related_resource_type="schedule",
    related_resource_id=schedule_id,
)

# 예: F-004에서 출석 체크 후 학생과 학부모에게 알림
NotificationService.create_notifications_for_group(
    db=db,
    user_ids=[student_id, parent_id],
    notification_type=NotificationType.ATTENDANCE_CHANGED,
    title="✅ 출석 상태 변경",
    message=f"11/18 수업이 결석 처리되었습니다.",
    priority=NotificationPriority.NORMAL,
    related_resource_type="attendance",
    related_resource_id=attendance_id,
)
```

### 4.2 프론트엔드에서 알림 조회

```typescript
import { fetchNotifications, fetchNotificationSummary } from '@/lib/api/notifications';

// 알림 목록 조회
const response = await fetchNotifications({
  category: 'schedule',
  status: 'unread',
  page: 1,
  size: 20,
});

console.log(response.items); // 알림 목록
console.log(response.pagination); // 페이지네이션 정보
console.log(response.unread_count); // 읽지 않은 개수

// 헤더 뱃지 업데이트용 요약 정보
const summary = await fetchNotificationSummary();
console.log(summary.total_unread); // "12"
console.log(summary.by_category.schedule); // "5"
```

---

## 5. MVP vs Phase 2 구분

### MVP (현재 완료된 항목)
✅ 알림 CRUD (Create, Read, Update, Delete)
✅ 알림 필터링 및 페이지네이션
✅ 읽음/안 읽음 상태 관리
✅ 앱 내 알림 센터 UI
✅ 테스트 알림 생성 API
✅ 일반 목적 알림 생성 함수

### Phase 2 (향후 구현)
❌ FCM 푸시 알림
❌ 이메일/SMS 알림
❌ 알림 설정 (사용자별 on/off)
❌ 야간 알림 제한
❌ 알림 배치 처리 및 스케줄링
❌ 자동 삭제 정책
❌ 알림 검색 및 고급 필터링

---

## 6. 통합 가이드 (F-003~F-006과의 연동)

### F-003: 수업 일정 관리
```python
# schedules.py router에서 일정 생성 후
NotificationService.create_notifications_for_group(
    db=db,
    user_ids=get_group_members(group_id),
    notification_type=NotificationType.SCHEDULE_REMINDER,
    title="📅 새 일정이 등록되었습니다.",
    message=f"{subject} - {date} {time}",
    related_resource_type="schedule",
    related_resource_id=schedule_id,
)
```

### F-004: 출결 관리
```python
# attendances.py router에서 출석 체크 후
NotificationService.create_notifications_for_group(
    db=db,
    user_ids=[student_id, parent_id],
    notification_type=NotificationType.ATTENDANCE_CHANGED,
    title="✅ 출석 상태 변경",
    message=f"{date} 수업이 {attendance_status}으로 처리되었습니다.",
    related_resource_type="attendance",
    related_resource_id=attendance_id,
)
```

### F-005: 수업 기록 및 진도 관리
```python
# lessons.py router에서 수업 기록 저장 후
NotificationService.create_notifications_for_group(
    db=db,
    user_ids=[parent_id],  # 학부모에게만
    notification_type=NotificationType.LESSON_RECORD_CREATED,
    title="📝 수업 기록이 작성되었습니다.",
    message=f"{date} 수업: {progress}",
    related_resource_type="lesson",
    related_resource_id=lesson_record_id,
)
```

### F-006: 수업료 정산
```python
# settlements.py router에서 청구서 발행 후
NotificationService.create_notification(
    db=db,
    user_id=parent_id,
    notification_type=NotificationType.BILLING_ISSUED,
    title="💳 11월 수업료 청구",
    message=f"총 {amount}원이 청구되었습니다.",
    priority=NotificationPriority.CRITICAL,
    is_required=True,  # 필수 알림 (끌 수 없음)
    related_resource_type="payment",
    related_resource_id=payment_id,
)
```

---

## 7. 테스트 방법

### 7.1 백엔드 테스트
```bash
# 서버 실행
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Swagger UI에서 테스트
# http://localhost:8000/docs
# 1. POST /auth/login으로 로그인 후 토큰 획득
# 2. "Authorize" 버튼에 토큰 입력
# 3. POST /notifications/test로 테스트 알림 생성
# 4. GET /notifications으로 알림 목록 조회
# 5. GET /notifications/summary로 알림 요약 확인
```

### 7.2 프론트엔드 테스트
```bash
# 서버 실행
cd frontend
npm run dev

# 브라우저에서
# 1. http://localhost:3000 접속
# 2. 로그인
# 3. 알림 아이콘 클릭 (헤더 우측)
# 4. "알림 센터 열기" → /notifications 페이지 이동
# 5. 카테고리 탭, 필터 전환, 페이지네이션 확인
```

---

## 8. 기술 스택 요약

| 계층 | 기술 |
|------|------|
| 언어 | Python 3.11, TypeScript |
| 백엔드 | FastAPI, SQLAlchemy |
| 데이터베이스 | SQLite (개발), PostgreSQL (운영 기준) |
| 프론트엔드 | Next.js, React, Tailwind CSS |
| API 통신 | RESTful API, JSON |
| 인증 | JWT |

---

## 9. 주요 파일 목록

### 백엔드
- `backend/app/models/notification.py`: 알림 데이터 모델
- `backend/app/schemas/notification.py`: Pydantic 스키마
- `backend/app/services/notification_service.py`: 비즈니스 로직
- `backend/app/routers/notifications.py`: REST API 엔드포인트

### 프론트엔드
- `frontend/src/types/notifications.ts`: TypeScript 타입 정의
- `frontend/src/lib/api/notifications.ts`: API 클라이언트
- `frontend/src/app/(main)/notifications/page.tsx`: 알림 센터 페이지
- `frontend/src/components/notifications/`: UI 컴포넌트

### 데이터베이스
- SQLite 테이블: `notifications`
- 인덱스: user_id, category, is_read, created_at, delivery_status

---

## 10. 다음 단계 (우선순위)

1. **Event-based notification triggers 연동** (F-003~F-006)
   - 각 기능에서 특정 이벤트 발생 시 자동으로 알림 생성
   - 예: 일정 생성 → 학생에게 SCHEDULE_REMINDER 알림

2. **FCM 푸시 알림 구현** (Phase 2)
   - firebase-admin SDK 통합
   - 사용자별 FCM 토큰 저장
   - 앱 설치 시 토큰 등록

3. **알림 설정 (F-007과 연계)** (Phase 2)
   - 사용자별 알림 카테고리 on/off
   - 야간 알림 제한 (예: 오후 10시 ~ 오전 7시)
   - 정산 알림은 필수 (끌 수 없음)

4. **알림 자동 삭제 정책** (Phase 2)
   - 읽은 알림: 30일 후 자동 삭제
   - 읽지 않은 알림: 90일 후 자동 삭제

5. **이메일/SMS 알림** (Phase 2)
   - SMTP 또는 이메일 서비스 연동
   - Twilio, 알리고 등 SMS 서비스 연동

---

## 11. 알려진 이슈 및 제약사항

### 기술적 제약
- **SQLite의 JSON 타입**: TEXT로 저장되지만 자동 직렬화/역직렬화 처리됨
- **FCM 의존성**: Phase 2에서 구현 예정, 현재는 501 Not Implemented
- **자동 푸시**: 별도의 백그라운드 작업 프레임워크 필요 (현재 미보유)

### 의도적 선택
- **IN_APP만 MVP에서**: 푸시 알림은 2단계에서 구현 (외부 서비스 의존도 감소)
- **간단한 필터링**: 복잡한 고급 필터링은 사용자 피드백 후 2단계에서 검토
- **90일 보관**: 앱 용량 관리, 오래된 알림의 참고 가치 낮음

---

## 12. 성공 기준

| 지표 | 목표값 | 측정 방법 |
|------|--------|----------|
| 알림 열람률 | 70% 이상 | (읽은 알림 / 발송 알림) × 100 |
| 알림 클릭률 | 50% 이상 | (클릭한 알림 / 발송 알림) × 100 |
| 출석률 개선 | 10%p 이상 | 알림 도입 전후 비교 |
| 정산 완료 속도 | 24시간 이내 | 청구서 발송 ~ 결제 완료 시간 |
| API 응답 시간 | 200ms 이내 | Swagger UI 테스트 |

---

## 결론

F-008 필수 알림 시스템의 **MVP 코어 기능**이 완전히 구현되고 테스트 가능한 상태입니다:

✅ **백엔드**: 완전한 CRUD API, 필터링, 페이지네이션
✅ **프론트엔드**: 알림 센터 UI, API 클라이언트
✅ **통합**: 다른 서비스에서 호출 가능한 공용 알림 생성 함수
✅ **문서화**: 상세한 API 명세, 사용 예시

이제 **F-003~F-006**과의 연동을 통해 실제 이벤트 기반 알림을 활성화할 수 있습니다.
