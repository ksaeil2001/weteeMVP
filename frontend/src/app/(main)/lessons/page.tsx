/**
 * Lessons Page - WeTee MVP
 * Screen: S-041 (수업 기록 화면)
 * Route: /lessons
 *
 * Based on:
 * - F-005_수업_기록_및_진도_관리.md
 * - UX_UI_설계서.md (수업 기록 화면)
 *
 * 역할:
 * - 수업 기록 조회 및 작성
 * - 선생님: 수업 내용, 진도, 숙제 기록
 * - 학생/학부모: 수업 기록 조회 (읽기 전용)
 *
 * Step 6: 스켈레톤 페이지 (mock 데이터, UI 구조만)
 *
 * TODO (향후):
 * - 수업 기록 API 연동 (GET/POST /api/lessons)
 * - 수업 기록 작성 모달/페이지
 * - 학생별, 과목별 필터
 * - 진도 추적 기능
 * - 숙제 체크리스트
 * - 첨부 파일 업로드 (이미지, PDF 등)
 */

import React from 'react';
import PageHeader from '@/components/common/PageHeader';

// Mock 데이터 (Step 6)
const mockLessonRecords = [
  {
    id: 'lesson-1',
    date: '2025-11-12',
    subject: '수학',
    student: '김수학',
    group: '고3 수학반',
    duration: '2시간',
    content: '이차방정식의 판별식 학습',
    progress: '확률과 통계 > 이차방정식 > 판별식',
    homework: '교재 p.123-125 문제풀이',
  },
  {
    id: 'lesson-2',
    date: '2025-11-11',
    subject: '영어',
    student: '이영어',
    group: '고2 영어반',
    duration: '2시간',
    content: '관계대명사 복습 및 예문 작성',
    progress: '문법 > 관계대명사 > 주격/목적격',
    homework: '워크북 Unit 5 완성',
  },
  {
    id: 'lesson-3',
    date: '2025-11-10',
    subject: '수학',
    student: '박수학',
    group: '고3 수학반',
    duration: '2시간',
    content: '이차함수 그래프 그리기',
    progress: '확률과 통계 > 이차함수',
    homework: '문제집 3단원 복습',
  },
];

export default function LessonsPage() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <PageHeader
        title="수업 기록"
        subtitle="최근 수업 내용을 기록하고, 학생별 진도 현황을 확인합니다."
        actions={
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            + 수업 기록 작성
          </button>
        }
      />

      {/* 최근 수업 기록 리스트 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            최근 수업 기록 ({mockLessonRecords.length}건)
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {mockLessonRecords.map((record) => (
            <div
              key={record.id}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {/* 상단: 날짜, 과목, 학생 정보 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">
                    {record.date}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {record.subject}
                  </span>
                  <span className="text-sm text-gray-700">
                    {record.student} · {record.group}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  상세 보기 →
                </button>
              </div>

              {/* 중단: 수업 내용 */}
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  수업 내용
                </h3>
                <p className="text-sm text-gray-700">{record.content}</p>
              </div>

              {/* 하단: 진도 & 숙제 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 mb-1">
                    진도
                  </h4>
                  <p className="text-sm text-gray-700">{record.progress}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 mb-1">
                    숙제
                  </h4>
                  <p className="text-sm text-gray-700">{record.homework}</p>
                </div>
              </div>

              {/* 메타 정보 */}
              <div className="mt-3 text-xs text-gray-500">
                수업 시간: {record.duration}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 개발 안내 (Step 6) */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-semibold text-blue-900 mb-1">
          ℹ️ Step 6 완료: 수업 기록 페이지 스켈레톤
        </p>
        <p className="text-blue-800">
          현재 mock 데이터로 표시 중입니다. 실제 수업 기록 API 연동 시 동적으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
