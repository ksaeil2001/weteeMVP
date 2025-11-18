/**
 * Lesson Attendance Check Page - WeTee MVP
 * Screen: S-021 (출결 체크 화면)
 * Route: /groups/[groupId]/attendance/[scheduleId]
 *
 * Based on:
 * - F-004_출결_관리.md (시나리오 1, 2)
 * - UX_UI_설계서.md (S-021)
 * - API_명세서.md (6.4.1 출결 체크)
 *
 * 역할:
 * - 특정 수업의 출결 체크 (선생님만)
 * - 학생별 출결 상태 선택 (PRESENT, LATE, ABSENT)
 * - 메모 입력 (지각/결석 사유)
 * - 출결 수정 가능 (7일 이내)
 *
 * TODO (향후 디버깅/연결 단계):
 * - 실제 출결 체크 API 연동
 * - 출결 수정 API 연동
 * - 수업 정보 표시 (일정 API에서)
 * - 알림 발송 처리
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchGroupById } from '@/lib/api/groups';
import {
  fetchLessonAttendance,
  checkAttendance,
  updateAttendance,
} from '@/lib/api/attendance';
import type { Group } from '@/types/group';
import type {
  AttendanceRecord,
  AttendanceStatus,
} from '@/types/attendance';
import {
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_ICONS,
} from '@/types/attendance';

export default function LessonAttendanceCheckPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.groupId as string;
  const scheduleId = params?.scheduleId as string;

  const { currentRole, isAuthenticated } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 임시 상태 (목업용)
  const [tempStatuses, setTempStatuses] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});

  // 그룹 정보 및 출결 기록 로드
  useEffect(() => {
    const loadData = async () => {
      if (!groupId || !scheduleId) return;

      try {
        setIsLoading(true);
        setError(null);

        // 그룹 정보 로드
        const groupData = await fetchGroupById(groupId);
        setGroup(groupData);

        // 출결 기록 로드 (기존 기록이 있는 경우)
        const records = await fetchLessonAttendance(scheduleId);
        setAttendanceRecords(records);

        // 임시 상태 초기화
        const initStatuses: Record<
          string,
          { status: AttendanceStatus; notes: string }
        > = {};
        records.forEach((record) => {
          initStatuses[record.studentId] = {
            status: record.status,
            notes: record.notes || '',
          };
        });

        // 그룹 멤버 중 학생들을 기준으로 초기화 (출결이 없는 학생은 PRESENT 기본값)
        if (groupData.members) {
          const students = groupData.members.filter(
            (m) => m.role === 'student'
          );
          students.forEach((student) => {
            if (!initStatuses[student.userId]) {
              initStatuses[student.userId] = {
                status: 'PRESENT',
                notes: '',
              };
            }
          });
        }

        setTempStatuses(initStatuses);
      } catch (err) {
        console.error('Failed to load attendance data:', err);
        setError('출결 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [groupId, scheduleId]);

  // 출결 상태 변경
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setTempStatuses((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  // 메모 변경
  const handleNotesChange = (studentId: string, notes: string) => {
    setTempStatuses((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  // 출결 저장
  const handleSave = async () => {
    if (!scheduleId || !group) return;

    try {
      setIsSaving(true);
      setError(null);

      // 출결 페이로드 생성
      const students = group.members?.filter((m) => m.role === 'student') || [];
      const attendances = students.map((student) => ({
        studentId: student.userId,
        status: tempStatuses[student.userId]?.status || 'PRESENT',
        notes: tempStatuses[student.userId]?.notes || undefined,
      }));

      // 출결 체크 API 호출
      await checkAttendance({
        scheduleId,
        attendances,
      });

      // 성공 메시지 표시
      alert('출결이 저장되었습니다.');

      // 목록으로 돌아가기
      router.push(`/groups/${groupId}/attendance`);
    } catch (err) {
      console.error('Failed to save attendance:', err);
      setError('출결 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-24 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 선생님이 아니면 접근 불가
  if (currentRole !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
            <p className="font-medium">접근 권한 없음</p>
            <p className="text-sm mt-1">
              출결 체크는 선생님만 할 수 있습니다.
            </p>
            <button
              onClick={() => router.back()}
              className="mt-3 text-sm underline"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const students = group?.members?.filter((m) => m.role === 'student') || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm mb-2"
          >
            ← 돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900">출결 체크</h1>
          {group && (
            <div className="mt-2 text-gray-600">
              <p>{group.name} · {group.subject}</p>
              <p className="text-sm">일정 ID: {scheduleId}</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Student List */}
        <div className="space-y-4">
          {students.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">
                이 그룹에 학생이 없습니다.
              </p>
            </div>
          ) : (
            students.map((student) => {
              const currentStatus =
                tempStatuses[student.userId]?.status || 'PRESENT';
              const currentNotes = tempStatuses[student.userId]?.notes || '';

              return (
                <div
                  key={student.userId}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {student.name}
                  </h3>

                  {/* Status Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {(['PRESENT', 'LATE', 'EARLY_LEAVE', 'ABSENT'] as AttendanceStatus[]).map(
                      (status) => {
                        const isSelected = currentStatus === status;
                        const colorConfig = ATTENDANCE_STATUS_COLORS[status];

                        return (
                          <button
                            key={status}
                            onClick={() =>
                              handleStatusChange(student.userId, status)
                            }
                            className={`py-3 px-4 rounded-lg border-2 transition-all ${
                              isSelected
                                ? `${colorConfig.bg} ${colorConfig.text} border-current`
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="text-2xl mb-1">
                              {ATTENDANCE_STATUS_ICONS[status]}
                            </div>
                            <div className="text-sm font-medium">
                              {colorConfig.label}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* Notes Input (지각/조퇴/결석인 경우) */}
                  {(currentStatus === 'LATE' || currentStatus === 'EARLY_LEAVE' || currentStatus === 'ABSENT') && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {currentStatus === 'ABSENT' ? '결석 사유' : currentStatus === 'EARLY_LEAVE' ? '조퇴 사유' : '지각 사유'}{' '}
                        {currentStatus === 'ABSENT' && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <textarea
                        value={currentNotes}
                        onChange={(e) =>
                          handleNotesChange(student.userId, e.target.value)
                        }
                        placeholder={
                          currentStatus === 'ABSENT'
                            ? '결석 사유를 입력해주세요 (필수)'
                            : currentStatus === 'EARLY_LEAVE'
                            ? '조퇴 사유를 입력해주세요 (선택)'
                            : '지각 사유를 입력해주세요 (선택)'
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        {students.length > 0 && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? '저장 중...' : '저장 및 완료'}
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 Tip: 출결을 저장하면 학생과 학부모에게 자동으로 알림이 전송됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
