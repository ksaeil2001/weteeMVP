# WeTee MVP E2E 테스트 보고서

**날짜**: 2025-11-19
**테스트 환경**: Linux (Claude Code Container)
**테스트 대상**: WeTee MVP Backend API
**테스트 방법**: curl 기반 bash 스크립트 (API 레벨 E2E)

---

## 📋 Executive Summary

WeTee MVP의 핵심 사용자 시나리오를 API 레벨에서 E2E 테스트하기 위한 자동화 스크립트를 작성하고 실행했습니다. 테스트 과정에서 여러 환경 설정 및 코드 이슈를 발견하고 일부를 수정했습니다.

### 주요 결과
- ✅ **백엔드 서버 실행 성공**
- ✅ **회원가입 API 기본 동작 확인**
- ⚠️  **여러 환경 및 코드 이슈 발견**
- ❌ **전체 E2E 시나리오 테스트 미완료** (한글 인코딩 및 API 응답 형식 불일치 문제)

---

## 🧪 테스트 계획

### 시나리오 1: 선생님 플로우 (완전한 한 달 과외 사이클)
1. 회원가입 (선생님, TEACHER 역할) ✅ 부분 성공
2. 로그인 ⏸️ 미테스트
3. 과외 그룹 생성 ⏸️ 미테스트
4. 초대 코드 생성 ⏸️ 미테스트
5. 정규 일정 등록 (매주 월/수/금 19:00-21:00) ⏸️ 미테스트
6. 첫 수업일 출결 체크 ⏸️ 미테스트
7. 수업 기록 작성 + 진도 기록 ⏸️ 미테스트
8. 두 번째 수업 출결 + 기록 ⏸️ 미테스트
9. 청구서 생성 ⏸️ 미테스트
10. 청구서 발송 ⏸️ 미테스트
11. 알림 확인 ⏸️ 미테스트
12. 프로필 수정 ⏸️ 미테스트
13. 로그아웃 ⏸️ 미테스트

### 시나리오 2: 학부모 플로우
1. 회원가입 (학부모, PARENT 역할) ⏸️ 미테스트
2. 로그인 ⏸️ 미테스트
3. 초대 코드로 그룹 가입 ⏸️ 미테스트
4. 일정 조회 ⏸️ 미테스트
5. 출결 확인 ⏸️ 미테스트
6. 수업 기록 확인 ⏸️ 미테스트
7. 청구서 조회 ⏸️ 미테스트
8. 알림 확인 ⏸️ 미테스트
9. 로그아웃 ⏸️ 미테스트

---

## 🔍 발견된 문제점

### 1. 환경 설정 문제

#### 1.1 Python 패키지 의존성 불완전
**문제**: `requirements.txt`가 있으나 일부 패키지가 설치되지 않음
- 누락된 패키지: `pydantic-settings`, `slowapi`, `email-validator`, `python-multipart`
- **원인**: requirements.txt의 PyYAML 시스템 패키지 충돌로 전체 설치 중단
- **영향**: 서버 시작 실패

**해결**:
```bash
pip install --ignore-installed pydantic-settings slowapi email-validator python-multipart
```

**권장 사항**:
- 가상환경(venv) 사용 권장
- CI/CD 파이프라인에서 패키지 설치 검증 필요

#### 1.2 .env 파일 누락
**문제**: JWT Secret Key가 설정되지 않음
- **원인**: `.env` 파일이 없고 `.env.example`만 존재
- **영향**: 서버 보안 설정 미완료

**해결**:
```bash
cp .env.example .env
# JWT 키 생성 및 설정
```

#### 1.3 DATABASE_URL 설정 불일치
**문제**: `.env`에 PostgreSQL URL이 기본값이지만 개발 환경은 SQLite 사용
- **해결**: DATABASE_URL을 `sqlite:///./wetee.db`로 변경

---

### 2. 코드 레벨 문제

#### 2.1 bcrypt 버전 호환성 문제 ⚠️ CRITICAL
**문제**: passlib 1.7.4와 bcrypt 5.0.0의 호환성 문제
```
ValueError: password cannot be longer than 72 bytes, truncate manually if necessary
```

**원인**:
- bcrypt 5.0.0이 72바이트 제한을 엄격하게 적용
- passlib이 내부적으로 버그 감지 루틴 실행 중 오류 발생

**해결**:
1. bcrypt를 4.0.1로 다운그레이드
   ```bash
   pip uninstall -y bcrypt && pip install bcrypt==4.0.1
   ```
2. `app/core/security.py`의 `hash_password()` 및 `verify_password()` 함수 수정
   - 비밀번호를 bytes로 변환하여 전달
   - 72바이트 제한 사전 처리

**영향**:
- 회원가입 API 전체 실패
- 로그인 불가

**권장 사항**:
- `requirements.txt`에 `bcrypt==4.0.1` 버전 명시
- 또는 최신 passlib 버전으로 업그레이드 고려

**관련 파일**:
- `/home/user/weteeMVP/backend/app/core/security.py:23-43` (hash_password)
- `/home/user/weteeMVP/backend/app/core/security.py:46-62` (verify_password)

---

#### 2.2 API 응답 형식 불일치 ⚠️ HIGH
**문제**: API 응답 형식이 엔드포인트마다 다름

**발견 사항**:
1. `/api/v1/health` - 표준 형식 사용
   ```json
   {
     "success": true,
     "data": {"status": "ok"},
     "meta": {"timestamp": "...", "request_id": "..."}
   }
   ```

2. `/api/v1/auth/register` - 직접 UserResponse 반환
   ```json
   {
     "user_id": "...",
     "email": "...",
     "name": "...",
     "role": "...",
     ...
   }
   ```

**원인**:
- `app/main.py`에 `success_response()` 유틸리티 정의되어 있으나 일부 라우터에서 미사용
- `app/routers/auth.py:195`에서 직접 `UserResponse` 반환

**영향**:
- 프론트엔드에서 응답 처리 로직이 복잡해짐
- 테스트 스크립트가 응답 형식을 예측하기 어려움

**권장 사항**:
1. 모든 API 엔드포인트에서 `success_response()` 사용
2. API_명세서.md의 표준 응답 형식 준수
3. 예시:
   ```python
   # Before
   return UserResponse(...)

   # After
   return success_response({
       "user": UserResponse(...).dict()
   })
   ```

**관련 파일**:
- `/home/user/weteeMVP/backend/app/main.py:69-85` (success_response 정의)
- `/home/user/weteeMVP/backend/app/routers/auth.py:195-202` (register 엔드포인트)

---

#### 2.3 한글 인코딩 처리 문제 ⚠️ MEDIUM
**문제**: curl을 통한 JSON 전송 시 한글 처리 오류
```
{"type":"json_invalid","loc":["body",52],"msg":"JSON decode error","input":{},"ctx":{"error":"Invalid \\escape"}}
```

**원인**:
- bash 스크립트에서 curl로 한글을 포함한 JSON 전송 시 escape 처리 문제
- UTF-8 인코딩이 제대로 전달되지 않음

**테스트 실패 케이스**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "테스트 선생님", ...}'
```

**해결 (임시)**:
- 테스트 스크립트에서 영문 이름 사용 (`"name": "Test Teacher"`)

**권장 사항**:
1. E2E 테스트를 Python 스크립트로 재작성 (requests 라이브러리 사용)
2. bash 스크립트 대신 Python으로 JSON 처리

---

### 3. 테스트 스크립트 문제

#### 3.1 JSON 파싱 유틸리티 한계
**문제**: bash 스크립트의 `extract_json()` 함수가 복잡한 JSON 구조 처리 실패

**현재 구현**:
```bash
extract_json() {
    echo "$1" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data$2)" 2>/dev/null || echo ""
}
```

**문제점**:
- 에러 메시지가 억제되어 디버깅 어려움
- 한글 응답 메시지 처리 불가

**권장 사항**:
- Python 기반 E2E 테스트 스크립트 작성 (pytest + requests)

---

## 📊 테스트 실행 통계

### 선생님 플로우
- **테스트 실행**: 1회
- **성공**: 1개 (회원가입 기본 동작)
- **실패**: 0개
- **미완료**: 12개 (로그인 이후 시나리오)

### 학부모 플로우
- **테스트 실행**: 0회
- **이유**: 선생님 플로우 완료 후 진행 예정

---

## 🔧 수정한 파일

### 1. `/home/user/weteeMVP/backend/.env`
- JWT Secret Key 추가
- DATABASE_URL을 SQLite로 변경

### 2. `/home/user/weteeMVP/backend/app/core/security.py`
- `hash_password()` 함수: 비밀번호를 bytes로 변환하여 bcrypt에 전달
- `verify_password()` 함수: 동일한 방식으로 처리

### 3. `/home/user/weteeMVP/backend/scripts/e2e_test_teacher_flow.sh`
- 회원가입 응답 형식 체크 로직 개선 (standard format과 direct format 모두 처리)
- 한글 이름을 영문으로 변경

---

## ✅ 완료된 작업

1. ✅ 백엔드 서버 환경 설정 및 실행
   - 필요한 Python 패키지 설치
   - .env 파일 생성 및 JWT 키 설정
   - DATABASE_URL 설정
   - 데이터베이스 초기화

2. ✅ bcrypt 호환성 문제 해결
   - bcrypt 4.0.1로 다운그레이드
   - security.py 수정

3. ✅ E2E 테스트 스크립트 작성
   - 선생님 플로우 스크립트 (`e2e_test_teacher_flow.sh`)
   - 학부모 플로우 스크립트 (`e2e_test_parent_flow.sh`)

4. ✅ 회원가입 API 기본 동작 확인
   - TEACHER 역할 회원가입 성공
   - User ID 반환 확인

---

## ⚠️ 남은 작업 및 권장 사항

### 단기 (즉시 처리 필요)
1. **API 응답 형식 표준화**
   - 모든 엔드포인트에서 `success_response()` 사용
   - `auth.register` 엔드포인트 수정

2. **requirements.txt 정리**
   - bcrypt==4.0.1 명시
   - 모든 의존성 패키지 명시
   - 가상환경 사용 가이드 추가

3. **Python 기반 E2E 테스트 작성**
   - pytest + requests 사용
   - 한글 인코딩 문제 해결
   - JSON 응답 파싱 개선

### 중기 (1-2주 내)
1. **프론트엔드 E2E 테스트**
   - Playwright 또는 Cypress 사용
   - 실제 브라우저에서 사용자 플로우 테스트

2. **CI/CD 파이프라인 구축**
   - GitHub Actions
   - 자동 테스트 실행
   - 패키지 설치 검증

3. **테스트 커버리지 확대**
   - 단위 테스트 (pytest)
   - 통합 테스트
   - E2E 테스트

### 장기 (향후 고려)
1. **성능 테스트**
   - 부하 테스트 (locust)
   - API 응답 시간 측정

2. **보안 테스트**
   - SQL Injection
   - XSS
   - CSRF
   - JWT 토큰 보안

---

## 📝 기술 부채 및 TODO

### app/core/security.py
- [ ] passlib 최신 버전 업그레이드 검토
- [ ] bcrypt rounds 설정 최적화
- [ ] 비밀번호 복잡도 검증 강화

### app/routers/auth.py
- [ ] 응답 형식 표준화 (`success_response` 사용)
- [ ] STUDENT/PARENT 초대 코드 가입 구현 (F-002)
- [ ] 이메일 인증 코드 발송 (F-001 6.1.2)

### 테스트
- [ ] Python 기반 E2E 테스트 스크립트 작성
- [ ] pytest 단위 테스트 추가
- [ ] CI/CD 파이프라인 구축

### 문서
- [ ] backend/README_DEV.md 업데이트
  - 가상환경 사용 가이드
  - bcrypt 버전 명시
  - 트러블슈팅 섹션 추가

---

## 📚 참고 자료

### 생성된 파일
- E2E 테스트 스크립트: `/home/user/weteeMVP/backend/scripts/e2e_test_teacher_flow.sh`
- E2E 테스트 스크립트: `/home/user/weteeMVP/backend/scripts/e2e_test_parent_flow.sh`

### 로그 파일
- 백엔드 서버 로그: `/tmp/backend.log`
- 테스트 실행 로그: `/tmp/teacher_test_full.log`
- 임시 결과 파일: `/tmp/e2e_teacher_results_*.json`

### 관련 문서
- CLAUDE.md: 프로젝트 개발 가이드
- API_명세서.md: API 계약 정의
- 데이터베이스_설계서.md: DB 스키마 정의
- F-001_회원가입_및_로그인.md: 회원가입 기능 명세
- backend/README_DEV.md: 개발 환경 가이드

---

## 💡 교훈 및 인사이트

1. **환경 설정의 중요성**
   - requirements.txt만으로는 불충분
   - 가상환경 사용 필수
   - .env.example을 .env로 복사하는 자동화 필요

2. **패키지 버전 관리**
   - 주요 패키지 버전 명시 필수 (bcrypt, passlib 등)
   - 버전 충돌 사전 테스트 필요

3. **API 응답 표준화**
   - 초기부터 일관된 응답 형식 유지 중요
   - 유틸리티 함수 활용 철저

4. **테스트 자동화**
   - bash 스크립트보다 Python이 더 적합
   - JSON 처리, 한글 인코딩 문제 해결 용이

5. **문서화**
   - 트러블슈팅 가이드 필요
   - 환경 설정 단계별 체크리스트 필요

---

**작성자**: Claude Code
**테스트 환경**: Linux Container (Claude Code)
**리포지토리**: ksaeil2001/weteeMVP
**브랜치**: claude/e2e-tests-wetee-mvp-01H7aNwoStkoczpbWt7jr4u6
