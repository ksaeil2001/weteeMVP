# API 명세서 - 과외 관리 통합 플랫폼

**버전**: v1.0  
**작성일**: 2025-11-11  
**최종 수정일**: 2025-11-12  
**작성자**: AI Assistant  
**목적**: 프론트엔드-백엔드 간 API 인터페이스 정의 및 개발 협업 가이드  
**상태**: ✅ 초안 완료

---

## 목차

1. [개요](#1-개요)
2. [기본 정보](#2-기본-정보)
3. [인증 및 보안](#3-인증-및-보안)
4. [공통 응답 구조](#4-공통-응답-구조)
5. [에러 코드 체계](#5-에러-코드-체계)
6. [API 엔드포인트](#6-api-엔드포인트)
   - [F-001: 회원가입 및 로그인](#61-f-001-회원가입-및-로그인)
   - [F-002: 과외 그룹 생성 및 매칭](#62-f-002-과외-그룹-생성-및-매칭)
   - [F-003: 수업 일정 관리](#63-f-003-수업-일정-관리)
   - [F-004: 출결 관리](#64-f-004-출결-관리)
   - [F-005: 수업 기록 및 진도 관리](#65-f-005-수업-기록-및-진도-관리)
   - [F-006: 수업료 정산](#66-f-006-수업료-정산)
   - [F-007: 기본 프로필 및 설정](#67-f-007-기본-프로필-및-설정)
   - [F-008: 필수 알림 시스템](#68-f-008-필수-알림-시스템)
7. [WebHook](#7-webhook)
8. [공통 스키마](#8-공통-스키마)
9. [버전 관리](#9-버전-관리)

---

## 1. 개요

### 1.1 목적
이 문서는 과외 관리 통합 플랫폼 "WeTee"의 REST API 명세를 정의합니다. 프론트엔드(React Native) 개발자와 백엔드(FastAPI) 개발자 간의 협업을 위한 계약서 역할을 합니다.

### 1.2 범위
- **포함**: MVP 1단계 8개 기능(F-001~F-008)의 모든 API 엔드포인트
- **제외**: 2단계 이후 기능(F-009 이상), 내부 Admin API

### 1.3 설계 원칙
1. **RESTful 원칙 준수**: 
   - 리소스 기반 URL 설계
   - HTTP 메서드 적절한 사용 (GET, POST, PUT, PATCH, DELETE)
   - 상태 코드 일관성

2. **버전 관리**: 
   - URL에 버전 포함 (`/api/v1/...`)
   - 하위 호환성 유지

3. **보안**:
   - JWT 기반 인증
   - Rate Limiting 적용
   - HTTPS 필수

4. **문서화**:
   - FastAPI의 자동 Swagger 문서 활용
   - 모든 엔드포인트에 설명 추가

---

## 2. 기본 정보

### 2.1 Base URL

```
Production: https://api.wetee.app/api/v1
Development: http://localhost:8000/api/v1
```

### 2.2 Content Type

```
Content-Type: application/json
Accept: application/json
```

### 2.3 Date Format

- **ISO 8601**: `2025-11-12T09:30:00Z` (UTC)
- **Date Only**: `2025-11-12`
- **Time Only**: `09:30:00`

---

## 3. 인증 및 보안

### 3.1 JWT 인증

**Access Token**:
- 유효기간: 15분
- Header에 포함: `Authorization: Bearer <access_token>`

**Refresh Token**:
- 유효기간: 7일
- HTTP-Only 쿠키 또는 보안 저장소에 저장

**Token 갱신 플로우**:
```
1. Access Token 만료 감지 (401 Unauthorized)
2. Refresh Token으로 새 Access Token 발급 요청
3. 새 Access Token 받아서 재시도
4. Refresh Token도 만료 시 → 재로그인
```

### 3.2 Rate Limiting

| 엔드포인트 타입 | 제한 | 비고 |
|--------------|------|------|
| 로그인 | 5회/분 | IP 기준 |
| 회원가입 | 3회/시간 | IP 기준 |
| 일반 API | 100회/분 | 사용자 기준 |
| 파일 업로드 | 10회/시간 | 사용자 기준 |

**초과 시 응답**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청 횟수 제한을 초과했습니다. 1분 후 다시 시도해주세요.",
    "retry_after": 60
  }
}
```

### 3.3 권한 체계

| 역할 | 코드 | 설명 |
|------|------|------|
| 선생님 | TEACHER | 그룹 생성, 수업 관리, 정산 |
| 학생 | STUDENT | 출결 확인, 진도 조회 |
| 학부모 | PARENT | 자녀 정보 조회, 결제 |

---

## 4. 공통 응답 구조

### 4.1 성공 응답

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-11-12T09:30:00Z",
    "request_id": "abc123"
  }
}
```

### 4.2 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "AUTH001",
    "message": "인증이 필요합니다.",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-11-12T09:30:00Z",
    "request_id": "abc123"
  }
}
```

### 4.3 페이지네이션

**요청 파라미터**:
```
GET /api/v1/resource?page=1&size=20&sort=created_at&order=desc
```

**응답 구조**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "size": 20,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

## 5. 에러 코드 체계

### 5.1 HTTP 상태 코드

| 코드 | 의미 | 사용 |
|------|------|------|
| 200 | OK | 성공 |
| 201 | Created | 리소스 생성 성공 |
| 204 | No Content | 성공 (응답 본문 없음) |
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 리소스 충돌 |
| 422 | Unprocessable Entity | 유효성 검증 실패 |
| 429 | Too Many Requests | Rate Limit 초과 |
| 500 | Internal Server Error | 서버 에러 |

### 5.2 커스텀 에러 코드

#### COMMON (공통)
- `COMMON001`: 잘못된 요청 형식
- `COMMON002`: 필수 파라미터 누락
- `COMMON003`: 유효성 검증 실패

#### AUTH (인증)
- `AUTH001`: 인증 토큰 없음
- `AUTH002`: 인증 토큰 만료
- `AUTH003`: 인증 토큰 유효하지 않음
- `AUTH004`: 로그인 실패 (이메일/비밀번호 불일치)
- `AUTH005`: 이메일 인증 필요

#### GROUP (그룹)
- `GROUP001`: 그룹을 찾을 수 없음
- `GROUP002`: 그룹 권한 없음
- `GROUP003`: 초대 코드 만료
- `GROUP004`: 초대 코드 유효하지 않음

#### SCHEDULE (일정)
- `SCHEDULE001`: 일정을 찾을 수 없음
- `SCHEDULE002`: 일정 시간 충돌
- `SCHEDULE003`: 과거 일정 수정 불가

#### PAYMENT (결제)
- `PAYMENT001`: 결제 실패
- `PAYMENT002`: 결제 취소 불가
- `PAYMENT003`: 이미 결제된 청구서

---

## 6. API 엔드포인트

## 6.1 F-001: 회원가입 및 로그인

### 6.1.1 회원가입

```http
POST /api/v1/auth/register
```

**요청 본문**:
```json
{
  "email": "teacher@example.com",
  "password": "SecurePass123!",
  "name": "김선생",
  "phone": "01012345678",
  "role": "TEACHER",
  "profile": {
    "subjects": ["수학", "영어"],
    "school": "서울대학교"
  }
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid-123",
    "email": "teacher@example.com",
    "name": "김선생",
    "role": "TEACHER",
    "email_verified": false
  }
}
```

**비즈니스 규칙**: F-001 참조
- 이메일 중복 불가
- 비밀번호: 8자 이상, 영문+숫자+특수문자
- 인증 이메일 자동 발송

---

### 6.1.2 이메일 인증

```http
POST /api/v1/auth/verify-email
```

**요청 본문**:
```json
{
  "token": "email-verification-token-123"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "verified_at": "2025-11-12T09:30:00Z"
  }
}
```

---

### 6.1.3 로그인

```http
POST /api/v1/auth/login
```

**요청 본문**:
```json
{
  "email": "teacher@example.com",
  "password": "SecurePass123!",
  "device_info": {
    "device_type": "mobile",
    "os": "iOS",
    "app_version": "1.0.0"
  }
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "user_id": "uuid-123",
      "email": "teacher@example.com",
      "name": "김선생",
      "role": "TEACHER"
    }
  }
}
```

**Rate Limit**: 5회/분 (IP 기준)

---

### 6.1.4 토큰 갱신

```http
POST /api/v1/auth/refresh
```

**요청 본문**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "expires_in": 900
  }
}
```

---

### 6.1.5 로그아웃

```http
POST /api/v1/auth/logout
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**응답 (204 No Content)**

---

### 6.1.6 비밀번호 재설정 요청

```http
POST /api/v1/auth/password-reset/request
```

**요청 본문**:
```json
{
  "email": "teacher@example.com"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "비밀번호 재설정 이메일이 발송되었습니다.",
    "expires_in": 3600
  }
}
```

---

### 6.1.7 비밀번호 재설정 확인

```http
POST /api/v1/auth/password-reset/confirm
```

**요청 본문**:
```json
{
  "token": "reset-token-123",
  "new_password": "NewSecurePass123!"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "비밀번호가 성공적으로 변경되었습니다."
  }
}
```

---

### 6.1.8 회원 탈퇴

```http
DELETE /api/v1/auth/account
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**요청 본문**:
```json
{
  "password": "SecurePass123!",
  "reason": "서비스 불만족"
}
```

**응답 (204 No Content)**

**비즈니스 규칙**: F-001 참조
- 진행 중인 과외 없어야 함
- 미정산 금액 없어야 함

---

## 6.2 F-002: 과외 그룹 생성 및 매칭

### 6.2.1 과외 그룹 생성

```http
POST /api/v1/groups
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**요청 본문**:
```json
{
  "name": "민수 수학 과외",
  "subject": "수학",
  "level": "고등학교 2학년",
  "fee_per_session": 50000,
  "session_duration": 90,
  "description": "수능 대비 수학 과외입니다."
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "group_id": "uuid-group-123",
    "name": "민수 수학 과외",
    "teacher": {
      "user_id": "uuid-123",
      "name": "김선생"
    },
    "invite_code": "ABC123",
    "created_at": "2025-11-12T09:30:00Z"
  }
}
```

**권한**: TEACHER만 가능

---

### 6.2.2 초대 코드 발급

```http
POST /api/v1/groups/{group_id}/invite-codes
```

**요청 본문**:
```json
{
  "role": "STUDENT",
  "max_uses": 1,
  "expires_at": "2025-11-19T23:59:59Z"
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "invite_code": "XYZ789",
    "role": "STUDENT",
    "max_uses": 1,
    "expires_at": "2025-11-19T23:59:59Z",
    "created_at": "2025-11-12T09:30:00Z"
  }
}
```

**비즈니스 규칙**: F-002 참조
- 코드는 6자리 알파벳 대문자
- 중복 시 자동 재생성

---

### 6.2.3 초대 코드로 그룹 참여

```http
POST /api/v1/groups/join
```

**요청 본문**:
```json
{
  "invite_code": "XYZ789"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "group": {
      "group_id": "uuid-group-123",
      "name": "민수 수학 과외",
      "teacher": {
        "user_id": "uuid-123",
        "name": "김선생"
      }
    },
    "member": {
      "user_id": "uuid-456",
      "role": "STUDENT",
      "joined_at": "2025-11-12T09:30:00Z"
    }
  }
}
```

---

### 6.2.4 그룹 목록 조회

```http
GET /api/v1/groups?role=all&page=1&size=20
```

**Query Parameters**:
- `role`: `all` | `teacher` | `student` | `parent`
- `page`: 페이지 번호 (기본: 1)
- `size`: 페이지 크기 (기본: 20)

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "group_id": "uuid-group-123",
        "name": "민수 수학 과외",
        "subject": "수학",
        "teacher": {
          "user_id": "uuid-123",
          "name": "김선생"
        },
        "member_count": 3,
        "created_at": "2025-11-12T09:30:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "size": 20,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

---

### 6.2.5 그룹 상세 조회

```http
GET /api/v1/groups/{group_id}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "group_id": "uuid-group-123",
    "name": "민수 수학 과외",
    "subject": "수학",
    "level": "고등학교 2학년",
    "fee_per_session": 50000,
    "session_duration": 90,
    "description": "수능 대비 수학 과외입니다.",
    "teacher": {
      "user_id": "uuid-123",
      "name": "김선생",
      "phone": "010-1234-5678"
    },
    "members": [
      {
        "user_id": "uuid-456",
        "name": "박민수",
        "role": "STUDENT",
        "joined_at": "2025-11-12T09:30:00Z"
      }
    ],
    "created_at": "2025-11-12T09:30:00Z",
    "updated_at": "2025-11-12T09:30:00Z"
  }
}
```

---

### 6.2.6 그룹 정보 수정

```http
PATCH /api/v1/groups/{group_id}
```

**요청 본문**:
```json
{
  "name": "민수 영어 과외",
  "subject": "영어",
  "fee_per_session": 60000
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "group_id": "uuid-group-123",
    "name": "민수 영어 과외",
    "subject": "영어",
    "fee_per_session": 60000,
    "updated_at": "2025-11-12T09:30:00Z"
  }
}
```

**권한**: TEACHER만 가능

---

### 6.2.7 그룹 멤버 제거

```http
DELETE /api/v1/groups/{group_id}/members/{user_id}
```

**응답 (204 No Content)**

**권한**: TEACHER만 가능

---

### 6.2.8 그룹 삭제

```http
DELETE /api/v1/groups/{group_id}
```

**응답 (204 No Content)**

**권한**: TEACHER만 가능
**비즈니스 규칙**: F-002 참조
- 진행 중인 수업 없어야 함
- 미정산 금액 없어야 함

---

## 6.3 F-003: 수업 일정 관리

### 6.3.1 정규 수업 일정 생성

```http
POST /api/v1/groups/{group_id}/schedules
```

**요청 본문**:
```json
{
  "schedule_type": "REGULAR",
  "title": "정규 수학 수업",
  "start_time": "2025-11-12T15:00:00Z",
  "end_time": "2025-11-12T16:30:00Z",
  "location": "서울 강남구 학원",
  "recurrence_rule": {
    "type": "weekly",
    "days": [1, 3, 5],
    "end_date": "2025-12-31"
  },
  "student_ids": ["uuid-student-1", "uuid-student-2"]
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "schedule_id": "uuid-schedule-123",
    "schedule_type": "REGULAR",
    "title": "정규 수학 수업",
    "start_time": "2025-11-12T15:00:00Z",
    "end_time": "2025-11-12T16:30:00Z",
    "recurrence_rule": {
      "type": "weekly",
      "days": [1, 3, 5],
      "end_date": "2025-12-31"
    },
    "created_at": "2025-11-12T09:30:00Z"
  }
}
```

**비즈니스 규칙**: F-003 참조
- 반복 규칙 형식: `{"type": "weekly", "days": [1,3,5], "end_date": "2025-12-31"}`
- type: "daily" | "weekly" | "monthly" | "none"
- days: 요일 (0=일요일, 6=토요일)

---

### 6.3.2 보강 시간 오픈

```http
POST /api/v1/groups/{group_id}/schedules/makeup
```

**요청 본문**:
```json
{
  "schedule_type": "MAKEUP",
  "title": "보강 수업",
  "slots": [
    {
      "start_time": "2025-11-15T10:00:00Z",
      "end_time": "2025-11-15T11:30:00Z",
      "location": "서울 강남구 카페"
    },
    {
      "start_time": "2025-11-15T14:00:00Z",
      "end_time": "2025-11-15T15:30:00Z",
      "location": "서울 강남구 카페"
    }
  ],
  "max_students": 1,
  "description": "11/10 결석 보강"
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "makeup_session_id": "uuid-makeup-123",
    "slots": [
      {
        "slot_id": "uuid-slot-1",
        "start_time": "2025-11-15T10:00:00Z",
        "end_time": "2025-11-15T11:30:00Z",
        "status": "AVAILABLE",
        "booked_by": null
      }
    ],
    "created_at": "2025-11-12T09:30:00Z"
  }
}
```

---

### 6.3.3 보강 시간 예약

```http
POST /api/v1/schedules/makeup/{slot_id}/book
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "schedule_id": "uuid-schedule-456",
    "schedule_type": "MAKEUP",
    "start_time": "2025-11-15T10:00:00Z",
    "end_time": "2025-11-15T11:30:00Z",
    "status": "BOOKED",
    "booked_by": {
      "user_id": "uuid-student-1",
      "name": "박민수"
    },
    "booked_at": "2025-11-12T09:30:00Z"
  }
}
```

**비즈니스 규칙**: F-003 참조
- 선착순 1명
- 이미 예약된 슬롯은 예약 불가

---

### 6.3.4 일정 목록 조회

```http
GET /api/v1/groups/{group_id}/schedules?start_date=2025-11-01&end_date=2025-11-30&type=all
```

**Query Parameters**:
- `start_date`: 조회 시작일 (YYYY-MM-DD)
- `end_date`: 조회 종료일 (YYYY-MM-DD)
- `type`: `all` | `REGULAR` | `MAKEUP` | `CANCELED`

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "schedule_id": "uuid-schedule-123",
        "schedule_type": "REGULAR",
        "title": "정규 수학 수업",
        "start_time": "2025-11-12T15:00:00Z",
        "end_time": "2025-11-12T16:30:00Z",
        "location": "서울 강남구 학원",
        "status": "SCHEDULED",
        "students": [
          {
            "user_id": "uuid-student-1",
            "name": "박민수"
          }
        ]
      }
    ]
  }
}
```

---

### 6.3.5 일정 수정

```http
PATCH /api/v1/schedules/{schedule_id}
```

**요청 본문**:
```json
{
  "start_time": "2025-11-12T16:00:00Z",
  "end_time": "2025-11-12T17:30:00Z",
  "location": "서울 서초구 도서관"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "schedule_id": "uuid-schedule-123",
    "start_time": "2025-11-12T16:00:00Z",
    "end_time": "2025-11-12T17:30:00Z",
    "location": "서울 서초구 도서관",
    "updated_at": "2025-11-12T09:30:00Z"
  }
}
```

**권한**: TEACHER만 가능

---

### 6.3.6 일정 취소

```http
DELETE /api/v1/schedules/{schedule_id}
```

**요청 본문**:
```json
{
  "reason": "개인 사정으로 인한 취소"
}
```

**응답 (204 No Content)**

**권한**: TEACHER만 가능
**비즈니스 규칙**: F-003 참조
- 취소 알림 자동 발송

---

## 6.4 F-004: 출결 관리

### 6.4.1 출결 체크

```http
POST /api/v1/schedules/{schedule_id}/attendance
```

**요청 본문**:
```json
{
  "attendances": [
    {
      "student_id": "uuid-student-1",
      "status": "PRESENT",
      "notes": "수업 잘 들음"
    },
    {
      "student_id": "uuid-student-2",
      "status": "ABSENT",
      "notes": "사전 연락 없이 결석"
    }
  ],
  "checked_at": "2025-11-12T16:30:00Z"
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "schedule_id": "uuid-schedule-123",
    "attendances": [
      {
        "attendance_id": "uuid-att-1",
        "student": {
          "user_id": "uuid-student-1",
          "name": "박민수"
        },
        "status": "PRESENT",
        "notes": "수업 잘 들음",
        "checked_at": "2025-11-12T16:30:00Z"
      }
    ]
  }
}
```

**권한**: TEACHER만 가능
**비즈니스 규칙**: F-004 참조
- status: "PRESENT" | "ABSENT" | "LATE"

---

### 6.4.2 출결 수정

```http
PATCH /api/v1/attendance/{attendance_id}
```

**요청 본문**:
```json
{
  "status": "LATE",
  "notes": "10분 지각"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "attendance_id": "uuid-att-1",
    "status": "LATE",
    "notes": "10분 지각",
    "updated_at": "2025-11-12T09:30:00Z"
  }
}
```

**권한**: TEACHER만 가능

---

### 6.4.3 출결 조회 및 통계

```http
GET /api/v1/groups/{group_id}/attendance/stats?start_date=2025-11-01&end_date=2025-11-30&student_id=uuid-student-1
```

**Query Parameters**:
- `start_date`: 조회 시작일
- `end_date`: 조회 종료일
- `student_id`: 특정 학생 (선택)

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "student": {
      "user_id": "uuid-student-1",
      "name": "박민수"
    },
    "period": {
      "start_date": "2025-11-01",
      "end_date": "2025-11-30"
    },
    "stats": {
      "total_sessions": 12,
      "present": 10,
      "absent": 1,
      "late": 1,
      "attendance_rate": 83.3
    },
    "recent_records": [
      {
        "schedule_id": "uuid-schedule-123",
        "date": "2025-11-12",
        "status": "PRESENT",
        "notes": "수업 잘 들음"
      }
    ]
  }
}
```

---

## 6.5 F-005: 수업 기록 및 진도 관리

### 6.5.1 수업 기록 작성

```http
POST /api/v1/schedules/{schedule_id}/lesson-record
```

**요청 본문**:
```json
{
  "content": "# 수업 내용\n- 이차함수 그래프\n- 최댓값/최솟값 문제 풀이",
  "homework": "문제집 p.45-50",
  "progress_records": [
    {
      "textbook_id": "uuid-textbook-1",
      "page_number": 45,
      "notes": "이차함수 완료"
    }
  ]
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "lesson_record_id": "uuid-record-123",
    "schedule_id": "uuid-schedule-123",
    "content": "# 수업 내용\n- 이차함수 그래프\n- 최댓값/최솟값 문제 풀이",
    "homework": "문제집 p.45-50",
    "progress_records": [
      {
        "progress_id": "uuid-progress-1",
        "textbook": {
          "textbook_id": "uuid-textbook-1",
          "name": "수학의 정석"
        },
        "page_number": 45,
        "notes": "이차함수 완료"
      }
    ],
    "created_at": "2025-11-12T16:30:00Z"
  }
}
```

**권한**: TEACHER만 가능
**비즈니스 규칙**: F-005 참조
- 다중 교재 진도 입력 가능

---

### 6.5.2 교재 등록

```http
POST /api/v1/groups/{group_id}/textbooks
```

**요청 본문**:
```json
{
  "name": "수학의 정석",
  "publisher": "홍성대",
  "total_pages": 500,
  "description": "수능 수학 교재"
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "textbook_id": "uuid-textbook-1",
    "name": "수학의 정석",
    "publisher": "홍성대",
    "total_pages": 500,
    "current_page": 0,
    "progress_percentage": 0.0,
    "created_at": "2025-11-12T09:30:00Z"
  }
}
```

---

### 6.5.3 진도 조회

```http
GET /api/v1/groups/{group_id}/progress?textbook_id=uuid-textbook-1
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "textbook": {
      "textbook_id": "uuid-textbook-1",
      "name": "수학의 정석",
      "total_pages": 500,
      "current_page": 45,
      "progress_percentage": 9.0
    },
    "progress_history": [
      {
        "progress_id": "uuid-progress-1",
        "page_number": 45,
        "lesson_date": "2025-11-12",
        "notes": "이차함수 완료"
      }
    ],
    "chart_data": {
      "labels": ["11/05", "11/12", "11/19"],
      "values": [30, 45, 60]
    }
  }
}
```

---

### 6.5.4 수업 기록 목록 조회

```http
GET /api/v1/groups/{group_id}/lesson-records?page=1&size=20
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "lesson_record_id": "uuid-record-123",
        "schedule": {
          "schedule_id": "uuid-schedule-123",
          "date": "2025-11-12",
          "title": "정규 수학 수업"
        },
        "content_preview": "# 수업 내용\n- 이차함수 그래프...",
        "homework": "문제집 p.45-50",
        "created_at": "2025-11-12T16:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "size": 20,
      "total_pages": 2
    }
  }
}
```

---

## 6.6 F-006: 수업료 정산

### 6.6.1 청구서 생성

```http
POST /api/v1/groups/{group_id}/invoices
```

**요청 본문**:
```json
{
  "billing_period": {
    "start_date": "2025-11-01",
    "end_date": "2025-11-30"
  },
  "student_id": "uuid-student-1",
  "line_items": [
    {
      "description": "11월 정규 수업",
      "quantity": 8,
      "unit_price": 50000
    }
  ],
  "discount": 10000,
  "due_date": "2025-12-05"
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "invoice_id": "uuid-invoice-123",
    "invoice_number": "TUT-2025-001",
    "billing_period": {
      "start_date": "2025-11-01",
      "end_date": "2025-11-30"
    },
    "student": {
      "user_id": "uuid-student-1",
      "name": "박민수"
    },
    "line_items": [
      {
        "description": "11월 정규 수업",
        "quantity": 8,
        "unit_price": 50000,
        "total": 400000
      }
    ],
    "subtotal": 400000,
    "discount": 10000,
    "total_amount": 390000,
    "status": "PENDING",
    "due_date": "2025-12-05",
    "created_at": "2025-11-12T09:30:00Z"
  }
}
```

**권한**: TEACHER만 가능
**비즈니스 규칙**: F-006 참조
- 청구서 번호: TUT-YYYY-NNN (예: TUT-2025-001)

---

### 6.6.2 결제 요청

```http
POST /api/v1/invoices/{invoice_id}/payment-request
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "payment_url": "https://toss.im/...",
    "expires_at": "2025-12-05T23:59:59Z",
    "notification_sent": true
  }
}
```

**비즈니스 규칙**: F-006 참조
- 토스페이먼츠 결제 링크 생성
- 학부모에게 알림 발송

---

### 6.6.3 결제 조회

```http
GET /api/v1/payments/{payment_id}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid-payment-123",
    "invoice": {
      "invoice_id": "uuid-invoice-123",
      "invoice_number": "TUT-2025-001",
      "total_amount": 390000
    },
    "status": "COMPLETED",
    "paid_amount": 390000,
    "paid_at": "2025-12-01T14:30:00Z",
    "payment_method": "CARD",
    "transaction_id": "toss_txn_123"
  }
}
```

---

### 6.6.4 청구서 목록 조회

```http
GET /api/v1/groups/{group_id}/invoices?status=all&page=1&size=20
```

**Query Parameters**:
- `status`: `all` | `PENDING` | `PAID` | `OVERDUE` | `CANCELED`

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "invoice_id": "uuid-invoice-123",
        "invoice_number": "TUT-2025-001",
        "student": {
          "user_id": "uuid-student-1",
          "name": "박민수"
        },
        "total_amount": 390000,
        "status": "PENDING",
        "due_date": "2025-12-05",
        "created_at": "2025-11-12T09:30:00Z"
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "size": 20,
      "total_pages": 1
    }
  }
}
```

---

### 6.6.5 영수증 다운로드

```http
GET /api/v1/invoices/{invoice_id}/receipt
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "receipt_url": "https://s3.amazonaws.com/.../receipt-TUT-2025-001.pdf",
    "expires_at": "2025-11-19T09:30:00Z"
  }
}
```

**비즈니스 규칙**: F-006 참조
- PDF 형식 영수증 생성 (ReportLab)
- S3에 임시 저장 (7일 만료)

---

## 6.7 F-007: 기본 프로필 및 설정

### 6.7.1 프로필 조회

```http
GET /api/v1/users/me
```

**헤더**:
```
Authorization: Bearer <access_token>
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid-123",
    "email": "teacher@example.com",
    "name": "김선생",
    "phone": "010-1234-5678",
    "role": "TEACHER",
    "profile_image_url": "https://s3.amazonaws.com/.../profile.jpg",
    "profile": {
      "subjects": ["수학", "영어"],
      "school": "서울대학교",
      "bio": "10년 경력의 수학 선생님입니다."
    },
    "created_at": "2025-11-01T00:00:00Z",
    "updated_at": "2025-11-12T09:30:00Z"
  }
}
```

---

### 6.7.2 프로필 수정

```http
PATCH /api/v1/users/me
```

**요청 본문**:
```json
{
  "name": "김영수",
  "phone": "010-9876-5432",
  "profile": {
    "bio": "15년 경력의 수학 선생님입니다."
  }
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid-123",
    "name": "김영수",
    "phone": "010-9876-5432",
    "profile": {
      "bio": "15년 경력의 수학 선생님입니다."
    },
    "updated_at": "2025-11-12T09:30:00Z"
  }
}
```

---

### 6.7.3 프로필 사진 업로드

```http
POST /api/v1/users/me/profile-image
```

**Content-Type**: `multipart/form-data`

**요청**:
```
file: [이미지 파일]
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "profile_image_url": "https://s3.amazonaws.com/.../profile-uuid-123.jpg",
    "uploaded_at": "2025-11-12T09:30:00Z"
  }
}
```

**비즈니스 규칙**: F-007 참조
- 최대 5MB
- jpg, png만 허용
- 자동 리사이즈 (300x300)

---

### 6.7.4 알림 설정 조회

```http
GET /api/v1/users/me/notification-settings
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "push_enabled": true,
    "email_enabled": true,
    "categories": {
      "schedule": true,
      "attendance": true,
      "payment": true,
      "group": false
    }
  }
}
```

---

### 6.7.5 알림 설정 변경

```http
PATCH /api/v1/users/me/notification-settings
```

**요청 본문**:
```json
{
  "push_enabled": false,
  "categories": {
    "payment": false
  }
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "push_enabled": false,
    "email_enabled": true,
    "categories": {
      "schedule": true,
      "attendance": true,
      "payment": false,
      "group": false
    },
    "updated_at": "2025-11-12T09:30:00Z"
  }
}
```

---

### 6.7.6 비밀번호 변경

```http
POST /api/v1/users/me/change-password
```

**요청 본문**:
```json
{
  "current_password": "SecurePass123!",
  "new_password": "NewSecurePass456!"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "비밀번호가 성공적으로 변경되었습니다.",
    "changed_at": "2025-11-12T09:30:00Z"
  }
}
```

---

### 6.7.7 로그인 기록 조회

```http
GET /api/v1/users/me/login-history?page=1&size=20
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "login_id": "uuid-login-123",
        "login_at": "2025-11-12T09:00:00Z",
        "ip_address": "192.168.1.1",
        "device_info": {
          "device_type": "mobile",
          "os": "iOS",
          "app_version": "1.0.0"
        },
        "location": "서울, 대한민국"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "size": 20,
      "total_pages": 3
    }
  }
}
```

**비즈니스 규칙**: F-007 참조
- 최근 100개 기록만 유지

---

### 6.7.8 특정 기기 로그아웃

```http
DELETE /api/v1/users/me/sessions/{session_id}
```

**응답 (204 No Content)**

---

## 6.8 F-008: 필수 알림 시스템

### 6.8.1 알림 목록 조회

```http
GET /api/v1/notifications?category=all&status=all&page=1&size=20
```

**Query Parameters**:
- `category`: `all` | `schedule` | `attendance` | `payment` | `group`
- `status`: `all` | `unread` | `read`

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "notification_id": "uuid-notif-123",
        "category": "schedule",
        "title": "내일 수업이 있습니다",
        "message": "11/13 15:00 - 정규 수학 수업",
        "status": "unread",
        "created_at": "2025-11-12T09:00:00Z",
        "related_resource": {
          "type": "schedule",
          "id": "uuid-schedule-123"
        }
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "size": 20,
      "total_pages": 3
    },
    "unread_count": 12
  }
}
```

---

### 6.8.2 알림 읽음 처리

```http
PATCH /api/v1/notifications/{notification_id}/read
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "notification_id": "uuid-notif-123",
    "status": "read",
    "read_at": "2025-11-12T09:30:00Z"
  }
}
```

---

### 6.8.3 알림 일괄 읽음 처리

```http
POST /api/v1/notifications/read-all
```

**요청 본문**:
```json
{
  "category": "schedule"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "marked_count": 8,
    "remaining_unread": 4
  }
}
```

---

### 6.8.4 알림 삭제

```http
DELETE /api/v1/notifications/{notification_id}
```

**응답 (204 No Content)**

---

### 6.8.5 FCM 토큰 등록

```http
POST /api/v1/notifications/fcm-token
```

**요청 본문**:
```json
{
  "fcm_token": "fcm_token_123...",
  "device_info": {
    "device_type": "mobile",
    "os": "iOS",
    "app_version": "1.0.0"
  }
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token_id": "uuid-token-123",
    "registered_at": "2025-11-12T09:30:00Z"
  }
}
```

---

### 6.8.6 FCM 토큰 삭제

```http
DELETE /api/v1/notifications/fcm-token
```

**요청 본문**:
```json
{
  "fcm_token": "fcm_token_123..."
}
```

**응답 (204 No Content)**

**비즈니스 규칙**: F-008 참조
- 알림은 90일 후 자동 삭제

---

## 7. WebHook

### 7.1 토스페이먼츠 결제 완료 WebHook

```http
POST /api/v1/webhooks/toss-payment
```

**헤더**:
```
Content-Type: application/json
X-Toss-Signature: <signature>
```

**요청 본문**:
```json
{
  "eventType": "PAYMENT_COMPLETED",
  "data": {
    "paymentKey": "toss_payment_key_123",
    "orderId": "uuid-invoice-123",
    "amount": 390000,
    "status": "DONE",
    "requestedAt": "2025-12-01T14:30:00Z",
    "approvedAt": "2025-12-01T14:30:05Z"
  }
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "message": "WebHook processed successfully"
}
```

**처리 로직**:
1. 서명 검증 (X-Toss-Signature)
2. 청구서 상태 업데이트 (PENDING → PAID)
3. 결제 내역 저장
4. 선생님/학부모에게 알림 발송

---

## 8. 공통 스키마

### 8.1 User

```json
{
  "user_id": "uuid",
  "email": "string",
  "name": "string",
  "phone": "string",
  "role": "TEACHER | STUDENT | PARENT",
  "profile_image_url": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

### 8.2 Group

```json
{
  "group_id": "uuid",
  "name": "string",
  "subject": "string",
  "level": "string",
  "fee_per_session": "number",
  "session_duration": "number",
  "description": "string",
  "teacher": "User",
  "members": ["User"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

### 8.3 Schedule

```json
{
  "schedule_id": "uuid",
  "group_id": "uuid",
  "schedule_type": "REGULAR | MAKEUP | CANCELED",
  "title": "string",
  "start_time": "datetime",
  "end_time": "datetime",
  "location": "string",
  "recurrence_rule": {
    "type": "daily | weekly | monthly | none",
    "days": [0, 1, 2, 3, 4, 5, 6],
    "end_date": "date"
  },
  "status": "SCHEDULED | COMPLETED | CANCELED",
  "students": ["User"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

### 8.4 Attendance

```json
{
  "attendance_id": "uuid",
  "schedule_id": "uuid",
  "student_id": "uuid",
  "status": "PRESENT | ABSENT | LATE",
  "notes": "string",
  "checked_at": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

### 8.5 Invoice

```json
{
  "invoice_id": "uuid",
  "invoice_number": "string",
  "group_id": "uuid",
  "student_id": "uuid",
  "billing_period": {
    "start_date": "date",
    "end_date": "date"
  },
  "line_items": [
    {
      "description": "string",
      "quantity": "number",
      "unit_price": "number",
      "total": "number"
    }
  ],
  "subtotal": "number",
  "discount": "number",
  "total_amount": "number",
  "status": "PENDING | PAID | OVERDUE | CANCELED",
  "due_date": "date",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

### 8.6 Notification

```json
{
  "notification_id": "uuid",
  "user_id": "uuid",
  "category": "schedule | attendance | payment | group",
  "title": "string",
  "message": "string",
  "status": "unread | read",
  "related_resource": {
    "type": "schedule | invoice | group",
    "id": "uuid"
  },
  "created_at": "datetime",
  "read_at": "datetime"
}
```

---

## 9. 버전 관리

### 9.1 버전 정책

- **현재 버전**: v1.0
- **지원 정책**: 
  - 최신 버전 + 이전 1개 버전 지원
  - 예: v2.0 출시 시 v1.0은 6개월간 유지
  
### 9.2 Breaking Changes

Breaking Changes 발생 시:
1. 메이저 버전 업데이트 (v1 → v2)
2. 최소 3개월 전 공지
3. 마이그레이션 가이드 제공

### 9.3 Deprecation

Deprecated API는:
- 응답 헤더에 `X-API-Deprecated: true` 포함
- 6개월 후 제거 예정 공지

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| v1.0 | 2025-11-11 | 초안 작성 - 8개 기능 API 정의 | AI Assistant |
| v1.0 | 2025-11-12 | UTF-8 인코딩 문제 해결, 파일 재생성 | AI Assistant |

---

**작성자 노트**:

이 API 명세서는 WeTee 플랫폼의 프론트엔드-백엔드 간 계약서입니다. 

**주요 특징**:
- ✅ RESTful API 원칙 준수
- ✅ JWT 기반 인증 및 Rate Limiting
- ✅ 명확한 에러 코드 체계
- ✅ 페이지네이션 표준화
- ✅ 공통 스키마 정의
- ✅ WebHook 지원 (토스페이먼츠)

**개발 가이드**:
1. FastAPI의 자동 Swagger 문서 활용
2. Pydantic 모델로 요청/응답 검증
3. 모든 엔드포인트에 권한 데코레이터 적용
4. 에러 처리는 공통 미들웨어에서 관리

**문서 정리 원칙 준수**:
- ✅ 중복 금지: API 상세는 이 문서에만, 기능 명세서는 참조만
- ✅ 추상화 레벨: "How - Interface"만 다룸
- ✅ 영향 범위 최소화: API 변경 시 이 문서만 수정
