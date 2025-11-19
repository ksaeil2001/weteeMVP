# API 타임아웃 테스트 가이드

## 개요

frontend/src/lib/apiClient.ts에 API 요청 타임아웃 처리가 추가되었습니다.

## 주요 변경사항

### 1. 타임아웃 설정
- 기본 타임아웃: 30초 (DEFAULT_TIMEOUT = 30000ms)
- AbortController를 사용한 타임아웃 구현
- 개별 요청에서 timeout 파라미터로 override 가능

### 2. 에러 타입 구분
- **타임아웃 에러 (AbortError)**
  - status: 408
  - code: 'TIMEOUT'
  - 메시지: "요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요. (30초)"

- **네트워크 에러 (TypeError)**
  - status: 0
  - code: 'NETWORK_ERROR'
  - 메시지: "네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요."

### 3. 적용 범위
모든 API 호출이 자동으로 타임아웃 처리됨:
- authApi.ts (로그인, 회원가입 등)
- api/groups.ts (그룹 관리)
- api/schedules.ts (일정 관리)
- api/attendance.ts (출결 관리)
- api/lessons.ts (수업 기록)
- api/billing.ts (정산)
- api/notifications.ts (알림)
- api/settings.ts (설정)

## 브라우저에서 타임아웃 테스트 방법

### 방법 1: 개발자 도구로 네트워크 속도 조절

1. Chrome/Edge 개발자 도구 열기 (F12)
2. Network 탭 선택
3. Throttling 드롭다운에서 "Slow 3G" 또는 "Offline" 선택
4. 회원가입이나 로그인 시도
5. 30초 후 타임아웃 에러 메시지 확인

### 방법 2: 백엔드에 인위적 지연 추가

backend/app/routers/auth.py 또는 다른 라우터에 임시 지연 추가:

```python
import asyncio

@router.post('/login')
async def login(...):
    # 타임아웃 테스트를 위한 35초 지연
    await asyncio.sleep(35)
    # ... 나머지 로직
```

### 방법 3: 백엔드를 중지하고 네트워크 에러 테스트

1. 백엔드 서버 중지 (Ctrl+C)
2. 프론트엔드에서 로그인 시도
3. 네트워크 에러 메시지 확인: "네트워크 연결에 실패했습니다."

## 예상 동작

### 정상 응답 (30초 이내)
```typescript
const user = await loginWithEmail({ email, password });
// 정상적으로 사용자 데이터 반환
```

### 타임아웃 발생 (30초 초과)
```typescript
try {
  const user = await loginWithEmail({ email, password });
} catch (error) {
  if (isApiError(error) && error.code === 'TIMEOUT') {
    // 타임아웃 에러 처리
    console.error('요청 시간이 초과되었습니다.');
  }
}
```

### 네트워크 에러 (서버 연결 실패)
```typescript
try {
  const user = await loginWithEmail({ email, password });
} catch (error) {
  if (isApiError(error) && error.code === 'NETWORK_ERROR') {
    // 네트워크 에러 처리
    console.error('네트워크 연결에 실패했습니다.');
  }
}
```

## 개별 요청에서 타임아웃 변경하기

특정 요청에서 다른 타임아웃 값이 필요한 경우:

```typescript
// 60초 타임아웃으로 API 호출
const data = await apiRequest<UserData>(
  '/auth/login',
  {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  },
  true, // retry
  60000 // 60초 타임아웃
);
```

## 주의사항

1. **타임아웃은 네트워크 요청 전체에 적용됨**
   - 요청 전송 + 서버 처리 + 응답 수신 모두 포함

2. **토큰 갱신 로직과 함께 동작**
   - 401 에러 발생 시 토큰 갱신 후 재시도
   - 재시도 시에도 동일한 타임아웃 적용

3. **개발 환경에서 타임아웃 에러 확인**
   - 콘솔에 상세 에러 정보 출력 (개발 모드)
   - 프로덕션에서는 사용자 친화적 메시지만 표시

## 관련 파일

- `frontend/src/lib/apiClient.ts` - 타임아웃 로직 구현
- `frontend/src/lib/authApi.ts` - 인증 API (타임아웃 자동 적용)
- `frontend/src/lib/api/*.ts` - 모든 API 모듈 (타임아웃 자동 적용)
