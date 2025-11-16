/**
 * Payments Page - WeTee MVP
 *
 * Screen: S-061 (정산 관리 화면)
 * Route: /payments
 *
 * Step 8: 정산 관리 기본 스켈레톤 페이지 (mock 데이터, UI 구조만)
 *
 * TODO (향후):
 * - 실제 정산 API 연동 (GET /api/payments/summary, /history 등)
 * - 결제 상태 필터/정렬 기능
 * - 결제 상세 모달/페이지
 * - 학생/그룹/기간별 필터
 * - 'use client'로 전환 (useAuth, 클라이언트 상호작용 추가 시)
 */

import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import PaymentSummaryCard from '@/components/payments/PaymentSummaryCard';
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge';
import type { PaymentSummaryStats, PaymentHistoryItem } from '@/types/payments';

// ============================================================
// Mock 데이터
// ============================================================

/** 이번 달 정산 요약 (mock) */
const mockSummary: PaymentSummaryStats = {
  totalAmount: 1200000,
  paidAmount: 900000,
  pendingAmount: 200000,
  overdueAmount: 100000,
  cancelledAmount: 0,
};

/** 최근 청구/결제 내역 (mock) */
const mockPaymentHistory: PaymentHistoryItem[] = [
  {
    id: 'pay-1',
    date: '2025-11-10',
    studentName: '김수학',
    groupName: '고3 수학반',
    amount: 400000,
    status: 'paid',
    method: '계좌이체',
    memo: '11월분 수업료 입금 완료',
  },
  {
    id: 'pay-2',
    date: '2025-11-09',
    studentName: '이영어',
    groupName: '고2 영어반',
    amount: 350000,
    status: 'pending',
    method: '카드',
    memo: '결제 예정 (15일 마감)',
  },
  {
    id: 'pay-3',
    date: '2025-11-08',
    studentName: '박과학',
    groupName: '중3 과학반',
    amount: 300000,
    status: 'overdue',
    method: '계좌이체',
    memo: '1주일 연체, 학부모 연락 예정',
  },
  {
    id: 'pay-4',
    date: '2025-11-05',
    studentName: '최국어',
    groupName: '고1 국어반',
    amount: 250000,
    status: 'paid',
    method: '현금',
    memo: '직접 수령',
  },
];

// ============================================================
// 페이지 컴포넌트
// ============================================================

export default function PaymentsPage() {
  // 금액 포맷팅 함수
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  // 날짜 포맷팅 함수 (YYYY-MM-DD → YYYY년 M월 D일)
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  return (
    <div className="space-y-6">
      {/* ============================================================
          페이지 헤더
          ============================================================ */}
      <PageHeader
        title="정산 관리"
        subtitle="수업료 청구와 결제 상태를 한눈에 관리합니다."
        actions={
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            수동 청구 생성
          </button>
        }
      />

      {/* ============================================================
          섹션 1: 이번 달 정산 요약
          ============================================================ */}
      <div>
        <PaymentSummaryCard title="이번 달 정산 요약" summary={mockSummary} />
      </div>

      {/* ============================================================
          섹션 2: 최근 청구/결제 내역
          ============================================================ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* 내역 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">최근 청구/결제 내역</h2>
        </div>

        {/* 내역 리스트 */}
        <div className="divide-y divide-gray-200">
          {mockPaymentHistory.map((item) => (
            <div
              key={item.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              {/* 좌측 영역: 정보 */}
              <div className="flex-1 space-y-1">
                {/* 날짜 */}
                <p className="text-xs text-gray-500">{formatDate(item.date)}</p>

                {/* 학생명 · 그룹명 */}
                <p className="text-sm font-medium text-gray-900">
                  {item.studentName} · {item.groupName}
                </p>

                {/* 금액 + 상태 배지 */}
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900">
                    {formatAmount(item.amount)}
                  </span>
                  <PaymentStatusBadge status={item.status} />
                </div>

                {/* 결제 방법 */}
                <p className="text-xs text-gray-600">결제 방법: {item.method}</p>

                {/* 메모 */}
                {item.memo && (
                  <p className="text-xs text-gray-500 italic">{item.memo}</p>
                )}
              </div>

              {/* 우측 영역: 액션 버튼 */}
              <div>
                <button
                  type="button"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                >
                  상세 보기 →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================
          섹션 3: 개발 안내 섹션
          ============================================================ */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-semibold text-blue-900 mb-1">
          ℹ️ Step 8 완료: 정산 관리 페이지 스켈레톤
        </p>
        <p className="text-blue-800">
          현재 mock 데이터로 표시 중입니다. 실제 정산 API 및 청구/결제 연동 시 데이터가
          동적으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
