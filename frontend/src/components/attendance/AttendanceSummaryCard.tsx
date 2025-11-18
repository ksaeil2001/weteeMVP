// Step 7: 출결 요약 카드 컴포넌트

import React from 'react';
import type { AttendanceSummaryCounts } from '@/types/attendance';
import AttendanceStatusBadge from './AttendanceStatusBadge';

interface AttendanceSummaryCardProps {
  title: string;                      // 예: "오늘 출결 요약"
  summary: AttendanceSummaryCounts;   // 출결 집계
}

const AttendanceSummaryCard: React.FC<AttendanceSummaryCardProps> = ({
  title,
  summary,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 카드 제목 */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>

      {/* 출결 집계 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* 전체 학생 수 */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">전체 학생</div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.totalStudents}
          </div>
        </div>

        {/* 출석 */}
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AttendanceStatusBadge status="PRESENT" />
          </div>
          <div className="text-2xl font-bold text-green-700">
            {summary.present}
          </div>
        </div>

        {/* 지각 */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AttendanceStatusBadge status="LATE" />
          </div>
          <div className="text-2xl font-bold text-yellow-700">
            {summary.late}
          </div>
        </div>

        {/* 결석 */}
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AttendanceStatusBadge status="ABSENT" />
          </div>
          <div className="text-2xl font-bold text-red-700">
            {summary.absent}
          </div>
        </div>

        {/* 보강 - TODO: AttendanceStatus 타입에 MAKEUP 추가 후 활성화 */}
        {summary.makeup !== undefined && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                보강
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {summary.makeup}
            </div>
          </div>
        )}

        {/* 공결 - TODO: AttendanceStatus 타입에 EXCUSED 추가 후 활성화 */}
        {summary.excused !== undefined && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                공결
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-700">
              {summary.excused}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceSummaryCard;
