# 구현 프롬프트 #01: 수업 기록 작성 페이지 ⭐⭐⭐

**우선순위**: 최고 (Critical)
**예상 소요 시간**: 2-3일
**난이도**: 중간
**담당 기능**: F-005 수업 기록 및 진도 관리

---

## 1. 목표

선생님이 수업 종료 후 다음 항목을 입력할 수 있는 페이지를 신규로 구현합니다:
- 오늘 배운 내용 (텍스트 에디터)
- 진도 (교재, 시작 페이지, 끝 페이지)
- 학생 상태 (이해도, 집중도, 참여도)
- 숙제 (내용, 제출 기한)
- 학부모 공유 여부

---

## 2. 관련 문서

**필수 참조**:
- `/F-005_수업_기록_및_진도_관리.md` (시나리오 1: 선생님이 수업 직후 기록 작성)
- `/UX_UI_설계서_v2.0_개발자용.md` (S-022: 수업 기록 작성 화면)
- `/API_명세서.md` (POST /api/v1/lesson-records)
- `/데이터베이스_설계서.md` (lesson_records, progress_records 테이블)

---

## 3. 페이지 경로 및 구조

### 3.1 파일 경로
```
frontend/src/app/(main)/lessons/new/page.tsx
```

### 3.2 라우팅
- URL: `/lessons/new`
- 쿼리 파라미터: `scheduleId` (필수)
  - 예: `/lessons/new?scheduleId=abc123`
  - 해당 수업의 일정 정보를 가져와서 미리 채움

### 3.3 접근 권한
- 선생님만 접근 가능
- 학생/학부모가 접근 시 403 에러 또는 메인 화면으로 리다이렉트

---

## 4. UI 요구사항

### 4.1 헤더
```tsx
// Header 컴포넌트
- Title: "수업 기록 작성"
- Left Button: "< 취소" (뒤로가기 + 확인 모달)
- Right Button: "저장" (폼 제출)
```

### 4.2 폼 필드 (순서대로)

#### 4.2.1 수업 정보 (읽기 전용, 회색 배경)
```tsx
<div className="bg-gray-50 p-4 rounded-lg mb-6">
  <p className="text-sm text-gray-600">수업 날짜</p>
  <p className="font-semibold">{formattedDate}</p>

  <p className="text-sm text-gray-600 mt-2">수업 시간</p>
  <p className="font-semibold">{startTime} - {endTime}</p>

  <p className="text-sm text-gray-600 mt-2">학생</p>
  <p className="font-semibold">{studentName}</p>
</div>
```

#### 4.2.2 오늘 배운 내용 (필수)
```tsx
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    오늘 배운 내용 *
  </label>
  <textarea
    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
    rows={6}
    placeholder="예: 삼각함수 sin, cos, tan의 정의와 예제 풀이&#10;- sin θ = 대변/빗변&#10;- 예제 3개 풀이&#10;- 학생이 cos의 개념을 잘 이해함"
    required
  />
  <p className="text-xs text-gray-500 mt-1">
    학부모님이 보실 수 있습니다. 구체적으로 작성해주세요.
  </p>
</div>
```

#### 4.2.3 진도 (선택)
```tsx
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    진도
  </label>

  {/* 교재 선택 */}
  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3">
    <option value="">교재 선택</option>
    <option value="math-concept">수학의 정석 (기본편)</option>
    <option value="math-exercises">수학의 정석 (실력편)</option>
    {/* API에서 가져온 교재 목록 */}
  </select>

  {/* 새 교재 추가 버튼 */}
  <button type="button" className="text-sm text-blue-600 mb-3">
    + 새 교재 추가
  </button>

  {/* 페이지 범위 */}
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="text-xs text-gray-600">시작 페이지</label>
      <input
        type="number"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        placeholder="45"
      />
    </div>
    <div>
      <label className="text-xs text-gray-600">끝 페이지</label>
      <input
        type="number"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        placeholder="52"
      />
    </div>
  </div>
</div>
```

#### 4.2.4 학생 상태 (선택)
```tsx
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-3">
    학생 상태
  </label>

  {/* 이해도 */}
  <div className="mb-4">
    <p className="text-sm text-gray-600 mb-2">이해도</p>
    <div className="flex gap-2">
      {['매우 낮음', '낮음', '보통', '높음', '매우 높음'].map((level, idx) => (
        <button
          key={level}
          type="button"
          className={`flex-1 py-2 rounded-lg border ${
            understanding === idx + 1
              ? 'bg-blue-100 border-blue-500 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700'
          }`}
          onClick={() => setUnderstanding(idx + 1)}
        >
          {level}
        </button>
      ))}
    </div>
  </div>

  {/* 집중도 */}
  <div className="mb-4">
    <p className="text-sm text-gray-600 mb-2">집중도</p>
    <div className="flex gap-2">
      {['매우 낮음', '낮음', '보통', '높음', '매우 높음'].map((level, idx) => (
        <button
          key={level}
          type="button"
          className={`flex-1 py-2 rounded-lg border ${
            concentration === idx + 1
              ? 'bg-green-100 border-green-500 text-green-700'
              : 'bg-white border-gray-300 text-gray-700'
          }`}
          onClick={() => setConcentration(idx + 1)}
        >
          {level}
        </button>
      ))}
    </div>
  </div>

  {/* 참여도 */}
  <div className="mb-4">
    <p className="text-sm text-gray-600 mb-2">참여도</p>
    <div className="flex gap-2">
      {['매우 낮음', '낮음', '보통', '높음', '매우 높음'].map((level, idx) => (
        <button
          key={level}
          type="button"
          className={`flex-1 py-2 rounded-lg border ${
            participation === idx + 1
              ? 'bg-purple-100 border-purple-500 text-purple-700'
              : 'bg-white border-gray-300 text-gray-700'
          }`}
          onClick={() => setParticipation(idx + 1)}
        >
          {level}
        </button>
      ))}
    </div>
  </div>

  {/* 추가 메모 */}
  <div>
    <label className="text-sm text-gray-600">추가 메모 (선택)</label>
    <textarea
      className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-2"
      rows={3}
      placeholder="예: 오늘 평소보다 피곤해 보였음. 다음 시간에 복습 필요"
    />
  </div>
</div>
```

#### 4.2.5 숙제 (선택)
```tsx
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    숙제
  </label>

  <textarea
    className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3"
    rows={4}
    placeholder="예: 수학의 정석 p.45-52 복습&#10;문제집 3-1번부터 3-10번까지 풀어오기"
  />

  {/* 제출 기한 */}
  <div>
    <label className="text-xs text-gray-600">제출 기한</label>
    <input
      type="date"
      className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-2"
      min={new Date().toISOString().split('T')[0]}
    />
  </div>
</div>
```

#### 4.2.6 학부모 공유 (필수, 기본값: 체크됨)
```tsx
<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <label className="flex items-center">
    <input
      type="checkbox"
      className="w-5 h-5 text-blue-600"
      checked={shareWithParent}
      onChange={(e) => setShareWithParent(e.target.checked)}
    />
    <span className="ml-3 text-sm font-medium text-gray-900">
      학부모님께 이 기록을 공유합니다
    </span>
  </label>
  <p className="text-xs text-gray-600 mt-2 ml-8">
    체크 해제 시 학부모님이 이 수업 기록을 볼 수 없습니다.
  </p>
</div>
```

### 4.3 하단 버튼
```tsx
<div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
  <button
    type="submit"
    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg"
  >
    저장하기
  </button>
</div>
```

---

## 5. 상태 관리

### 5.1 useState 구조
```tsx
const [formData, setFormData] = useState({
  scheduleId: '',
  content: '',              // 오늘 배운 내용 (필수)
  textbookId: null,         // 교재 ID (선택)
  startPage: null,          // 시작 페이지 (선택)
  endPage: null,            // 끝 페이지 (선택)
  understanding: 3,         // 이해도 (1-5, 기본값 3)
  concentration: 3,         // 집중도 (1-5, 기본값 3)
  participation: 3,         // 참여도 (1-5, 기본값 3)
  studentNotes: '',         // 학생 상태 추가 메모 (선택)
  homework: '',             // 숙제 내용 (선택)
  homeworkDueDate: null,    // 숙제 제출 기한 (선택)
  shareWithParent: true,    // 학부모 공유 여부 (기본값 true)
});

const [isLoading, setIsLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

---

## 6. API 연동

### 6.1 GET 요청: 수업 정보 가져오기
```tsx
// 페이지 로드 시 scheduleId로 수업 정보 조회
useEffect(() => {
  const fetchScheduleInfo = async () => {
    try {
      const scheduleId = searchParams.get('scheduleId');
      if (!scheduleId) {
        throw new Error('수업 ID가 필요합니다');
      }

      const response = await fetch(`/api/v1/schedules/${scheduleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('수업 정보를 불러올 수 없습니다');

      const data = await response.json();
      setScheduleInfo(data);
      setFormData(prev => ({ ...prev, scheduleId }));
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  fetchScheduleInfo();
}, [searchParams]);
```

### 6.2 POST 요청: 수업 기록 저장
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage(null);
  setIsLoading(true);

  try {
    // 필수 필드 검증
    if (!formData.content.trim()) {
      throw new Error('오늘 배운 내용을 입력해주세요');
    }

    // API 호출
    const response = await fetch('/api/v1/lesson-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        schedule_id: formData.scheduleId,
        content: formData.content,
        textbook_id: formData.textbookId,
        start_page: formData.startPage,
        end_page: formData.endPage,
        understanding_level: formData.understanding,
        concentration_level: formData.concentration,
        participation_level: formData.participation,
        student_notes: formData.studentNotes,
        homework: formData.homework,
        homework_due_date: formData.homeworkDueDate,
        share_with_parent: formData.shareWithParent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '수업 기록 저장에 실패했습니다');
    }

    const data = await response.json();

    // 성공 시 토스트 메시지 + 수업 기록 목록으로 이동
    toast.success('수업 기록이 저장되었습니다');
    router.push(`/lessons/${data.id}`); // 방금 생성한 기록 상세 페이지로

  } catch (error) {
    setErrorMessage(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

---

## 7. 에러 처리

### 7.1 검증 에러
```tsx
// 클라이언트 사이드 검증
const validate = () => {
  if (!formData.content.trim()) {
    return '오늘 배운 내용을 입력해주세요';
  }

  if (formData.startPage && formData.endPage) {
    if (formData.startPage > formData.endPage) {
      return '시작 페이지가 끝 페이지보다 클 수 없습니다';
    }
  }

  if (formData.homework && !formData.homeworkDueDate) {
    return '숙제를 입력하셨다면 제출 기한도 설정해주세요';
  }

  return null;
};
```

### 7.2 API 에러
```tsx
// 에러 메시지 표시
{errorMessage && (
  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-sm text-red-600">{errorMessage}</p>
  </div>
)}
```

---

## 8. 사용자 경험 (UX) 개선사항

### 8.1 임시 저장 (선택 구현)
```tsx
// localStorage에 자동 저장 (5초마다)
useEffect(() => {
  const timer = setInterval(() => {
    if (formData.content) {
      localStorage.setItem('lessonRecordDraft', JSON.stringify(formData));
    }
  }, 5000);

  return () => clearInterval(timer);
}, [formData]);

// 페이지 로드 시 임시 저장본 복구
useEffect(() => {
  const draft = localStorage.getItem('lessonRecordDraft');
  if (draft) {
    const shouldRestore = confirm('이전에 작성 중이던 내용이 있습니다. 복구하시겠습니까?');
    if (shouldRestore) {
      setFormData(JSON.parse(draft));
    } else {
      localStorage.removeItem('lessonRecordDraft');
    }
  }
}, []);
```

### 8.2 취소 시 확인 모달
```tsx
const handleCancel = () => {
  if (formData.content) {
    const shouldExit = confirm('작성 중인 내용이 있습니다. 정말로 나가시겠습니까?');
    if (shouldExit) {
      localStorage.removeItem('lessonRecordDraft');
      router.back();
    }
  } else {
    router.back();
  }
};
```

### 8.3 로딩 상태
```tsx
{isLoading && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-700">저장 중...</p>
    </div>
  </div>
)}
```

---

## 9. 접근 방법 (다른 페이지에서 이동)

### 9.1 수업 일정 상세 페이지에서
```tsx
// /schedule/[scheduleId]/page.tsx
<button
  onClick={() => router.push(`/lessons/new?scheduleId=${scheduleId}`)}
  className="w-full py-3 bg-blue-600 text-white rounded-lg"
>
  📝 수업 기록 작성하기
</button>
```

### 9.2 오늘의 수업 목록에서
```tsx
// /(main)/page.tsx (대시보드)
<LessonCard
  lesson={lesson}
  actions={
    <button onClick={() => router.push(`/lessons/new?scheduleId=${lesson.id}`)}>
      기록 작성
    </button>
  }
/>
```

---

## 10. 검증 방법

### 10.1 기능 테스트
1. 로그인 후 `/lessons/new?scheduleId=test123` 접근
2. 모든 필드 입력 후 "저장하기" 클릭
3. 네트워크 탭에서 POST 요청 확인
4. 성공 시 수업 기록 상세 페이지로 이동 확인

### 10.2 에러 케이스
1. 필수 필드 미입력 시 검증 메시지 확인
2. API 실패 시 에러 메시지 표시 확인
3. 학생/학부모 계정으로 접근 시 권한 오류 확인

### 10.3 UX 검증
1. 임시 저장 기능 확인 (페이지 새로고침 후 복구)
2. 취소 버튼 클릭 시 확인 모달 표시
3. 로딩 스피너 표시 확인

---

## 11. 추가 개선 아이디어 (v2)

1. **음성 입력**: "오늘 배운 내용"을 음성으로 입력
2. **템플릿**: 자주 사용하는 문구 템플릿 저장
3. **사진 첨부**: 칠판 사진, 숙제 사진 첨부 기능
4. **이전 기록 참조**: 지난주 수업 내용 빠르게 확인

---

## 12. 완료 기준 (Definition of Done)

- [ ] `/lessons/new` 페이지 파일 생성
- [ ] 모든 UI 필드 구현 (오늘 배운 내용, 진도, 학생 상태, 숙제)
- [ ] GET /api/v1/schedules/:id 연동 (수업 정보 로드)
- [ ] POST /api/v1/lesson-records 연동 (기록 저장)
- [ ] 필수 필드 검증 구현
- [ ] 에러 처리 및 메시지 표시
- [ ] 로딩 상태 UI
- [ ] 취소 시 확인 모달
- [ ] 임시 저장 기능 (선택)
- [ ] 선생님 권한 체크
- [ ] 다른 페이지에서 이 페이지로 이동하는 버튼 추가
- [ ] 모바일 반응형 확인
- [ ] 실제 데이터로 저장 및 조회 테스트 완료

---

**구현 시작 전 확인사항**:
1. F-005_수업_기록_및_진도_관리.md 전체 읽기
2. API_명세서.md에서 POST /api/v1/lesson-records 엔드포인트 확인
3. 백엔드 API가 준비되어 있는지 확인 (없으면 Mock 데이터로 먼저 구현)
