# Auth 계층 구현 - 사용 가이드

## 📌 구현 완료 내용

### 1. 디렉터리 구조

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점
│   ├── config.py            # 환경 변수 설정
│   ├── database.py          # SQLAlchemy 세션 관리
│   ├── dependencies.py      # get_db, get_current_user
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   └── security.py      # JWT, 비밀번호 해싱
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # User SQLAlchemy 모델
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── auth.py          # Pydantic 요청/응답 스키마
│   │
│   └── routers/
│       ├── __init__.py
│       └── auth.py          # Auth API 엔드포인트
│
├── .env.example             # 환경 변수 예시
├── requirements.txt         # Python 패키지
└── README_AUTH.md           # 이 파일
```

### 2. 구현된 엔드포인트

#### ✅ POST /api/v1/auth/register (회원가입)
- 선생님(TEACHER) 일반 회원가입
- 이메일 중복 검사
- 비밀번호 해싱 (bcrypt)
- 응답: 사용자 정보 (201 Created)

#### ✅ POST /api/v1/auth/login (로그인)
- 이메일/비밀번호 검증
- Access Token (15분) + Refresh Token (7일) 발급
- 응답: 토큰 + 사용자 정보 (200 OK)

#### ✅ GET /api/v1/auth/account (현재 사용자 조회)
- Authorization: Bearer <access_token> 필수
- 응답: 현재 사용자 정보 (200 OK)

#### 🚧 TODO (스켈레톤만 구현)
- POST /api/v1/auth/verify-email (이메일 인증)
- POST /api/v1/auth/refresh (토큰 갱신)
- POST /api/v1/auth/logout (로그아웃)
- POST /api/v1/auth/password-reset/request (비밀번호 재설정 요청)
- POST /api/v1/auth/password-reset/confirm (비밀번호 재설정 확인)

### 3. 주요 기능

#### JWT 인증
- Access Token: 15분 (API 요청용)
- Refresh Token: 7일 (토큰 갱신용)
- Algorithm: HS256

#### 비밀번호 보안
- bcrypt 해싱 (rounds=12)
- 검증 규칙:
  - 8자 이상
  - 영문 포함
  - 숫자 포함

#### 에러 코드 (API_명세서.md 5.2 기반)
- AUTH001: 인증 토큰 없음
- AUTH002: 인증 토큰 만료
- AUTH003: 인증 토큰 유효하지 않음
- AUTH004: 로그인 실패 (이메일/비밀번호 불일치)
- AUTH005: 비활성화된 계정

---

## 🚀 실행 방법

### 1. 환경 설정

```bash
cd /home/user/weteeMVP/backend

# 가상환경 활성화 (이미 있는 경우)
source .venv/bin/activate

# 패키지 설치
pip install -r requirements.txt
```

### 2. 환경 변수 설정

```bash
# .env 파일 생성 (선택사항, 기본값으로도 동작)
cp .env.example .env

# .env 파일 편집 (필요시)
# DATABASE_URL, JWT_SECRET_KEY 등 설정
```

### 3. 서버 실행

```bash
# 방법 1: 직접 실행
python -m app.main

# 방법 2: uvicorn 직접 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버가 시작되면 다음 URL에서 확인 가능:
- API Docs (Swagger): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/api/v1/health

---

## 🧪 테스트 방법

### 1. Health Check

```bash
curl -X GET http://localhost:8000/api/v1/health
```

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "status": "ok"
  },
  "meta": {
    "timestamp": "2025-11-16T10:00:00Z",
    "request_id": "..."
  }
}
```

### 2. 회원가입 (선생님)

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@example.com",
    "password": "SecurePass123",
    "name": "김선생",
    "phone": "01012345678",
    "role": "TEACHER"
  }'
```

**예상 응답 (201 Created):**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "teacher1@example.com",
    "name": "김선생",
    "role": "teacher",
    "is_email_verified": false,
    "created_at": "2025-11-16T10:00:00Z"
  }
}
```

### 3. 로그인

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@example.com",
    "password": "SecurePass123"
  }'
```

**예상 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "teacher1@example.com",
      "name": "김선생",
      "role": "teacher",
      "is_email_verified": false
    }
  }
}
```

**중요:** 응답에서 `access_token` 값을 복사해서 다음 요청에 사용하세요.

### 4. 현재 사용자 조회 (인증 필요)

```bash
# 위에서 받은 access_token을 <YOUR_ACCESS_TOKEN>에 붙여넣기
curl -X GET http://localhost:8000/api/v1/auth/account \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

**예상 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "teacher1@example.com",
    "name": "김선생",
    "role": "teacher",
    "is_email_verified": false,
    "created_at": "2025-11-16T10:00:00Z"
  }
}
```

### 5. 에러 케이스 테스트

#### 이메일 중복
```bash
# 같은 이메일로 다시 가입 시도
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@example.com",
    "password": "SecurePass123",
    "name": "김선생2",
    "role": "TEACHER"
  }'
```

**예상 응답 (409 Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH001",
    "message": "이미 가입된 이메일입니다."
  }
}
```

#### 로그인 실패 (잘못된 비밀번호)
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@example.com",
    "password": "WrongPassword123"
  }'
```

**예상 응답 (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH004",
    "message": "이메일 또는 비밀번호가 일치하지 않습니다."
  }
}
```

#### 토큰 없이 인증 필요 엔드포인트 접근
```bash
curl -X GET http://localhost:8000/api/v1/auth/account
```

**예상 응답 (401 Unauthorized):**
```json
{
  "detail": {
    "code": "AUTH001",
    "message": "인증이 필요합니다."
  }
}
```

---

## 📝 다음 단계 (TODO)

### 1. 이메일 인증 구현 (F-001 6.1.2)
- [ ] 이메일 발송 서비스 연동 (SendGrid, AWS SES 등)
- [ ] 6자리 인증 코드 생성 및 저장 (Redis 권장)
- [ ] POST /api/v1/auth/verify-email 구현

### 2. 토큰 갱신 구현 (F-001)
- [ ] POST /api/v1/auth/refresh 구현
- [ ] Refresh Token 검증 로직

### 3. 로그아웃 구현 (F-001)
- [ ] POST /api/v1/auth/logout 구현
- [ ] Refresh Token 무효화 (Redis 블랙리스트 또는 DB)

### 4. 비밀번호 재설정 (F-001 시나리오 5)
- [ ] POST /api/v1/auth/password-reset/request 구현
- [ ] POST /api/v1/auth/password-reset/confirm 구현
- [ ] 재설정 토큰 생성 및 이메일 발송

### 5. 학생/학부모 초대 코드 가입 (F-002 연계)
- [ ] 초대 코드 생성/검증 로직
- [ ] POST /api/v1/auth/register에서 초대 코드 처리

### 6. 보안 강화
- [ ] Rate Limiting 구현 (로그인 5회/분 제한)
- [ ] 5회 연속 로그인 실패 시 계정 잠금
- [ ] 로그인 기록 저장 (login_history 테이블)

### 7. 테스트 코드 작성
- [ ] pytest 환경 설정
- [ ] 회원가입/로그인/인증 테스트

---

## 🐛 알려진 이슈

### SQLite vs PostgreSQL
- 현재는 SQLite 기본 설정 (개발 편의성)
- UUID 타입을 String(36)으로 처리 (SQLite 호환)
- 운영 환경에서는 PostgreSQL + UUID 타입 사용 권장

### 이메일 인증 미구현
- 현재는 is_email_verified=False로 저장만 됨
- 로그인 시 이메일 인증 체크 비활성화 (TODO 주석 처리)

---

## 📚 참고 문서

- F-001_회원가입_및_로그인.md
- 데이터베이스_설계서.md (users 테이블)
- API_명세서.md (6.1 Auth 엔드포인트)
- 기술스택_설계서.md (3.1 FastAPI, 3.2 JWT)

---

## 🔧 Troubleshooting

### 1. DB 스키마 에러 (sqlite3.OperationalError: no such column)

**문제:** 로그인/회원가입 시 "no such column: users.password_hash" 에러 발생

**원인:** 기존 DB 파일이 이전 스키마로 생성되었거나 손상됨

**해결책:**
```bash
cd /home/user/weteeMVP/backend

# 1. 기존 DB 백업 (선택사항)
cp wetee.db wetee.db.backup_$(date +%Y%m%d_%H%M%S)

# 2. 기존 DB 삭제
rm wetee.db

# 3. 서버 재시작 (새 DB 자동 생성)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Windows PowerShell:**
```powershell
# backend 디렉터리로 이동
cd C:\Users\ksaei\Projects\weteeMVP\backend

# 가상환경 활성화
.\.venv\Scripts\activate

# 기존 DB 삭제
del .\wetee.db

# 서버 재시작
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. bcrypt 관련 에러 (ValueError: password cannot be longer than 72 bytes)

**문제:** 회원가입/로그인 시 bcrypt 72바이트 제한 에러 발생

**원인:** bcrypt 5.x 버전과 passlib 호환성 문제

**해결책:**
```bash
# bcrypt 다운그레이드
pip uninstall -y bcrypt
pip install 'bcrypt>=4.0.0,<5.0.0'

# 서버 재시작
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 서버 실행 표준 명령어

**공식 표준 실행 방법:**

```bash
cd /home/user/weteeMVP/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Windows PowerShell 표준 실행 방법:**

```powershell
# backend 디렉터리로 이동
PS C:\Users\ksaei\Projects\weteeMVP> cd backend

# 가상환경 활성화
PS C:\Users\ksaei\Projects\weteeMVP\backend> .\.venv\Scripts\activate

# 서버 실행
PS C:\Users\ksaei\Projects\weteeMVP\backend> python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**주의사항:**
- ❌ `backend/main.py`는 삭제되었습니다. 사용하지 마세요.
- ✅ `backend/app/main.py`가 공식 엔트리포인트입니다.
- 항상 `python -m uvicorn app.main:app` 형식으로 실행하세요.

### 4. DB 스키마 확인 방법

```bash
cd /home/user/weteeMVP/backend

# SQLite DB 스키마 확인
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('wetee.db')
cur = conn.cursor()
print("=== Users Table Schema ===\n")
print(f"{'Column Name':<25} {'Type':<20} {'Not Null':<10}")
print("-" * 60)
for row in cur.execute('PRAGMA table_info(users)'):
    cid, name, dtype, notnull, default_val, pk = row
    notnull_str = "NOT NULL" if notnull else ""
    print(f"{name:<25} {dtype:<20} {notnull_str:<10}")
conn.close()
EOF
```

---

## 📧 문의

구현 관련 질문이나 이슈가 있으면 Claude Code에 문의하세요.
