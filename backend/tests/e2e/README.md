# E2E Tests for WeTee MVP

Python 기반 End-to-End 테스트 - pytest + requests 사용

## 설치

```bash
cd backend
pip install -r requirements.txt
```

## 실행 방법

### 1. 서버 시작
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 테스트 실행

**전체 E2E 테스트:**
```bash
cd backend
pytest tests/e2e/ -v
```

**선생님 플로우만:**
```bash
pytest tests/e2e/test_teacher_flow.py -v
```

**학부모 플로우만:**
```bash
pytest tests/e2e/test_parent_flow.py -v
```

**HTML 리포트 생성:**
```bash
pytest tests/e2e/ -v --html=reports/e2e_report.html --self-contained-html
```

## 테스트 시나리오

### 선생님 플로우 (13단계)
1. 회원가입
2. 로그인
3. 그룹 생성
4. 초대 코드 생성
5. 정규 일정 등록
6. 출결 체크
7. 수업 기록 작성
8. 진도 기록
9. 청구서 생성
10. 청구서 발송
11. 알림 확인
12. 프로필 수정
13. 로그아웃

### 학부모 플로우 (9단계)
1. 회원가입
2. 로그인
3. 초대 코드로 그룹 가입
4. 일정 조회
5. 출결 확인
6. 수업 기록 확인
7. 청구서 조회
8. 알림 확인
9. 로그아웃

## 특징

- **한글 데이터 처리**: Python의 native 문자열 처리로 인코딩 문제 없음
- **명확한 에러 메시지**: 실패 시 상세한 응답 정보 출력
- **테스트 데이터 공유**: fixture를 통해 테스트 간 데이터 공유
- **유연한 API 응답 처리**: 다양한 응답 형식 지원
- **미구현 API 스킵**: 아직 구현되지 않은 API는 자동 스킵

## GitHub Actions

`.github/workflows/e2e-tests.yml`:
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Start server
        run: |
          cd backend
          uvicorn app.main:app --host 0.0.0.0 --port 8000 &
          sleep 5
      - name: Run E2E tests
        run: |
          cd backend
          pytest tests/e2e/ -v --html=reports/e2e_report.html
      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: e2e-report
          path: backend/reports/
```
