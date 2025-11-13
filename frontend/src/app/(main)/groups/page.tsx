/**
 * Groups Page - WeTee MVP
 * Screen: S-021 (그룹 목록 화면)
 * Route: /groups
 *
 * Based on:
 * - F-002_과외_그룹_생성_및_매칭.md
 * - UX_UI_설계서.md (그룹 관리 화면)
 *
 * 역할:
 * - 현재 운영 중인 과외 그룹 목록 표시
 * - 선생님: 그룹 생성, 학생/학부모 초대
 * - 학생/학부모: 소속 그룹 조회
 *
 * Step 6: 스켈레톤 페이지 (mock 데이터, UI 구조만)
 *
 * TODO (향후):
 * - 실제 그룹 목록 API 연동 (GET /api/groups)
 * - 그룹 생성 모달/페이지
 * - 필터/검색 UI (과목별, 학년별, 상태별)
 * - 그룹 상세 페이지 연결
 * - 초대 코드 생성 및 복사 기능
 */

import React from 'react';
import PageHeader from '@/components/common/PageHeader';

// Mock 데이터 (Step 6)
const mockGroups = [
  {
    id: 'group-1',
    name: '고3 수학반',
    subject: '수학',
    grade: '고3',
    studentCount: 3,
    schedule: '월/수/금 15:00-17:00',
    status: '운영중',
  },
  {
    id: 'group-2',
    name: '고2 영어반',
    subject: '영어',
    grade: '고2',
    studentCount: 2,
    schedule: '화/목 19:00-21:00',
    status: '운영중',
  },
];

export default function GroupsPage() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <PageHeader
        title="그룹 관리"
        subtitle="현재 운영 중인 과외 그룹을 한눈에 보고 관리합니다."
        actions={
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            + 새 그룹 만들기
          </button>
        }
      />

      {/* 그룹 목록 카드 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  그룹명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  과목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  학년
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  학생 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  요일/시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockGroups.map((group) => (
                <tr
                  key={group.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {group.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {group.subject}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {group.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {group.studentCount}명
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {group.schedule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                      {group.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      type="button"
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      상세 보기 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 개발 안내 (Step 6) */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-semibold text-blue-900 mb-1">
          ℹ️ Step 6 완료: 그룹 관리 페이지 스켈레톤
        </p>
        <p className="text-blue-800">
          현재 mock 데이터로 표시 중입니다. 실제 API 연동 시 그룹 데이터가 동적으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
