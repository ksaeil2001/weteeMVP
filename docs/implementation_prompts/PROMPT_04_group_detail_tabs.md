# 구현 프롬프트 #04: 그룹 상세 화면 6개 탭 기능 완성 ⭐

**우선순위**: 중간-높음
**예상 소요 시간**: 2-3일
**난이도**: 중간
**담당 기능**: F-002 과외 그룹 생성 및 매칭

---

## 1. 목표

현재 탭 구조만 있고 내용이 미완성인 그룹 상세 화면(`/groups/[groupId]`)에 **6개 탭의 실제 콘텐츠**를 구현합니다.

**6개 탭**:
1. **개요** (Overview) - 그룹 기본 정보, 다가오는 수업
2. **학생** (Students) - 학생 목록, 초대 관리
3. **일정** (Schedule) - 정규 수업 일정, 보강 일정
4. **출결** (Attendance) - 학생별 출결 현황
5. **진도** (Progress) - 교재별 진도 추적
6. **정산** (Billing) - 수업료 정산 현황

---

## 2. 관련 문서

**필수 참조**:
- `/F-002_과외_그룹_생성_및_매칭.md` (시나리오 4: 그룹 상세 조회)
- `/UX_UI_설계서_v2.0_개발자용.md` (S-008: 그룹 상세 화면)
- `/API_명세서.md` (GET /api/v1/groups/{id})
- `/데이터베이스_설계서.md` (groups, group_members 테이블)

---

## 3. 파일 구조

### 3.1 수정할 파일
```
frontend/src/app/(main)/groups/[groupId]/page.tsx (기존 파일 개선)
```

### 3.2 새로 만들 파일
```
frontend/src/components/groups/tabs/OverviewTab.tsx
frontend/src/components/groups/tabs/StudentsTab.tsx
frontend/src/components/groups/tabs/ScheduleTab.tsx
frontend/src/components/groups/tabs/AttendanceTab.tsx
frontend/src/components/groups/tabs/ProgressTab.tsx
frontend/src/components/groups/tabs/BillingTab.tsx
```

---

## 4. 전체 페이지 구조

### 4.1 메인 페이지 (탭 전환 로직)

```tsx
// app/(main)/groups/[groupId]/page.tsx

'use client';

import { useState, useEffect } from 'use';
import { useParams } from 'next/navigation';
import OverviewTab from '@/components/groups/tabs/OverviewTab';
import StudentsTab from '@/components/groups/tabs/StudentsTab';
import ScheduleTab from '@/components/groups/tabs/ScheduleTab';
import AttendanceTab from '@/components/groups/tabs/AttendanceTab';
import ProgressTab from '@/components/groups/tabs/ProgressTab';
import BillingTab from '@/components/groups/tabs/BillingTab';

type TabType = 'overview' | 'students' | 'schedule' | 'attendance' | 'progress' | 'billing';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [groupData, setGroupData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 그룹 데이터 로드
  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('그룹 정보를 불러올 수 없습니다');

      const data = await response.json();
      setGroupData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (!groupData) {
    return <div>그룹을 찾을 수 없습니다</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold">{groupData.name}</h1>
        <p className="text-sm text-gray-600">{groupData.subject} · {groupData.studentCount}명</p>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: '개요', icon: '📊' },
            { id: 'students', label: '학생', icon: '👨‍🎓' },
            { id: 'schedule', label: '일정', icon: '📅' },
            { id: 'attendance', label: '출결', icon: '✅' },
            { id: 'progress', label: '진도', icon: '📚' },
            { id: 'billing', label: '정산', icon: '💳' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-shrink-0 px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-4">
        {activeTab === 'overview' && <OverviewTab groupId={groupId} groupData={groupData} />}
        {activeTab === 'students' && <StudentsTab groupId={groupId} groupData={groupData} />}
        {activeTab === 'schedule' && <ScheduleTab groupId={groupId} groupData={groupData} />}
        {activeTab === 'attendance' && <AttendanceTab groupId={groupId} groupData={groupData} />}
        {activeTab === 'progress' && <ProgressTab groupId={groupId} groupData={groupData} />}
        {activeTab === 'billing' && <BillingTab groupId={groupId} groupData={groupData} />}
      </div>
    </div>
  );
}
```

---

## 5. 각 탭 상세 구현

### 5.1 개요 탭 (OverviewTab)

```tsx
// components/groups/tabs/OverviewTab.tsx

'use client';

import { useEffect, useState } from 'react';

interface OverviewTabProps {
  groupId: string;
  groupData: any;
}

export default function OverviewTab({ groupId, groupData }: OverviewTabProps) {
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    fetchUpcomingLessons();
    fetchRecentRecords();
  }, [groupId]);

  const fetchUpcomingLessons = async () => {
    // TODO: API 호출
  };

  const fetchRecentRecords = async () => {
    // TODO: API 호출
  };

  return (
    <div className="space-y-6">
      {/* 그룹 기본 정보 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">그룹 정보</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-600">그룹명</dt>
            <dd className="font-medium">{groupData.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">과목</dt>
            <dd className="font-medium">{groupData.subject}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">학생 수</dt>
            <dd className="font-medium">{groupData.studentCount}명</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">생성일</dt>
            <dd className="font-medium">
              {new Date(groupData.createdAt).toLocaleDateString('ko-KR')}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <dt className="text-sm text-gray-600 mb-2">설명</dt>
          <dd className="text-gray-800">{groupData.description || '설명 없음'}</dd>
        </div>
      </section>

      {/* 다가오는 수업 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">다가오는 수업</h3>
        {upcomingLessons.length === 0 ? (
          <p className="text-gray-500 text-center py-8">예정된 수업이 없습니다</p>
        ) : (
          <div className="space-y-3">
            {upcomingLessons.map((lesson: any) => (
              <div
                key={lesson.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{lesson.subject}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(lesson.startTime).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {lesson.type === 'regular' ? '정규' : '보강'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 최근 수업 기록 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">최근 수업 기록</h3>
        {recentRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-8">최근 수업 기록이 없습니다</p>
        ) : (
          <div className="space-y-3">
            {recentRecords.map((record: any) => (
              <div
                key={record.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium">{record.date}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {record.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 통계 요약 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">이번 달 통계</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {groupData.stats?.completedLessons || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">완료된 수업</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {groupData.stats?.attendanceRate || 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">출석률</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {groupData.stats?.averageProgress || 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">평균 진도</p>
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

### 5.2 학생 탭 (StudentsTab)

```tsx
// components/groups/tabs/StudentsTab.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StudentsTabProps {
  groupId: string;
  groupData: any;
}

export default function StudentsTab({ groupId, groupData }: StudentsTabProps) {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchInviteCodes();
  }, [groupId]);

  const fetchStudents = async () => {
    // GET /api/v1/groups/{groupId}/members?role=STUDENT
  };

  const fetchInviteCodes = async () => {
    // GET /api/v1/groups/{groupId}/invite-codes
  };

  const handleGenerateInviteCode = async (roleType: 'STUDENT' | 'PARENT') => {
    // POST /api/v1/invite-codes
  };

  return (
    <div className="space-y-6">
      {/* 학생 목록 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">학생 목록 ({students.length}명)</h3>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 학생 초대
          </button>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">아직 학생이 없습니다</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              첫 번째 학생 초대하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student: any) => (
              <div
                key={student.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/students/${student.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {student.profileImage ? (
                        <img src={student.profileImage} alt={student.name} className="rounded-full" />
                      ) : (
                        <span className="text-xl">👨‍🎓</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">
                        {student.grade} · {student.school || '학교 미등록'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">출석률</p>
                    <p className="font-semibold text-green-600">
                      {student.attendanceRate || 0}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 초대 코드 관리 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">초대 코드</h3>

        {/* 코드 생성 버튼 */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleGenerateInviteCode('STUDENT')}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <span className="text-green-600 font-medium">+ 학생 초대 코드 생성</span>
          </button>
          <button
            onClick={() => handleGenerateInviteCode('PARENT')}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <span className="text-purple-600 font-medium">+ 학부모 초대 코드 생성</span>
          </button>
        </div>

        {/* 생성된 코드 목록 */}
        {inviteCodes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium mb-3">생성된 초대 코드</h4>
            {inviteCodes.map((code: any) => (
              <InviteCodeCard key={code.id} code={code} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

---

### 5.3 일정 탭 (ScheduleTab)

```tsx
// components/groups/tabs/ScheduleTab.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ScheduleTabProps {
  groupId: string;
  groupData: any;
}

export default function ScheduleTab({ groupId, groupData }: ScheduleTabProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [filter, setFilter] = useState<'all' | 'regular' | 'makeup'>('all');

  useEffect(() => {
    fetchSchedules();
  }, [groupId, filter]);

  const fetchSchedules = async () => {
    // GET /api/v1/groups/{groupId}/schedules?type={filter}
  };

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-2">
          {[
            { id: 'all', label: '전체' },
            { id: 'regular', label: '정규 수업' },
            { id: 'makeup', label: '보강' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={`flex-1 py-2 rounded-lg ${
                filter === item.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 일정 추가 버튼 */}
      <button
        onClick={() => router.push(`/schedule/new?groupId=${groupId}`)}
        className="w-full p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-blue-600 font-medium"
      >
        + 새 일정 추가
      </button>

      {/* 일정 목록 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">수업 일정</h3>
        {schedules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">등록된 일정이 없습니다</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule: any) => (
              <div
                key={schedule.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/schedule/${schedule.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{schedule.subject}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(schedule.startTime).toLocaleString('ko-KR')}
                      {' ~ '}
                      {new Date(schedule.endTime).toLocaleTimeString('ko-KR')}
                    </p>
                    {schedule.repeatRule && (
                      <p className="text-xs text-purple-600 mt-1">
                        🔁 {schedule.repeatRule.frequency === 'weekly' ? '매주' : '격주'} 반복
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${
                      schedule.type === 'regular'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {schedule.type === 'regular' ? '정규' : '보강'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

---

### 5.4 출결 탭 (AttendanceTab)

```tsx
// components/groups/tabs/AttendanceTab.tsx

'use client';

import { useEffect, useState } from 'react';

interface AttendanceTabProps {
  groupId: string;
  groupData: any;
}

export default function AttendanceTab({ groupId, groupData }: AttendanceTabProps) {
  const [attendances, setAttendances] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchAttendances();
  }, [groupId, month]);

  const fetchAttendances = async () => {
    // GET /api/v1/groups/{groupId}/attendances?month={month}
  };

  return (
    <div className="space-y-6">
      {/* 월 선택 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* 출결 요약 통계 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">출결 통계</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">24</p>
            <p className="text-sm text-gray-600 mt-1">출석</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">2</p>
            <p className="text-sm text-gray-600 mt-1">지각</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">1</p>
            <p className="text-sm text-gray-600 mt-1">조퇴</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">1</p>
            <p className="text-sm text-gray-600 mt-1">결석</p>
          </div>
        </div>
      </section>

      {/* 학생별 출결 목록 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">학생별 출결</h3>
        <div className="space-y-4">
          {attendances.map((student: any) => (
            <div key={student.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-gray-600">
                  출석률: <span className="font-semibold text-green-600">{student.rate}%</span>
                </p>
              </div>
              <div className="flex gap-2">
                {student.records.map((record: any, idx: number) => (
                  <div
                    key={idx}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                      record.status === 'present'
                        ? 'bg-green-500 text-white'
                        : record.status === 'late'
                        ? 'bg-yellow-500 text-white'
                        : record.status === 'early_leave'
                        ? 'bg-orange-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                    title={record.date}
                  >
                    {record.status === 'present'
                      ? '✓'
                      : record.status === 'late'
                      ? '△'
                      : record.status === 'early_leave'
                      ? '▽'
                      : '✗'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

### 5.5 진도 탭 (ProgressTab)

```tsx
// components/groups/tabs/ProgressTab.tsx

'use client';

import { useEffect, useState } from 'react';

interface ProgressTabProps {
  groupId: string;
  groupData: any;
}

export default function ProgressTab({ groupId, groupData }: ProgressTabProps) {
  const [textbooks, setTextbooks] = useState([]);
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    fetchProgress();
  }, [groupId]);

  const fetchProgress = async () => {
    // GET /api/v1/groups/{groupId}/progress
  };

  return (
    <div className="space-y-6">
      {/* 교재별 진도 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">교재별 진도</h3>
        {textbooks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">등록된 교재가 없습니다</p>
        ) : (
          <div className="space-y-4">
            {textbooks.map((book: any) => (
              <div key={book.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{book.title}</p>
                    <p className="text-sm text-gray-600">{book.publisher}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">{book.currentPage}</span>
                    {' / '}
                    {book.totalPages}p
                  </p>
                </div>

                {/* 진도율 바 */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${book.progressRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1 text-right">
                  {book.progressRate}% 완료
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 진도 히스토리 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">최근 진도 기록</h3>
        {progressData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">진도 기록이 없습니다</p>
        ) : (
          <div className="space-y-3">
            {progressData.map((item: any) => (
              <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.textbookTitle}</p>
                    <p className="text-sm text-gray-600">
                      {item.startPage}p ~ {item.endPage}p
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

---

### 5.6 정산 탭 (BillingTab)

```tsx
// components/groups/tabs/BillingTab.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BillingTabProps {
  groupId: string;
  groupData: any;
}

export default function BillingTab({ groupId, groupData }: BillingTabProps) {
  const router = useRouter();
  const [billingData, setBillingData] = useState<any>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchBillingData();
  }, [groupId, month]);

  const fetchBillingData = async () => {
    // GET /api/v1/groups/{groupId}/billing?month={month}
  };

  return (
    <div className="space-y-6">
      {/* 월 선택 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* 정산 요약 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">이번 달 정산 요약</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              ₩{billingData?.totalAmount?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">총 금액</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              ₩{billingData?.paidAmount?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">입금 완료</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              ₩{billingData?.unpaidAmount?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">미입금</p>
          </div>
        </div>
      </section>

      {/* 학생별 정산 현황 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">학생별 정산</h3>
        <div className="space-y-3">
          {billingData?.students?.map((student: any) => (
            <div
              key={student.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push(`/students/${student.id}/billing`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-600">
                    {student.lessonCount}회 수업
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₩{student.amount.toLocaleString()}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      student.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : student.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {student.paymentStatus === 'paid'
                      ? '완료'
                      : student.paymentStatus === 'pending'
                      ? '대기'
                      : '미납'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 청구서 발송 버튼 */}
      <button
        onClick={() => router.push(`/billing?groupId=${groupId}`)}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
      >
        💳 청구서 발송하기
      </button>
    </div>
  );
}
```

---

## 6. 검증 방법

### 6.1 기능 테스트
1. `/groups/[groupId]` 접근
2. 각 탭 클릭 시 콘텐츠 전환 확인 ✅
3. 개요 탭에서 그룹 정보 표시 확인 ✅
4. 학생 탭에서 학생 목록 및 초대 코드 관리 확인 ✅
5. 일정 탭에서 수업 일정 목록 확인 ✅
6. 출결 탭에서 통계 및 학생별 출결 확인 ✅
7. 진도 탭에서 교재별 진도 바 확인 ✅
8. 정산 탭에서 금액 요약 및 학생별 현황 확인 ✅

### 6.2 반응형 테스트
1. 탭 네비게이션 가로 스크롤 확인 (모바일)
2. 각 탭 콘텐츠 모바일 레이아웃 확인

### 6.3 데이터 연동
1. 실제 API 데이터로 표시 확인
2. 빈 데이터일 때 안내 메시지 표시 확인

---

## 7. 완료 기준 (Definition of Done)

- [ ] 6개 탭 전환 기능 구현
- [ ] OverviewTab 컴포넌트 구현
- [ ] StudentsTab 컴포넌트 구현
- [ ] ScheduleTab 컴포넌트 구현
- [ ] AttendanceTab 컴포넌트 구현
- [ ] ProgressTab 컴포넌트 구현
- [ ] BillingTab 컴포넌트 구현
- [ ] 각 탭 API 연동
- [ ] 빈 상태 UI 처리
- [ ] 로딩 상태 처리
- [ ] 모바일 반응형 확인
- [ ] 실제 데이터로 테스트 완료

---

**구현 시작 전 확인사항**:
1. F-002_과외_그룹_생성_및_매칭.md 시나리오 4 읽기
2. 각 탭에서 사용할 API 엔드포인트 확인
3. 기존 그룹 상세 페이지 구조 파악
4. 컴포넌트 디렉토리 구조 확인
