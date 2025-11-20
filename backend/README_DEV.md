# WeTee Backend - 개발자 가이드

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 가상환경 생성 (권장)
python -m venv venv

# Windows PowerShell에서 활성화
.\venv\Scripts\Activate.ps1

# Linux/Mac에서 활성화
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

### 2. 데이터베이스 초기화

**처음 시작할 때 또는 스키마가 변경되었을 때:**

```bash
# 기존 DB 삭제 및 새로 생성 (테스트 데이터 포함)
python scripts/reset_dev_db.py --seed

# 또는 빈 DB만 생성 (테스트 데이터 없이)
python scripts/reset_dev_db.py
```

### 3. 서버 실행

```bash
# 개발 모드 (자동 리로드)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버가 실행되면:
- API 문서: http://localhost:8000/docs
- Alternative 문서: http://localhost:8000/redoc
- Health Check: http://localhost:8000/api/v1/health

---

## 📦 테스트 계정 (--seed 옵션 사용 시)

DB 리셋 시 `--seed` 옵션을 사용하면 다음 테스트 계정이 자동 생성됩니다:

| 이메일 | 비밀번호 | 역할 |
|--------|---------|------|
| teacher@test.com | password123 | 선생님 |
| student@test.com | password123 | 학생 |
| parent@test.com | password123 | 학부모 |

---

## 🗃️ 데이터베이스 관리

### DB 스키마 변경 시 작업 절차

MVP 개발 단계에서는 간단한 "DB 재생성" 방식을 사용합니다.

#### ✅ 권장 절차

1. **모델 파일 수정** (`app/models/user.py` 등)
   ```python
   # 예: 새 컬럼 추가
   class User(Base):
       ...
       new_field = Column(String(100), nullable=True)
   ```

2. **백엔드 서버 중지** (Ctrl+C)

3. **DB 리셋 스크립트 실행**
   ```bash
   python scripts/reset_dev_db.py --seed
   ```

4. **서버 재시작**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **로그 확인**
   서버 시작 시 다음과 같은 로그가 표시되어야 합니다:
   ```
   📁 Database file: /path/to/wetee.db
   ✅ Existing database found
   📊 Tables in database: users
   ```

#### ⚠️ 주의사항

- **개발 단계에만 사용**: 운영 환경에서는 절대 DB를 삭제하지 마세요!
- **백업 자동 생성**: `reset_dev_db.py`는 삭제 전 자동으로 백업 파일을 생성합니다
  - 백업 위치: `wetee.db.backup_YYYYMMDD_HHMMSS`
- **Git에서 제외**: `.gitignore`에 `*.db` 파일이 포함되어 있는지 확인하세요

---

## 🐛 문제 해결

### 1. "no such column: users.password_hash" 에러

**원인**: DB 파일이 예전 스키마로 생성되어 있음

**해결 방법**:
```bash
# DB 리셋
python scripts/reset_dev_db.py --seed
```

### 2. "ModuleNotFoundError" 에러

**원인**: 필요한 패키지가 설치되지 않음

**해결 방법**:
```bash
pip install -r requirements.txt

# 또는 수동으로
pip install fastapi sqlalchemy uvicorn pydantic-settings passlib python-jose bcrypt
```

### 3. bcrypt/passlib 호환성 에러

**증상**: `'_bcrypt' object has no attribute '__about__'` 또는 유사한 bcrypt 관련 에러

**원인**: bcrypt 5.x는 passlib 1.7.4와 호환되지 않습니다.

**해결 방법**:
```bash
# bcrypt를 4.0.1로 다운그레이드
pip install bcrypt==4.0.1

# 버전 확인
pip show bcrypt
```

**중요**: `requirements.txt`에는 이미 `bcrypt==4.0.1`이 명시되어 있습니다. 새로운 환경에서 설치할 때는 반드시 requirements.txt를 사용하세요.

### 4. "서버에 연결할 수 없습니다" (프론트엔드)

**원인**: 백엔드 서버가 실행 중이 아님

**해결 방법**:
```bash
# 백엔드 서버 실행 확인
curl http://localhost:8000/api/v1/health

# 응답이 없다면 서버 시작
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. CORS 에러

**원인**: 프론트엔드 URL이 CORS 허용 목록에 없음

**해결 방법**: `app/config.py`에서 `CORS_ORIGINS` 확인
```python
CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
```

---

## 🔐 보안 설정

### 필수: JWT Secret Key 설정

**중요**: JWT Secret Key는 **필수 환경변수**입니다. `.env` 파일이 없으면 서버가 시작되지 않습니다.

#### 1. .env 파일 생성

처음 시작할 때 `.env` 파일을 생성하세요:

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env
```

#### 2. 안전한 JWT Secret Key 생성

다음 명령으로 안전한 랜덤 키를 생성하세요:

```bash
# 두 개의 키 생성 (JWT_SECRET_KEY, JWT_REFRESH_SECRET_KEY)
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
python -c "import secrets; print('JWT_REFRESH_SECRET_KEY=' + secrets.token_hex(32))"
```

생성된 키를 `.env` 파일에 복사하세요:

```bash
# .env 파일 예시
JWT_SECRET_KEY=a1b2c3d4e5f6...  # 실제로 생성한 64자 키
JWT_REFRESH_SECRET_KEY=f6e5d4c3b2a1...  # 실제로 생성한 64자 키
```

#### 3. 보안 검증

서버 시작 시 다음과 같은 검증이 자동으로 수행됩니다:

- ✅ **개발 환경 (DEBUG=True)**:
  - JWT Secret Key 필수 (환경변수 또는 .env 파일에서 로드)
  - 최소 길이 제한 없음 (개발 편의)

- ✅ **운영 환경 (DEBUG=False)**:
  - JWT Secret Key 필수
  - 최소 32자 이상 필수
  - 개발용 기본값 사용 불가 (서버 시작 실패)

### 비밀번호 강도 정책

회원가입 시 다음 비밀번호 규칙이 적용됩니다:

- ✅ 최소 8자 이상
- ✅ 대문자 1개 이상 (A-Z)
- ✅ 소문자 1개 이상 (a-z)
- ✅ 숫자 1개 이상 (0-9)
- ✅ 특수문자 1개 이상 (!@#$%^&*(),.?":{}|<> 등)

**예시**: `SecurePass123!`, `MyP@ssw0rd`, `Test1234!`

### CORS 설정

CORS 설정은 보안을 위해 다음과 같이 제한됩니다:

**허용된 메서드**:
- GET, POST, PUT, PATCH, DELETE, OPTIONS

**허용된 헤더**:
- Authorization, Content-Type, Accept, Origin, X-Requested-With

**허용된 Origin**:
- 개발: `http://localhost:3000`, `http://127.0.0.1:3000`
- 운영: `.env` 파일의 `CORS_ORIGINS`에서 설정

### Rate Limiting

API 요청 제한이 적용됩니다:

- **인증된 사용자**: user_id 기반 제한
- **미인증 사용자**: IP 주소 기반 제한
- **제한 정책**: API 라우터별로 개별 설정 (예: 로그인 5회/분)

### ⚠️ Git 보안 - 민감한 파일 관리

**중요**: `.env` 파일과 `*.db` 파일은 절대 Git에 커밋하지 마세요!

#### .gitignore 확인

다음 항목이 `.gitignore`에 포함되어 있는지 확인하세요:

```gitignore
# Backend environment files
.env
.env.*
!.env.example

# Database files (SQLite - dev only)
*.db
*.db-journal
*.db-wal
*.db-shm
*.sqlite
*.sqlite3
```

#### 이미 .env 파일이 Git에 커밋된 경우

만약 실수로 `.env` 파일을 커밋했다면, 다음 절차로 제거하세요:

```bash
# 1. Git 캐시에서 .env 파일 제거 (로컬 파일은 유지)
git rm --cached backend/.env

# 2. 변경사항 커밋
git commit -m "Remove .env file from Git tracking"

# 3. 원격 저장소에 푸시
git push

# 4. ⚠️ 중요: JWT 키 재생성
# 기존 키가 이미 Git 히스토리에 노출되었으므로, 새로운 키를 생성해야 합니다
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
python -c "import secrets; print('JWT_REFRESH_SECRET_KEY=' + secrets.token_hex(32))"

# 5. .env 파일의 키를 새로 생성한 키로 교체
```

**주의**: Git 히스토리에서 완전히 삭제하려면 `git filter-branch` 또는 `BFG Repo-Cleaner`를 사용해야 하지만, 이는 고급 작업이며 협업 시 주의가 필요합니다.

#### 🚨 프로덕션 환경 보안 체크리스트

운영 환경에 배포하기 전 반드시 확인하세요:

- [ ] `.env` 파일이 Git에 포함되지 않았는지 확인 (`git ls-files | grep .env`)
- [ ] 새로운 JWT 키를 생성했는지 확인 (개발용 키 사용 금지)
- [ ] `DEBUG=False`로 설정했는지 확인
- [ ] JWT 키가 최소 32자 이상인지 확인
- [ ] CORS_ORIGINS에 실제 프론트엔드 도메인만 포함되어 있는지 확인
- [ ] 데이터베이스를 PostgreSQL로 전환했는지 확인 (SQLite는 개발용)
- [ ] HTTPS가 설정되어 있는지 확인

---

## 📁 프로젝트 구조

```
backend/
├── app/
│   ├── main.py              # FastAPI 앱 진입점
│   ├── config.py            # 설정 관리
│   ├── database.py          # DB 연결 설정
│   ├── dependencies.py      # 공통 의존성
│   ├── models/              # SQLAlchemy 모델
│   │   └── user.py
│   ├── routers/             # API 라우터
│   │   └── auth.py
│   ├── schemas/             # Pydantic 스키마
│   │   └── auth.py
│   └── core/                # 핵심 유틸리티
│       └── security.py      # 비밀번호 해싱, JWT
├── scripts/                 # 개발용 스크립트
│   └── reset_dev_db.py     # DB 리셋 스크립트
├── wetee.db                 # SQLite DB 파일 (gitignore)
└── README_DEV.md            # 이 파일
```

---

## 🚢 운영 환경 배포 (향후)

현재는 MVP 개발 단계이므로 **SQLite + 수동 DB 재생성** 방식을 사용합니다.

운영 환경 배포 전에 다음 사항을 준비해야 합니다:

1. **PostgreSQL 마이그레이션**
   - SQLite → PostgreSQL로 전환
   - `config.py`의 `DATABASE_URL` 변경

2. **Alembic 도입**
   ```bash
   pip install alembic
   alembic init alembic
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   ```

3. **환경 변수 분리**
   - `.env.production` 파일 생성
   - `DEBUG=False` 설정
   - 실제 JWT 시크릿 키 사용

4. **HTTPS 설정**
   - Nginx + SSL 인증서
   - CORS 설정 업데이트

---

## 📚 관련 문서

- **기능 설계**: `/F-001_회원가입_및_로그인.md`
- **API 명세**: `/API_명세서.md`
- **DB 설계**: `/데이터베이스_설계서.md`
- **기술 스택**: `/기술스택_설계서.md`

---

## 💡 Tips

1. **개발 중 DB 스키마 자주 바뀐다면**:
   ```bash
   # 매번 입력 없이 실행하려면
   echo "yes" | python scripts/reset_dev_db.py --seed
   ```

2. **API 테스트**:
   - FastAPI Docs 페이지 (`/docs`) 활용
   - 또는 curl/Postman 사용

3. **로그 확인**:
   - `config.py`에서 `DEBUG=True`로 설정하면 SQL 쿼리 로그 출력
   - 운영 환경에서는 반드시 `DEBUG=False`

4. **포트 변경**:
   ```bash
   python -m uvicorn app.main:app --reload --port 다른포트번호
   ```

---

**문제가 해결되지 않으면**:
1. 로그를 확인하세요 (콘솔 출력)
2. DB 파일을 삭제하고 재생성해보세요
3. 가상환경을 다시 만들어보세요
