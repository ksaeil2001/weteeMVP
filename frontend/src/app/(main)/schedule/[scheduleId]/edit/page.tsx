/**
 * Schedule Edit Page - WeTee MVP
 * Screen: S-015 (일정 수정 화면)
 * Route: /schedule/[scheduleId]/edit
 *
 * Based on:
 * - F-003_수업_일정_관리.md (시나리오 2: 일정 수정)
 * - UX_UI_설계서.md (S-015: 일정 수정 화면)
 *
 * 역할:
 * - 기존 수업 일정 수정
 * - 요일, 시간, 반복 규칙 변경
 * - 선생님만 접근 가능
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchScheduleById, updateSchedule } from '@/lib/api/schedules';
import { fetchGroups } from '@/lib/api/groups';
import type {
  Schedule,
  RecurrenceFrequency,
  RecurrenceEndType,
} from '@/types/schedule';
import type { Group } from '@/types/group';

const WEEKDAYS = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 7, label: '일' },
];

export default function ScheduleEditPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params?.scheduleId as string;

  const [_schedule, setSchedule] = useState<Schedule | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    groupId: '',
    title: '',
    startTime: '15:00',
    duration: 120,
    location: '',
    memo: '',
    // 반복 규칙
    frequency: 'weekly' as RecurrenceFrequency,
    interval: 1,
    daysOfWeek: [] as number[],
    startDate: new Date().toISOString().split('T')[0],
    endType: 'date' as RecurrenceEndType,
    endDate: '',
    endCount: 40,
  });

  // 기존 일정 로드
  useEffect(() => {
    if (scheduleId) {
      loadScheduleData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  // 그룹 목록 로드
  useEffect(() => {
    loadGroups();
  }, []);

  async function loadScheduleData() {
    try {
      setLoading(true);
      const data = await fetchScheduleById(scheduleId);
      setSchedule(data);

      // 폼 데이터 채우기
      const startDateTime = new Date(data.startAt);
      const startTime = startDateTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      // duration 계산 (endAt - startAt in minutes)
      const endDateTime = new Date(data.endAt);
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);

      setFormData({
        groupId: data.groupId,
        title: data.title || '',
        startTime: startTime,
        duration: durationMinutes || 120,
        location: data.location || '',
        memo: data.memo || '',
        frequency: data.recurrenceRule?.frequency || 'weekly',
        interval: data.recurrenceRule?.interval || 1,
        daysOfWeek: data.recurrenceRule?.daysOfWeek || [],
        startDate: data.recurrenceRule?.startDate || data.startAt.split('T')[0],
        endType: data.recurrenceRule?.endType || 'date',
        endDate: data.recurrenceRule?.endDate || '',
        endCount: data.recurrenceRule?.endCount || 40,
      });
    } catch (error) {
      console.error('일정 로드 실패:', error);
      alert('일정을 불러오는데 실패했습니다.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function loadGroups() {
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (error) {
      console.error('그룹 로드 실패:', error);
    }
  }

  // 요일 선택/해제
  function toggleWeekday(day: number) {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  }

  // 폼 제출
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 유효성 검사
    if (!formData.groupId) {
      alert('과외 그룹을 선택해주세요.');
      return;
    }
    if (!formData.title) {
      alert('수업 제목을 입력해주세요.');
      return;
    }
    if (formData.daysOfWeek.length === 0) {
      alert('최소 한 개의 요일을 선택해주세요.');
      return;
    }
    if (!formData.startDate) {
      alert('시작일을 선택해주세요.');
      return;
    }
    if (formData.endType === 'date' && !formData.endDate) {
      alert('종료일을 선택해주세요.');
      return;
    }
    if (formData.endType === 'count' && formData.endCount < 1) {
      alert('수업 횟수를 1회 이상으로 입력해주세요.');
      return;
    }

    // 종료일이 시작일보다 빠른 경우 검사
    if (
      formData.endType === 'date' &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      alert('종료일은 시작일 이후여야 합니다.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        groupId: formData.groupId,
        title: formData.title,
        scheduleType: 'REGULAR',
        startTime: formData.startTime,
        duration: formData.duration,
        location: formData.location,
        memo: formData.memo,
        recurrence: {
          frequency: formData.frequency,
          interval: formData.interval,
          daysOfWeek: formData.daysOfWeek,
          startDate: formData.startDate,
          endType: formData.endType,
          endDate: formData.endType === 'date' ? formData.endDate : undefined,
          endCount: formData.endType === 'count' ? formData.endCount : undefined,
        },
      };

      await updateSchedule(scheduleId, payload);

      alert('일정이 수정되었습니다.');
      router.push(`/schedule/${scheduleId}`);
    } catch (error) {
      console.error('일정 수정 실패:', error);
      alert('일정 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600">일정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 text-sm mb-2 hover:underline"
        >
          ← 돌아가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900">일정 수정</h1>
        <p className="mt-2 text-sm text-gray-600">수업 일정을 수정합니다</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* 그룹 선택 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            과외 그룹 *
          </label>
          <select
            value={formData.groupId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, groupId: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">그룹을 선택하세요</option>
            {groups.map((group) => (
              <option key={group.groupId} value={group.groupId}>
                {group.name} ({group.subject})
              </option>
            ))}
          </select>
        </div>

        {/* 수업 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">수업 정보</h3>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수업 제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 수학 수업"
              required
            />
          </div>

          {/* 시작 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수업 시작 시간 *
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startTime: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 수업 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수업 시간 (분) *
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  duration: parseInt(e.target.value),
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="30"
              step="30"
              required
            />
          </div>

          {/* 장소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수업 장소
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 스터디카페, 학생 집"
            />
          </div>
        </div>

        {/* 반복 설정 */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">반복 설정</h3>

          {/* 요일 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수업 요일 *
            </label>
            <div className="flex gap-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWeekday(day.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.daysOfWeek.includes(day.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* 시작일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작일 *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 종료 조건 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료 조건 *
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  value="date"
                  checked={formData.endType === 'date'}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, endType: 'date' }))
                  }
                  className="w-4 h-4"
                />
                <span>종료일까지</span>
                {formData.endType === 'date' && (
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="ml-2 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  value="count"
                  checked={formData.endType === 'count'}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, endType: 'count' }))
                  }
                  className="w-4 h-4"
                />
                <span>총</span>
                {formData.endType === 'count' && (
                  <input
                    type="number"
                    value={formData.endCount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endCount: parseInt(e.target.value),
                      }))
                    }
                    className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    min="1"
                    required
                  />
                )}
                <span>회 수업</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  value="never"
                  checked={formData.endType === 'never'}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, endType: 'never' }))
                  }
                  className="w-4 h-4"
                />
                <span>무기한</span>
              </label>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, memo: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="수업 관련 메모를 입력하세요"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? '저장 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  );
}
