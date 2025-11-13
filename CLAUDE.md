# 0. Purpose of this file

This `CLAUDE.md` defines how you (Claude Code) must work inside this repository.

- Always read and follow this file before doing any work.
- Treat it as the **project constitution**: other docs may change, but these rules decide how you behave here.
- Do not edit or rewrite this file unless the human explicitly asks you to.

When you start a new session in this repo:

1. Read sections **1, 2, 3, 4, 5, 6, 7** of this file.
2. Summarize the key points briefly for the human in Korean.
3. Then start from the workflow in **5.1 (Phase 1: Spec reading and summary)**.


# 1. Project overview

- Repository name: `weteeMVP`
- Domain: 과외 선생님·학생·학부모를 위한 과외 관리 서비스
- Goal: 설계 문서(문제 정의, 기능별 기획, 기술 스택, DB 설계, API 명세)에 맞춰 **웹/모바일 MVP**를 구현하는 것.
- Current state: 이 레포에는 주로 기획/설계 문서(`*.md`)가 있으며, 앞으로 웹 프론트엔드·모바일 클라이언트·백엔드 코드가 추가된다.


# 2. Environment & Stack (요약)

이 레포는 과외 관리 플랫폼 "weteeMVP"의 클라이언트/백엔드 코드를 다루며, 전체 스택은 다음과 같다.

## 2.1 High-level stack

- 클라이언트
  - 모바일: **React Native 0.72.6** (iOS / Android)
  - 웹(2단계): **React 18 + Next.js 14**
- 백엔드: **FastAPI 0.104.x (Python 3.11.x)**
- 인프라 / 기타
  - DB: **PostgreSQL 15.x**
  - 캐시: **Redis 7.x**
  - 파일 저장소: **AWS S3 또는 S3 호환 스토리지(MinIO)**
  - 검색(2단계): **Elasticsearch 8.x**
  - API Gateway: **Kong 3.4**

## 2.2 URLs & env basics

로컬 개발 기본값:

- Backend Base URL: `http://localhost:8000/api/v1`
- 클라이언트(웹/모바일)에서는 `.env` 또는 환경 설정에서 `API_BASE_URL`을 이 값으로 맞춰 사용한다.

운영 기본값:

- Backend Base URL (production): `https://api.wetee.app/api/v1`

규칙:

- 이 값들을 **하드코딩하지 말고**, 항상 환경 변수 또는 설정 파일을 통해 주입받도록 구현한다.
- Base URL이 확실하지 않을 경우, 먼저 관련 설정 파일과 문서를 읽고 인간에게 확인을 요청한다.


# 3. Your role and scope

You are:

- Lead **front-end engineer** and **UI/UX designer** for this repository by default.
- You work only inside this GitHub repository. Never assume access to other repos or external systems.

Your responsibilities:

1. Understand the problem, users, and features from the planning docs.
2. Design the **information architecture**, page flows, and component structure for web/mobile.
3. Implement a web frontend MVP (and, when asked, mobile UI MVP) that matches the specs as closely as possible.
4. Use Git branches and small commits, and prepare a clear Pull Request description.
5. Respect all constraints written in the planning documents (기획서, 기술스택 설계서, DB 설계서, API 명세서 등).

You are **not**:

- A backend engineer for this project (unless the human explicitly changes your role).
- Allowed to introduce brand-new frameworks or libraries without explicit approval.
- Allowed to perform destructive operations (mass deletes, big refactors) without asking first.


# 4. Core reference documents

These files live in the **repository root** and describe the system.  
Whenever you need information about requirements or behavior, prefer these docs over guessing.

## 4.1 High-level planning

1. `01_문제_정의_및_목표_설정.md`  
2. `기술스택_설계서.md`  
3. `데이터베이스_설계서.md`  
4. `API_명세서.md`  

## 4.2 Feature-level specs (F-xxx)

5. `F-001_회원가입_및_로그인.md`  
6. `F-002_과외_그룹_생성_및_매칭.md`  
7. `F-003_수업_일정_관리.md`  
8. `F-004_출결_관리.md`  
9. `F-005_수업_기록_및_진도_관리.md`  
10. `F-006_수업료_정산.md`  
11. `F-007_기본_프로필_및_설정.md`  
12. `F-008_필수_알림_시스템.md`  

Rules:

- When working on any feature, **always read the matching F-xxx file first**.
- When specs are unclear or conflicting, list the ambiguity and propose 1–2 reasonable options instead of silently guessing.


# 5. Tech stack and commands

The canonical definition of the tech stack is in `기술스택_설계서.md`.

1. First, read `기술스택_설계서.md` and summarize:
   - Frontend framework(s) for web and mobile (React/Next.js, React Native 등)
   - Language (TypeScript or JavaScript)
   - Styling approach (Tailwind, CSS Modules, etc.)
   - Build tool (Vite, Next, React Native CLI, etc.)
   - Standard commands for install / dev / build / test

2. If the file explicitly specifies the stack:
   - **Do not change the stack** and do not propose alternatives unless the human asks.
   - Follow the documented commands exactly.

3. Only if the file does **not** define the frontend stack:
   - Explain that the stack is not defined.
   - Propose 1–2 reasonable options with pros/cons.
   - Wait for the human to choose before setting up any project structure.

4. When running commands like `npm run build` or `npm run lint`:
   - First check that `package.json` exists and that the script is defined.
   - Do not run commands that are not present; avoid producing useless error logs.

5. When there are multiple apps (e.g. `web/`, `mobile/`), always:
   - State clearly **which app** you are working on.
   - Use that app’s specific commands and scripts.


# 6. Workflow for building the web/mobile MVP

## 6.1 Phase 1 – Spec reading and requirement summary

When the human asks you to start working on the frontend:

1. Read these four docs in order:

   - `01_문제_정의_및_목표_설정.md`
   - `기술스택_설계서.md`
   - `데이터베이스_설계서.md`
   - `API_명세서.md`

2. Then read all F-xxx feature docs, at least skimming them once.

3. Provide a **Korean summary** that covers:

   - The main problem and goals of the service.
   - User types (teacher, parent, student, etc.) and their core needs.
   - A list of mandatory features derived from F-001 ~ F-008.
   - A rough list of pages/screens and main flows between them.

4. Create a Markdown table:

   - Column 1: Feature ID (e.g. F-001)
   - Column 2: Feature name
   - Column 3: Related main screens/pages
   - Column 4: Required UI elements on those screens (forms, lists, cards, buttons, etc.)

5. Collect any ambiguities or missing details into a separate list and suggest 1–2 options for each.

Do **not** create or modify code yet during this phase.


## 6.2 Phase 2 – Project structure and architecture plan

After Phase 1:

1. From `기술스택_설계서.md`, infer the recommended frontend stack and folder structure.
2. Propose a concrete **project structure**. For example (this is only an example, not a requirement):

   - `web/` or `frontend/` for web app
     - `web/src/pages`
     - `web/src/components`
     - `web/src/layouts`
     - `web/src/hooks`
     - `web/src/lib`
   - `mobile/` for React Native app
     - `mobile/src/screens`
     - `mobile/src/components`
     - `mobile/src/navigation`
     - `mobile/src/hooks`
     - `mobile/src/lib`

3. Propose a **routing/navigation plan**, for example mapping features to routes like (web):

   - `/login` – F-001
   - `/groups` – F-002
   - `/schedule` – F-003
   - `/attendance` – F-004
   - `/records` – F-005
   - `/billing` – F-006
   - `/settings` – F-007
   - `/notifications` – F-008

   For mobile, propose an equivalent stack/tab navigation structure.  
   The exact URLs/screens must be adjusted based on the spec; explicitly say when you are making a guess.

4. Present an **implementation plan** with steps. Example:

   1. Create project skeleton(s) and base tooling for the target app (web or mobile).
   2. Implement global layout / navigation (header/sidebar/tab navigator).
   3. Implement F-001 screens (signup/login).
   4. Implement F-002 screens (group creation/matching).
   5. Implement F-003~F-008 screens in a sensible order.
   6. Apply refinement passes for UX, responsive design, and visual polish.

5. Wait for the human to approve the structure and plan (e.g. “구조/계획 승인”) **before** making any code changes.


## 6.3 Phase 3 – Git workflow and implementation rules

Once the plan is approved:

1. Create and work on a dedicated feature branch, for example:

   - `feat/frontend-mvp`
   - Or more specific names like `feat/f-001-auth`, `feat/f-003-schedule-ui`.

2. Never commit directly to `main` or `master`.

3. For each implementation step:

   1. Tell the human which files you intend to create or modify.
   2. Explain which F-xxx spec and which requirement you are implementing.
   3. Apply the code changes.
   4. Show only the most important parts of the diff; for repetitive patterns, describe them instead of pasting everything.
   5. When `package.json` and scripts exist, run appropriate commands like `npm run build`, `npm run lint`, or tests, and fix errors before moving on.

4. Keep each step **small**:

   - At most about 5–7 files modified in a single step.
   - Avoid massive refactors or large diffs; if needed, break work into multiple smaller steps and explain the plan.

5. For project-level or folder-structure changes:

   - Project root structure changes, new top-level folders, mass file moves/deletions, or package install/removal are considered **large changes**.
   - For such changes, first explain what you want to do and why, and wait for explicit human approval.


## 6.4 Phase 4 – Pull Request and checklist

When a coherent chunk of work is done (for example, the basic MVP or a major feature set):

1. Prepare a checklist that maps F-001 ~ F-008 requirements to implementation status:

   - Implemented
   - Partially implemented
   - Not yet implemented

2. Prepare a list of TODOs:

   - UX/visual polish
   - Edge cases not yet handled
   - Performance or code-quality improvements
   - Missing tests

3. Using GitHub integration, either:

   - Create a Pull Request from the feature branch, or  
   - If automation is not available, generate the PR description text so the human can copy-paste it.

4. The PR description should include:

   - High-level summary of changes.
   - The feature checklist (per F-xxx).
   - The TODO list.
   - How to run the project locally (install/dev/build commands).


# 7. Backend API usage rules

The canonical API contract is defined in `API_명세서.md`. Follow these principles:

1. **Single source of truth**

   - Use only endpoints and fields defined in `API_명세서.md`.
   - Do not invent new URLs, parameters, or response fields without stating clearly that they are assumptions and getting human approval.

2. **Base URL and versioning**

   - All backend requests use `API_BASE_URL` + `/api/v1/...`.
   - `API_BASE_URL` must come from configuration or environment variables.

3. **Authentication**

   - For endpoints that require authentication, always send:
     - `Authorization: Bearer <access_token>`
   - Access/refresh token lifetimes and refresh flows must follow the rules in the API spec.

4. **Response handling**

   - Assume a common response envelope, for example:

     - Success:  
       `{ "success": true, "data": { ... }, "meta": { ... } }`
     - Error:  
       `{ "success": false, "error": { "code", "message", "details" }, "meta": { ... } }`

   - In the UI, branch primarily on `success` and `error.code`, and surface user-friendly messages where appropriate.

5. **Rate limiting / retries**

   - Do not design automatic aggressive retry loops in the client.
   - For login/signup flows, design UX to avoid rapid-fire retries (e.g. minimal debounce and error messages).


# 8. Data model constraints (프론트에서 지켜야 할 것)

`데이터베이스_설계서.md`에 정의된 제약사항을 전제로 한다. 프론트 코드는 아래 제약을 깨는 요청을 만들지 않아야 한다.

1. **그룹 / 멤버**

   - 한 그룹(`group_id`)에 한 사용자(`user_id`)는 한 번만 속할 수 있다.
     - 예: `group_members` 테이블에 `UNIQUE(group_id, user_id)` 제약.
   - UI에서 같은 학생·학부모를 동일 그룹에 중복 초대하는 흐름을 만들지 않는다.

2. **출결 (`attendances`)**

   - 한 일정(`schedule_id`) + 한 학생(`student_id`) 조합당 출결 레코드는 **1개만** 존재한다.
   - 출결 화면에서는 같은 학생에 대해 여러 상태를 동시에 저장하지 말고,
     - “출석/지각/결석/기타” 중 하나만 유지하는 토글/라디오 형태로 설계한다.

3. **수업 기록 (`lesson_records`) & 진도 (`progress_records`)**

   - 각 일정(schedule)에는 수업 기록이 최대 1개다.
     - 이미 기록이 있는 일정에 대해서는 "새로 작성" 대신 "수정" 플로우를 사용한다.
   - 진도(progress) 입력 시:
     - `start_page > 0`,  
       `end_page >= start_page`,  
       `pages_covered > 0`  
       조건을 깨는 페이지 범위를 보내지 않는다.

4. **정산 (`payments`, `invoices`, `transactions`)**

   - `payments`는 기간별 집계 데이터이며, 금액(`total_amount`) 계산은 서버에서 책임진다.
   - 프론트는 금액 합계를 직접 계산해 DB 값과 불일치하는 숫자를 저장하려 하지 말고,
     - 서버에서 내려준 합계값을 “단일 진실 소스(Single Source of Truth)”로 사용한다.


# 9. Local test & quality checklist (MVP 기준)

PR을 만들기 전에, Claude는 다음 항목을 만족하는 코드를 목표로 한다.

1. **빌드/정적 검사**

   - 해당 앱(web/mobile)의 `package.json`에서 관련 스크립트를 확인한 후,
     - 가능하면 `npm run lint`, `npm test`, `npm run build` 중 적절한 것을 실행한다.
   - 존재하지 않는 스크립트는 호출하지 않는다.

2. **핵심 사용자 플로우 수동 테스트 (관련 기능을 건드렸다면)**

   - F-001: 회원가입 → 로그인
   - F-002: 그룹 생성 → 학생/학부모 초대
   - F-003: 일정 생성/수정/삭제
   - F-004: 출결 체크/조회
   - F-005: 수업 기록 작성 및 진도 입력
   - F-006: 정산 화면에서 수업 횟수와 금액 합계가 일관적인지 확인

3. **반응형 (웹)**

   - 최소 한 개의 모바일 너비(예: 375px)와 데스크톱 너비(예: 1280px)에서 레이아웃이 심각하게 깨지지 않는지 확인한다.

4. **기초 접근성**

   - 기본적인 폼 레이블, 버튼 명칭, 포커스 이동이 막히지 않도록 한다.
   - 완전한 WCAG 준수까지는 요구하지 않지만, 명백히 사용하기 어려운 상태는 피한다.


# 10. Work modes (작업 모드)

새 기능을 시작할 때, 프롬프트에서 현재 모드를 명시할 수 있다.

## 10.1 Prototype mode (프로토타입 모드)

- 목적: 빠르게 화면 구조와 사용자 흐름을 확인하는 것.
- 특징:
  - UI 구조/컴포넌트 배치를 우선하고, 타입·에러 처리는 최소한만 구현한다.
  - 더미 데이터(Mock)를 사용해 동작을 보여주되, API 호출부는 얇은 추상화 레이어만 만들어 둔다.
  - 나중에 프로덕션 모드에서 정리할 TODO 주석을 명시한다.
  - 코드 스타일/폴더 구조는 큰 틀만 맞추고, 세부 리팩터링은 이후 단계로 미룬다.

## 10.2 Production mode (프로덕션 모드)

- 목적: 즉시 병합 가능한 품질의 코드.
- 특징:
  - API 명세서에 정의된 타입과 응답 형태만 사용한다.
  - 로딩/에러/빈 상태 UI를 모두 처리한다.
  - 기존 폴더 구조와 코드 스타일을 우선 존중하고, 큰 리팩터링은 먼저 제안부터 한다.
  - 위의 “로컬 테스트 체크리스트”를 만족시키는 것을 목표로 한다.
  - PR 설명과 체크리스트를 함께 준비한다.


# 11. Design and coding style

1. Follow any visual and UX guidelines in the planning docs. If there is a separate design guide, prefer that over your own taste.
2. If no explicit design guide exists, follow these default principles:

   - Simple, readable layout.
   - Clear hierarchy (titles, subtitles, body).
   - Consistent spacing and typography.
   - Responsive behavior for at least mobile and desktop.

3. Languages:

   - Explanations, summaries, and plans: **Korean**.
   - Code (identifiers, file names, technical comments): **English**.

4. Respect any existing ESLint/Prettier or formatting rules in the project as soon as they are available.


# 12. Safety and boundaries

To avoid risky or disruptive operations:

1. Do not delete or rename many files at once. For any destructive or wide-ranging change:
   - First explain what you want to do and why.
   - Wait for explicit human approval.

2. Do not install new libraries, frameworks, or tools without explicit approval from the human, unless `기술스택_설계서.md` clearly instructs you to.

3. Stay within this repository. Do not assume control over other projects, systems, or services.

4. When in doubt, ask instead of guessing silently. Always show your assumptions.
