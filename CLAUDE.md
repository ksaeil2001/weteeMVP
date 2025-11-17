# CLAUDE.md

## 1. 프로젝트 개요

- 프로젝트명: 개인 과외 관리 통합 플랫폼 (가칭 WeTee)
- 목적
  - 과외 선생님, 학생, 학부모가 겪는 파편화된 도구, 불투명한 정산, 반복적인 행정 업무를 한 곳에서 해결하는 통합 관리 서비스
  - 일정, 출결, 진도, 정산, 알림을 하나의 플랫폼에서 관리하여, 사용자가 더 가치 있는 일(수업 준비, 학생 관리)에 집중하도록 돕는 것
- 핵심 사용자
  - 개인 과외 선생님
  - 과외를 맡기는 학부모
  - 학생 (중·고등학생 중심)

이 레포지토리는 이 서비스를 위한 MVP 1단계 기능(F-001~F-008)의 프론트엔드, 백엔드, 데이터베이스를 구현하기 위한 코드 저장소다.  
Claude/Claude Code는 아래 규칙을 기반으로 코드와 문서를 다룬다.


## 2. 문서 구조와 해석 우선순위

Claude는 코드를 작성하거나 수정하기 전에 다음 문서들을 이 순서대로 우선 읽고, 필요한 부분을 요약한 뒤 작업을 시작한다.

1. 01_문제_정의_및_목표_설정.md  
   - 해결하려는 문제, 타깃 사용자, 성공 기준이 적힌 최상위 기획 문서.

2. UX_UI_설계서.md  
   - 전체 화면 목록, 사용자 플로우, 공통 레이아웃, 디자인 시스템, 공통 컴포넌트(Button, Card, Input, Badge 등).

3. 기능 명세서 F-001 ~ F-008  
   - 기능별 시나리오, 권한, 예외 케이스, 필수·선택 입력 항목, 세부 UI 요구사항.

4. API_명세서.md  
   - 프론트엔드와 백엔드 사이의 REST API 계약(엔드포인트, 요청·응답 스키마, 에러 코드 등).

5. 데이터베이스_설계서.md  
   - PostgreSQL 기반 테이블·관계·인덱스 구조(논리 설계 기준).

6. 기술스택_설계서.md  
   - 프론트엔드·백엔드·인프라 전체 아키텍처와 사용 기술·버전, 비기능 요구사항.

7. 구현 관련 추가 문서  
   - backend/README_DEV.md (실제 개발 환경, DB 리셋 방법, 주요 명령어)  
   - 기타 README, 주석, TODO 등.


### 2.1 우선순위와 충돌 처리 규칙

문서 간 내용이 충돌하거나 해석이 애매할 때 Claude는 다음 순서를 따른다.

1. 서비스의 문제·목표·페르소나  
   → 01_문제_정의_및_목표_설정.md

2. 비즈니스 규칙, 권한, 예외 플로우, 누가·언제·무엇을 하는지  
   → 기능 명세서 F-001 ~ F-008

3. 요청·응답 형식, 에러 코드, 엔드포인트 정의  
   → API_명세서.md

4. 데이터 구조(테이블, 컬럼, 관계)  
   → 데이터베이스_설계서.md (논리 설계 기준)

5. 화면 구조, 레이아웃, 공통 컴포넌트, 색·폰트·간격, 인터랙션 패턴  
   → UX_UI_설계서.md

6. 실제 구현 환경/버전, 인프라, 비기능 요구사항  
   → 기술스택_설계서.md, backend/README_DEV.md

추가 규칙:

- 무엇을 / 언제 / 누가 해야 하는지 (업무 규칙, 권한, 시나리오)는 기능 명세서가 UX/UI 설계서보다 우선이다.
- 어떻게 보여줄지 (레이아웃, 구조, 디자인 시스템)는 UX_UI 설계서가 기능 명세서보다 우선이다.
- API나 DB 설계를 바꿔야 할 정도의 변경이 필요하면:
  - 실제 코드 수정 전에 그 이유와 영향을 함수/파일 상단에 TODO 주석으로 남긴다.
  - 가능한 한 기존 설계와 호환되는 방향으로 수정한다.


## 3. 구현 범위 (MVP 1단계)

MVP 1단계에서 구현해야 할 기능은 다음 8개다.

1. F-001_회원가입_및_로그인.md
2. F-002_과외_그룹_생성_및_매칭.md
3. F-003_수업_일정_관리.md
4. F-004_출결_관리.md
5. F-005_수업_기록_및_진도_관리.md
6. F-006_수업료_정산.md
7. F-007_기본_프로필_및_설정.md
8. F-008_필수_알림_시스템.md


### 3.1 지금 구현하지 말아야 할 것들

아래 항목들은 코드에 훅(hook) 정도의 여지만 남기고, 실제 구현은 하지 않는다.

- 각 기능 명세서의 개선 아이디어, 향후 확장, 2단계에서 고려로 표시된 내용
- AI 추천, 고급 통계·분석, 고급 검색(예: Elasticsearch 기반 복합 검색)
- 이메일/SMS 알림, 고급 알림 필터링 등 F-008에서 명시적으로 제외한 고급 옵션
- 인프라 레벨의 고급 기능(멀티 리전, 복제, 완전한 멀티테넌트 지원 등)

필요해 보이더라도:

- 우선 F-001~F-008의 최소 요구사항을 만족시키는 선에서 구현하고
- 확장 아이디어는 코드에 TODO(v2) 형태로만 남긴다.


## 4. 기술 스택 및 현재 구현 상태

### 4.1 백엔드

- 언어 및 프레임워크: Python 3.11, FastAPI
- 주요 역할
  - 인증/인가(JWT)
  - 그룹·일정·출결·수업 기록·정산·프로필·알림 관련 REST API 제공
  - (향후) 토스페이먼츠 Webhook 처리
- 주요 구현 위치
  - 진입점: backend/app/main.py
  - 설정: backend/app/config.py
  - DB 연결·세션: backend/app/database.py
  - 도메인 모델: backend/app/models/
  - 스키마(Pydantic): backend/app/schemas/
  - 라우터: backend/app/routers/
  - 보안 유틸: backend/app/core/security.py
- 개발자 가이드
  - 실제 실행 방법과 DB 리셋 루틴은 backend/README_DEV.md 를 기준으로 한다.


### 4.2 데이터베이스

- 설계 기준 엔진: PostgreSQL 15.x (데이터베이스_설계서.md)
- 현재 개발 환경 엔진: SQLite (backend/wetee.db)

역할 분리:

- 데이터베이스_설계서.md  
  → 논리 설계(테이블·관계·인덱스)는 PostgreSQL 기준으로 정의한다.
- SQLAlchemy 모델 (backend/app/models/*.py)  
  → 이 논리 설계를 개발 편의를 위해 SQLite에 매핑한 구현이다.

주요 테이블(논리 설계 기준 예시):

- users, teachers, students, parents
- groups, group_members, invite_codes
- schedules, attendances, lesson_records, progress_records
- payments, invoices, transactions
- notifications, settings, 필요 시 login_history

MVP 개발 단계에서의 DB 운영 원칙:

- 스키마가 크게 바뀌면, SQLite 개발 환경에서는 DB 재생성이 표준 루틴이다.
- 운영/프로덕션 단계에서는 Alembic 기반 마이그레이션을 도입하는 것을 전제로 TODO로만 남긴다.
- DB 파일인 backend/wetee.db 는 Git으로 버전 관리하지 않는다(.gitignore 포함).


### 4.3 프론트엔드

- 스택 (현재 레포 기준)
  - Next.js (App Router)
  - TypeScript + React
  - Tailwind CSS
- 주요 구조
  - 페이지: frontend/src/app/…
  - 공통 컴포넌트: frontend/src/components/… (실제 구조는 레포를 따른다)
  - API 클라이언트: frontend/src/lib/apiClient.ts, frontend/src/lib/authApi.ts 등
- 역할
  - F-001~F-008에서 정의한 화면·플로우·상태를 구현한다.
  - 모든 데이터는 백엔드 API를 통해 가져오며, 프론트엔드는 비즈니스 규칙을 새로 정의하지 않는다.


### 4.4 개발 환경 및 경로 (Linux/Windows 정리)

컨테이너 내 Claude Code 기준 경로:

- 리포지터리 루트: /home/user/weteeMVP
- 백엔드: /home/user/weteeMVP/backend
- 프론트엔드: /home/user/weteeMVP/frontend

규칙:

- Claude Code가 실제로 실행하는 명령은 항상 위의 리눅스 경로 기준으로 작성한다.
- Windows 경로 (예: C:\Users\ksaei\Projects\weteeMVP)는:
  - 문서·주석·설명 예시로만 사용한다.
  - 컨테이너 안 Bash 명령에서는 사용하지 않는다.


## 5. 개발 원칙 (Claude 공통 규칙)

1. 문서를 먼저 읽고 요약한 뒤 코드를 작성한다.  
   - 관련 F-00X, UX_UI 설계서, API, DB 설계를 먼저 읽고
   - 이 기능이 해결하려는 문제와 핵심 플로우를 2~3줄로 정리한 뒤 구현을 시작한다.

2. 기능 명세서의 요구사항을 우선한다.  
   - 누가 어떤 화면에서 무엇을 할 수 있는지, 권한과 예외 플로우는 기능 명세서 기준이다.
   - 문서와 코드가 충돌하면 기능 명세서에 맞게 코드를 정리하고, 필요하면 TODO 주석으로 이유를 남긴다.

3. 화면·컴포넌트는 UX_UI 설계서의 디자인 시스템을 따른다.  
   - UX_UI_설계서.md에 정의된 공통 컴포넌트(Button, Input, Card, Badge, Toast 등)를 우선 사용한다.
   - 색상, 타이포그래피, 간격, 아이콘, 그림자 값은 UX/UI 설계서의 디자인 토큰을 따른다.
   - 새로운 컴포넌트를 만들 경우, 기존 컴포넌트로 해결하기 어려운 이유를 파일 상단 또는 컴포넌트 정의 근처에 주석으로 남긴다.

4. 비즈니스 로직은 백엔드에 두고, 프론트엔드는 표현·상태 관리에 집중한다.  
   - 언제 어떤 값이 바뀌는지는 최대한 백엔드에서 책임지게 한다.
   - 프론트엔드는 입력·검증·표시·상태 관리·UX에 집중한다.

5. API·DB 설계를 임의로 바꾸지 않는다.  
   - 새 엔드포인트를 만들기보다, API_명세서.md에 정의된 엔드포인트를 우선 사용한다.
   - DB에 없는 필드·테이블을 임의로 만들지 말고, 필요 시:
     - 임시 필드나 TODO 주석으로 표시하고
     - 어떤 기능 때문에 어떤 필드·테이블이 필요해 보이는지 설명한다.

6. 작은 단위로 작업하고, 각 단계마다 무엇을 했는지 설명한다.  
   - 디렉터리 구조 확인 → 문서 요약 → 모델·스키마 정의 → API 구현 → 프론트엔드 연동 → 간단한 테스트 순서를 기본으로 한다.
   - 한 번에 너무 많은 파일을 바꾸지 않고, 기능·화면 단위로 나눈다.

7. DB 스키마 변경은 개발 단계에서는 재생성 루틴을 표준으로 한다.  
   - User 등 핵심 모델 구조가 바뀌면:
     - SQLite 개발 환경에서는 scripts/reset_dev_db.py 를 사용해 DB를 재생성한다.
   - 운영 환경에서는 Alembic 등 마이그레이션 도구 도입을 전제로 TODO를 남긴다.

8. 문서를 중복해서 다시 쓰지 않는다.  
   - 기능 명세서 내용을 API 문서에 다시 풀어쓰지 않고 참조만 한다.
   - DB 설계 내용을 기능 명세서에 그대로 옮겨 적지 않는다.


## 6. 기능별 구현 가이드 (요약)

### 6.1 F-001 회원가입 및 로그인

- 참고 문서
  - F-001_회원가입_및_로그인.md
  - API_명세서.md 의 F-001 관련 섹션
  - 데이터베이스_설계서.md 의 users, teachers, students, parents 테이블
- 핵심 목표
  - 이메일/비밀번호 기반 회원가입, 로그인, 로그아웃
  - 역할(선생님/학부모/학생) 선택 및 저장
  - 비밀번호 재설정 플로우(토큰 기반까지 고려하되, 실제 구현 범위는 명세서 기준)
- 주의점
  - 무차별 대입 방지(요청 빈도 제한, 공통 에러 메시지 정책 등)
  - JWT 구조, 토큰 만료·저장 정책은 API·보안 설계를 따른다.


### 6.2 F-002 과외 그룹 생성 및 매칭

- 참고 문서
  - F-002_과외_그룹_생성_및_매칭.md
  - API_명세서.md 의 F-002 관련 섹션
  - 데이터베이스_설계서.md 의 groups, group_members, invite_codes
- 핵심 목표
  - 선생님의 과외 그룹 생성
  - 학생·학부모 초대·매칭, 초대 코드 관리
- 주의점
  - 권한: 그룹 생성·수정은 선생님, 조회는 학생·학부모
  - 초대 코드·링크 유효기간, 중복 사용 방지


### 6.3 F-003 수업 일정 관리

- 참고 문서
  - F-003_수업_일정_관리.md
  - schedules, attendances 관련 DB·API
- 핵심 목표
  - 정규 수업 일정 등록·수정·삭제
  - 보강 수업 일정 관리
  - 달력 뷰에서 일정 시각화
- 주의점
  - 반복 일정 규칙 처리
  - 시간대, 휴일, 보강·결석 처리와의 연계


### 6.4 F-004 출결 관리

- 참고 문서
  - F-004_출결_관리.md
  - attendances 테이블
- 핵심 목표
  - 선생님의 출석·지각·결석·보강 표시
  - 학생·학부모는 조회만 가능
- 주의점
  - 일정(F-003) 및 정산(F-006)과의 데이터 연계
  - 상태 변경 히스토리 필요 여부는 명세서 기준


### 6.5 F-005 수업 기록 및 진도 관리

- 참고 문서
  - F-005_수업_기록_및_진도_관리.md
  - lesson_records, progress_records, textbooks
- 핵심 목표
  - 수업별 요약, 진도, 숙제 기록
  - 학부모·학생이 확인 가능한 뷰 제공
- 주의점
  - 한 수업에서 여러 교재·진도 기록이 가능함
  - 검색·필터링을 고려한 데이터 구조 유지


### 6.6 F-006 수업료 정산

- 참고 문서
  - F-006_수업료_정산.md
  - payments, invoices, transactions
- 핵심 목표
  - 수업 횟수·출결 정보를 바탕으로 한 정산 로직
  - 청구서 생성, 결제 상태 조회
- 주의점
  - 정산의 소스 오브 트루스는 출결 + 일정
  - 결제 수단·Webhook 연동은 명세서 범위 내에서만 구현


### 6.7 F-007 기본 프로필 및 설정

- 참고 문서
  - F-007_기본_프로필_및_설정.md
  - users, settings, 필요 시 login_history
- 핵심 목표
  - 사용자 기본 정보(이름, 연락처, 사진 등) 관리
  - 언어, 알림, 보안 설정 등 환경 설정 화면
- 주의점
  - 읽기 모드 / 수정 모드 분리
  - 보안 관련 설정(비밀번호 변경, 2단계 인증 등)은 단계별로 확장


### 6.8 F-008 필수 알림 시스템

- 참고 문서
  - F-008_필수_알림_시스템.md
  - notifications 테이블
- 핵심 목표
  - 수업 일정, 보강, 숙제, 정산 등 핵심 이벤트에 대한 알림
  - 알림 리스트, 읽음 처리, 간단한 on/off 설정
- 주의점
  - MVP에서는 복잡한 필터링·채널 설정은 제외
  - 알림 보관 기간 정책 반영


## 7. Claude Code 작업 방식

이 섹션은 Claude Code가 이 레포에서 코드를 실제로 수정할 때 따라야 할 절차와 규칙을 정의한다.

### 7.1 역할 및 환경

- 역할
  - 이 레포에서 Claude Code는 시니어 풀스택 엔지니어이자 코드 리뷰어로 행동한다.
  - 목표는 문서에 맞게 기능을 구현하고, 발생한 버그를 실제 코드 수정으로 해결하는 것이다.
- 환경
  - 리포 루트: /home/user/weteeMVP
  - 백엔드: /home/user/weteeMVP/backend
  - 프론트엔드: /home/user/weteeMVP/frontend
  - OS: 리눅스 컨테이너
  - DB: 개발 단계에서는 SQLite, 논리 설계는 PostgreSQL 기준


### 7.2 경로와 명령 규칙

1. 실제 실행하는 명령은 항상 리눅스 경로(/home/user/…) 기준으로 작성·실행한다.
2. Windows 경로(C:\Users\ksaei\Projects\weteeMVP 등)는 설명/주석용 예시로만 쓰고, Bash 명령에는 사용하지 않는다.
3. DB 파일 삭제, 재생성, 스크립트 실행 등 파괴적인 작업 전에:
   - 먼저 무엇을 할지 자연어로 요약하고
   - 이어서 실행할 명령을 보여주며
   - 명령 실행 후 출력 로그를 함께 남긴다.


### 7.3 작업 시작 공통 루틴

새 작업(버그 수정, 기능 추가 등)을 시작할 때 Claude Code는 다음 순서를 따른다.

1. Git 상태 확인

    cd /home/user/weteeMVP  
    git status

2. 관련 파일 구조 파악  
   - ls, find, Glob 등을 이용해 관련 디렉터리·파일을 나열한다.

3. 관련 문서 읽기  
   - 최소한 다음을 확인한다.
     - 해당 기능의 F-00X 기능 명세서
     - UX_UI_설계서의 관련 화면(S-0xx)
     - API_명세서.md 의 관련 섹션
     - 데이터베이스_설계서.md 의 관련 테이블
     - 필요 시 backend/README_DEV.md

4. 현재 문제 또는 요청을 2~3줄로 요약한다.

5. Update Todos 블록을 만든다. 예시:

    Update Todos  
    - 프로젝트 구조 파악 및 관련 문서 확인  
    - User 모델과 DB 스키마 불일치 분석  
    - 회원가입 API 에러 핸들링 개선  
    - 프론트엔드 에러 메시지·UX 개선  
    - 테스트 및 검증 (백엔드·프론트)


### 7.4 분석 및 디버깅 절차

버그를 디버깅할 때 기본 흐름:

1. 백엔드 측 분석
   - 도메인 모델: backend/app/models/*.py
   - DB 초기화·세션: backend/app/database.py
   - 설정: backend/app/config.py
   - 라우터: backend/app/routers/*.py
   - 보안·유틸: backend/app/core/*.py

2. 실제 DB 스키마 확인 (SQLite 예시)

    cd /home/user/weteeMVP/backend  
    python3 -c "  
    import sqlite3  
    conn = sqlite3.connect('wetee.db')  
    cursor = conn.cursor()  
    cursor.execute(\"SELECT sql FROM sqlite_master WHERE type='table' AND name='users'\")  
    result = cursor.fetchone()  
    print(result[0] if result else 'users table not found')  
    conn.close()  
    "

3. 모델 vs 실제 스키마 vs 설계 문서 비교  
   - 주요 컬럼(이름, 타입, 제약, 존재 여부)을 짧게 표식으로 정리한다.  
   - 예: password vs password_hash, is_email_verified 누락 등.

4. 프론트엔드 측 분석
   - 관련 페이지: 예) frontend/src/app/(auth)/signup/page.tsx
   - API 클라이언트: frontend/src/lib/authApi.ts, frontend/src/lib/apiClient.ts
   - 에러 처리·메시지·UI 상태를 확인한다.

5. 핵심 원인을 1~3줄로 명확하게 정리한다.  
   - 예: 기존 DB 파일이 옛날 스키마로 생성되어 있고, User 모델은 password_hash 기준이라 OperationalError 발생.


### 7.5 DB 및 스키마 관련 추가 규칙

1. 논리 스키마의 기준은 데이터베이스_설계서.md 이며, PostgreSQL 기준이다.
2. SQLAlchemy 모델은 이 논리 스키마를 개발용 SQLite에 매핑하는 역할을 한다.
3. SQLite 스키마와 모델이 불일치하면:
   - 운영 환경이 아니라면, 개발 단계에서는 DB 재생성을 우선 고려한다.

4. 개발용 DB 리셋 표준 절차

    cd /home/user/weteeMVP/backend  
    python scripts/reset_dev_db.py --seed

   - 수행 내용
     - 기존 wetee.db 백업
     - 기존 DB 삭제
     - 최신 모델 기준 테이블 재생성
     - 옵션에 따라 테스트용 계정 seed
   - DEBUG 모드가 아니거나 SQLite가 아니면 실행하지 않도록 방어 로직이 포함되어야 한다.

5. 운영 환경(추후)에서의 스키마 변경
   - Alembic 기반 마이그레이션 도입을 전제로 TODO를 남긴다.
   - 현재 레포에서는 Alembic 스크립트를 실제로 작성하지 않는다.

6. DB 파일은 Git에서 버전 관리하지 않는다.
   - .gitignore 에 backend/wetee.db 가 포함되어야 한다.
   - Claude Code가 새로운 DB 파일을 만들더라도, 커밋에는 포함하지 않는다.


### 7.6 코드 수정 원칙 (백엔드·프론트엔드 공통)

1. 변경 범위 최소화  
   - 현재 이슈를 해결하는 데 필요한 파일과 로직만 수정한다.
   - 대규모 리팩터링이나 디렉터리 구조 변경은 요청이 없는 한 피한다.

2. 기존 스타일 유지  
   - 타입 선언, 변수·함수 네이밍, 에러 처리, 로깅 패턴 등은 기존 코드와 최대한 맞춘다.

3. 에러 핸들링
   - FastAPI 라우터:
     - HTTPException 은 그대로 재전송한다.
     - OperationalError, IntegrityError 등은 별도로 잡아서:
       - db.rollback() 수행
       - 서버 로그에 상세 내용 출력
       - 클라이언트에는 코드·메시지가 포함된 구조화된 detail 반환
   - 프론트엔드:
     - 상태 코드별로 메시지를 구분(409, 400, 500, 네트워크 오류 등)
     - NODE_ENV === 'development' 인 경우 콘솔·details 패널로 상세 에러를 출력한다.

4. 화면 ID(S-0xx) 주석
   - 새로운 화면·페이지를 만들 때는 UX_UI_설계서.md 의 화면 ID를 확인하고, 파일 상단에 주석으로 남긴다.

    예시  
    // Screen S-012: 선생님용 수업 일정 메인  
    // Related feature: F-003 수업 일정 관리


### 7.7 테스트 및 검증

코드 수정 후 최소한 다음을 수행하고, 실행한 명령과 결과를 기록한다.

1. 백엔드 헬스 체크

    cd /home/user/weteeMVP/backend  
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   다른 셸에서:

    cd /home/user/weteeMVP/backend  
    curl http://localhost:8000/api/v1/health

2. 주요 API 수동 테스트 (예: 회원가입)

    cd /home/user/weteeMVP/backend  
    curl -X POST http://localhost:8000/api/v1/auth/register  
      -H "Content-Type: application/json"  
      -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"테스트\",\"phone\":\"010-0000-0000\",\"role\":\"TEACHER\"}"

3. 프론트엔드 검증

    cd /home/user/weteeMVP/frontend  
    npm run lint  
    npm run build

   - 에러가 나면 메시지를 기반으로 수정 후 다시 실행한다.
   - 실제 브라우저에서 관련 페이지(예: /signup)를 열고 시나리오대로 동작하는지 확인한다.


### 7.8 Git 커밋 및 정리

Claude Code가 컨테이너에서 git 을 사용할 수 있는 경우, 다음 원칙을 따른다.

1. 작은 단위로 커밋  
   - 논리적으로 하나의 이슈를 해결한 뒤 한 번 커밋한다.

2. 커밋 메시지 형식 예시

    Fix signup DB schema mismatch and improve error handling  

    - SQLite users 테이블을 User 모델 스키마(password_hash 등)에 맞게 재생성  
    - auth.register 라우트에 OperationalError/IntegrityError 예외 처리 추가  
    - signup 페이지에서 500/네트워크 오류 메시지 분리 및 개발자용 상세 정보 패널 추가  
    - backend/README_DEV.md에 DB 리셋 및 개발 절차 문서화  

3. 커밋 후 출력
   - git status
   - 변경된 파일 목록
   - 파일별 핵심 변경 내용 한두 줄 요약


### 7.9 세션 마무리 시 보고 내용

각 작업 세션의 마지막에 Claude Code는 다음을 요약해서 남긴다.

1. 어떤 문서를 근거로 무엇을 구현·수정했는지
2. 수정·추가된 파일 목록과 핵심 변경 내용
3. 실행한 테스트·명령과 그 결과
4. 아직 남아 있는 TODO와 다음 단계 후보
5. 설계 문서(API·DB·UX)에 반영해야 할 제안사항이 있다면 간단히 정리

이 문서의 목적은 Claude/Claude Code가 WeTee MVP 레포에서 일관된 방식으로 설계 문서–코드–DB–프론트엔드를 연결하도록 하는 것이다.


## 8. 자기 점검용 질문 템플릿 (작업자용)

아래 질문은 Claude 또는 사람이 작업을 이어갈 때 스스로 체크하기 위한 템플릿이다. 필요 없으면 CLAUDE.md 에서 삭제해도 된다.
