# F-002 과외 그룹 생성 및 매칭 API 테스트 가이드

## 개요

F-002 과외 그룹 생성 및 매칭 기능의 백엔드 API 테스트 가이드입니다.

## 구현 완료 항목

### 1. 데이터베이스 모델
- ✅ `backend/app/models/group.py`
  - `Group` 모델: 과외 그룹 정보
  - `GroupMember` 모델: 그룹 멤버 정보
  - Enum: `GroupStatus`, `GroupMemberRole`, `GroupMemberInviteStatus`

### 2. Pydantic 스키마
- ✅ `backend/app/schemas/group.py`
  - `GroupCreate`: 그룹 생성 요청
  - `GroupUpdate`: 그룹 수정 요청
  - `GroupOut`: 그룹 응답
  - `GroupMemberOut`: 그룹 멤버 응답
  - `GroupListResponse`: 그룹 목록 응답 (페이지네이션)

### 3. 서비스 레이어
- ✅ `backend/app/services/group_service.py`
  - `get_groups_for_user()`: 사용자가 속한 그룹 목록 조회
  - `create_group()`: 그룹 생성 (owner를 자동으로 TEACHER 멤버로 추가)
  - `get_group_detail()`: 그룹 상세 조회 (멤버 목록 포함)
  - `update_group()`: 그룹 수정 (owner만 가능)
  - `delete_group()`: 그룹 삭제 (owner만 가능)

### 4. FastAPI 라우터
- ✅ `backend/app/routers/groups.py`
  - `GET /api/v1/groups`: 그룹 목록 조회
  - `POST /api/v1/groups`: 그룹 생성
  - `GET /api/v1/groups/{group_id}`: 그룹 상세 조회
  - `PATCH /api/v1/groups/{group_id}`: 그룹 수정
  - `DELETE /api/v1/groups/{group_id}`: 그룹 삭제

## 백엔드 실행

```bash
cd /home/user/weteeMVP/backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API 엔드포인트 테스트

### 1. Health Check

```bash
curl -X GET http://localhost:8000/api/v1/health
```

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "status": "ok"
  },
  "meta": {
    "timestamp": "2025-11-18T00:00:00.000000Z",
    "request_id": "..."
  }
}
```

### 2. 회원가입 (선생님)

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "name": "김선생",
    "phone": "010-1234-5678",
    "role": "TEACHER"
  }'
```

### 3. 로그인

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'
```

**응답에서 `access_token`을 복사하여 이후 요청에 사용합니다.**

### 4. 그룹 생성

```bash
curl -X POST http://localhost:8000/api/v1/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "name": "중3 수학 반A",
    "subject": "수학",
    "description": "중학교 3학년 수학 과외 그룹입니다."
  }'
```

**예상 응답**:
```json
{
  "group_id": "de30fa49-75a6-4d02-a5cc-a5da2a792457",
  "name": "중3 수학 반A",
  "subject": "수학",
  "description": "중학교 3학년 수학 과외 그룹입니다.",
  "owner_id": "957ee4e2-aebc-4e10-8869-78d3cc3038c6",
  "status": "ACTIVE",
  "created_at": "2025-11-18T00:05:13.470351Z",
  "updated_at": "2025-11-18T00:05:13.470354Z",
  "members": null,
  "member_count": null
}
```

**주요 기능**:
- 그룹 생성자(owner)가 자동으로 `TEACHER` 역할의 멤버로 추가됩니다.

### 5. 그룹 목록 조회

```bash
curl -X GET "http://localhost:8000/api/v1/groups?page=1&size=20" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**Query Parameters**:
- `page`: 페이지 번호 (기본: 1)
- `size`: 페이지 크기 (기본: 20, 최대: 100)
- `role`: 역할 필터 (TEACHER/STUDENT/PARENT) - optional
- `status`: 상태 필터 (ACTIVE/INACTIVE/ARCHIVED) - optional

**예상 응답**:
```json
{
  "items": [
    {
      "group_id": "de30fa49-75a6-4d02-a5cc-a5da2a792457",
      "name": "중3 수학 반A",
      "subject": "수학",
      "description": "중학교 3학년 수학 과외 그룹입니다.",
      "owner_id": "957ee4e2-aebc-4e10-8869-78d3cc3038c6",
      "status": "ACTIVE",
      "created_at": "2025-11-18T00:05:13.470351Z",
      "updated_at": "2025-11-18T00:05:13.470354Z",
      "members": null,
      "member_count": 1
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "size": 20,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

### 6. 그룹 상세 조회

```bash
curl -X GET "http://localhost:8000/api/v1/groups/{GROUP_ID}" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**예상 응답**:
```json
{
  "group_id": "de30fa49-75a6-4d02-a5cc-a5da2a792457",
  "name": "중3 수학 반A",
  "subject": "수학",
  "description": "중학교 3학년 수학 과외 그룹입니다.",
  "owner_id": "957ee4e2-aebc-4e10-8869-78d3cc3038c6",
  "status": "ACTIVE",
  "created_at": "2025-11-18T00:05:13.470351Z",
  "updated_at": "2025-11-18T00:05:13.470354Z",
  "members": [
    {
      "member_id": "7e40098d-8fb8-4378-abf1-bf959d58f8aa",
      "user_id": "957ee4e2-aebc-4e10-8869-78d3cc3038c6",
      "role": "TEACHER",
      "invite_status": "ACCEPTED",
      "joined_at": "2025-11-18T00:05:13.472607Z"
    }
  ],
  "member_count": null
}
```

**주요 기능**:
- 그룹 멤버 목록이 포함됩니다.
- 사용자가 해당 그룹의 멤버인 경우에만 조회 가능합니다.

### 7. 그룹 수정

```bash
curl -X PATCH "http://localhost:8000/api/v1/groups/{GROUP_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "name": "중3 수학 심화반",
    "description": "중학교 3학년 수학 심화 과정"
  }'
```

**Request Body** (모두 선택):
- `name`: 그룹 이름
- `subject`: 과목
- `description`: 그룹 설명
- `status`: 그룹 상태 (ACTIVE/INACTIVE/ARCHIVED)

**권한**: 그룹 소유자(owner)만 수정 가능

### 8. 그룹 삭제

```bash
curl -X DELETE "http://localhost:8000/api/v1/groups/{GROUP_ID}" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**예상 응답**: HTTP 204 No Content

**권한**: 그룹 소유자(owner)만 삭제 가능

**주의**: 그룹 멤버도 함께 삭제됩니다 (cascade).

## 자동 테스트 스크립트

전체 API 엔드포인트를 자동으로 테스트하는 스크립트:

```bash
bash /tmp/test_groups_simple.sh
```

## Swagger UI

FastAPI의 자동 생성 문서를 통해 API를 테스트할 수 있습니다:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 데이터베이스 확인

SQLite 데이터베이스에서 그룹 정보 확인:

```bash
cd /home/user/weteeMVP/backend
sqlite3 wetee.db
```

```sql
-- 그룹 목록
SELECT * FROM groups;

-- 그룹 멤버 목록
SELECT * FROM group_members;

-- 그룹과 멤버 조인
SELECT
  g.name AS group_name,
  g.subject,
  gm.role,
  gm.invite_status,
  gm.joined_at
FROM groups g
JOIN group_members gm ON g.id = gm.group_id;
```

## TODO: Phase 2 기능 (향후 구현)

다음 기능들은 MVP 1단계에서 제외되었으며, Phase 2에서 구현 예정입니다:

- 초대 코드 생성 및 관리
- 초대 코드로 그룹 가입
- 그룹 멤버 추가/제거
- 멤버 역할 변경
- 그룹 멤버 상세 정보 (user name, profile_image 등)

## 테스트 결과

모든 엔드포인트가 정상적으로 작동하는 것을 확인했습니다:

- ✅ 그룹 생성 (owner가 자동으로 TEACHER 멤버로 추가됨)
- ✅ 그룹 목록 조회 (페이지네이션, member_count 포함)
- ✅ 그룹 상세 조회 (멤버 목록 포함)
- ✅ 그룹 수정 (owner만 가능)
- ✅ 그룹 삭제 (owner만 가능, HTTP 204)

## 관련 문서

- F-002 기능 명세서: `docs/기능명세서/F-002_과외_그룹_생성_및_매칭.md`
- API 명세서: `docs/API_명세서.md` (6.2 섹션)
- 데이터베이스 설계서: `docs/데이터베이스_설계서.md` (groups, group_members 테이블)
