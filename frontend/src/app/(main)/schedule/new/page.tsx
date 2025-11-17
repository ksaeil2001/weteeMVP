/**
 * Schedule Create Page - WeTee MVP
 * Screen: S-013 (정규 수업 등록 화면)
 * Route: /schedule/new
 *
 * Based on:
 * - F-003_수업_일정_관리.md (시나리오 1: 정규 수업 등록)
 * - UX_UI_설계서.md (S-013: 정규 수업 등록 화면)
 *
 * 역할:
 * - 정규 수업 일정 등록 (반복 일정)
 * - 요일, 시간, 반복 규칙 설정
 * - 선생님만 접근 가능
 *
 * TODO (향후):
 * - 실제 API 연동
 * - 그룹 목록 실시간 로드
 * - 일정 충돌 검사
 * - 예상 수업 횟수 계산 및 표시
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { createRegularSchedule } from '@/lib/api/schedules';
import { fetchGroups } from '@/lib/api/groups';
import type {
  CreateRegularSchedulePayload,
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

export default function ScheduleNewPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
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

  // 그룹 목록 로드
  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      setLoading(true);
      const data = await fetchGroups();
      setGroups(data);
      // 첫 번째 그룹 자동 선택
      if (data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          groupId: data[0].groupId,
          title: `${data[0].subject} 수업`,
          duration: data[0].sessionDuration || 120,
        }));
      }
    } catch (error) {
      console.error('그룹 로드 실패:', error);
      alert('그룹 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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

      const payload: CreateRegularSchedulePayload = {
        groupId: formData.groupId,
        title: formData.title,
        startTime: formData.startTime,
        duration: formData.duration,
        location: formData.location || undefined,
        memo: formData.memo || undefined,
        recurrence: {
          frequency: formData.frequency,
          interval: formData.interval,
          daysOfWeek: formData.daysOfWeek,
          startDate: formData.startDate,
          endType: formData.endType,
          endDate: formData.endType === 'date' ? formData.endDate : undefined,
          endCount:
            formData.endType === 'count' ? formData.endCount : undefined,
        },
      };

      const schedules = await createRegularSchedule(payload);

      alert(
        `정규 수업이 등록되었습니다.\n생성된 일정: ${schedules.length}개`
      );
      router.push('/schedule');
    } catch (error) {
      console.error('일정 등록 실패:', error);
      alert('일정 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="정규 수업 등록"
        subtitle="매주 반복되는 정규 수업 일정을 등록합니다."
        backLink="/schedule"
      />

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">기본 정보</h2>

            {/* 그룹 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                과외 그룹 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.groupId}
                onChange={(e) => {
                  const group = groups.find(
                    (g) => g.groupId === e.target.value
                  );
                  setFormData((prev) => ({
                    ...prev,
                    groupId: e.target.value,
                    title: group ? `${group.subject} 수업` : prev.title,
                    duration: group?.sessionDuration || prev.duration,
                  }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

            {/* 수업 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수업 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="예: 수학 수업"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* 수업 시작 시간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수업 시작 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* 수업 시간 (분) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수업 시간 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={30}
                  step={30}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <span className="text-sm text-gray-600">분</span>
                <div className="flex gap-2">
                  {[60, 90, 120, 150, 180].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, duration: minutes }))
                      }
                      className={`px-3 py-1 text-sm rounded-lg border ${
                        formData.duration === minutes
                          ? 'bg-primary-100 text-primary-700 border-primary-300'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {minutes}분
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 수업 장소 */}
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
                placeholder="예: 학생 집, 온라인"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
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
                placeholder="추가로 기록할 내용이 있으면 입력해주세요."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 반복 규칙 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">반복 규칙</h2>

            {/* 수업 요일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수업 요일 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-colors ${
                      formData.daysOfWeek.includes(day.value)
                        ? 'bg-primary-100 text-primary-700 border-primary-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {formData.daysOfWeek.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  선택된 요일: 매주{' '}
                  {formData.daysOfWeek
                    .map((d) => WEEKDAYS.find((w) => w.value === d)?.label)
                    .join(', ')}
                </p>
              )}
            </div>

            {/* 시작일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                이 날짜부터 반복 수업이 시작됩니다
              </p>
            </div>

            {/* 종료 조건 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                종료 조건 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {/* 종료일 지정 */}
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="endType"
                    value="date"
                    checked={formData.endType === 'date'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endType: e.target.value as RecurrenceEndType,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      종료일 지정
                    </span>
                    {formData.endType === 'date' && (
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        min={formData.startDate}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    )}
                  </div>
                </label>

                {/* 횟수 지정 */}
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="endType"
                    value="count"
                    checked={formData.endType === 'count'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endType: e.target.value as RecurrenceEndType,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      횟수 지정
                    </span>
                    {formData.endType === 'count' && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.endCount}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              endCount: parseInt(e.target.value) || 0,
                            }))
                          }
                          min={1}
                          max={1000}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                        <span className="text-sm text-gray-600">회 수업</span>
                      </div>
                    )}
                  </div>
                </label>

                {/* 종료일 없음 */}
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="endType"
                    value="never"
                    checked={formData.endType === 'never'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endType: e.target.value as RecurrenceEndType,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      종료일 없음 (무한 반복)
                    </span>
                    {formData.endType === 'never' && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ 무한 반복 일정은 향후 3개월까지만 자동 생성됩니다.
                        종료일 설정을 권장합니다.
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
