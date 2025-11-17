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

### 3. "서버에 연결할 수 없습니다" (프론트엔드)

**원인**: 백엔드 서버가 실행 중이 아님

**해결 방법**:
```bash
# 백엔드 서버 실행 확인
curl http://localhost:8000/api/v1/health

# 응답이 없다면 서버 시작
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. CORS 에러

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

### JWT Secret Key 변경

**개발 환경**:
- `app/config.py`의 기본값 사용 가능

**운영 환경**:
- `.env` 파일을 생성하고 안전한 키 설정 필수
  ```bash
  # .env
  JWT_SECRET_KEY=<32자 이상의 랜덤 문자열>
  JWT_REFRESH_SECRET_KEY=<32자 이상의 랜덤 문자열>
  ```

- 안전한 키 생성 방법:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```

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
