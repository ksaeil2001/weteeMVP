/**
 * Billing Dashboard Page - 선생님용 정산 대시보드
 * Screen ID: S-027
 * Feature: F-006 수업료 정산
 *
 * 역할:
 * - 선생님의 월별 정산 현황 요약 표시
 * - 학생별 청구 현황 카드 리스트
 * - 청구서 발송, 통계 보기 액션
 *
 * 권한: TEACHER만 접근 가능
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import type { BillingDashboardCard } from '@/types/billing';
import { fetchBillingDashboard } from '@/lib/api/billing';

export default function BillingDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, currentUser, currentRole } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [cards, setCards] = useState<BillingDashboardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || currentRole !== 'teacher' || !currentUser) {
      setLoading(false);
      return;
    }
    loadBillingDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, isAuthenticated, currentRole, currentUser]);

  async function loadBillingDashboard() {
    if (!currentUser) {
      setError('사용자 정보를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 참고: fetchBillingDashboard는 현재 백엔드에 구현되지 않은 엔드포인트입니다.
      // billing.ts 파일에서 빈 배열을 반환하도록 되어 있습니다.
      // TODO(v2): 백엔드에 GET /api/v1/settlements/dashboard 엔드포인트 추가 필요
      const data = await fetchBillingDashboard(currentUser.id, selectedMonth);
      setCards(data);
    } catch (err) {
      console.error('정산 대시보드 로딩 실패:', err);
      setError('정산 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 월 선택 옵션 생성 (현재 월 기준 ±6개월)
  function getMonthOptions() {
    const options: string[] = [];
    const now = new Date();
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      options.push(month);
    }
    return options;
  }

  // 월별 총 금액 계산
  const totalAmount = cards.reduce((sum, card) => sum + card.amount, 0);
  const paidAmount = cards
    .filter((card) => card.status === 'PAID' || card.status === 'SETTLED')
    .reduce((sum, card) => sum + card.amount, 0);
  const unpaidAmount = totalAmount - paidAmount;
  const unpaidCount = cards.filter(
    (card) => card.status === 'ISSUED' || card.status === 'OVERDUE'
  ).length;

  // 상태별 배지 색상
  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'PAID':
      case 'SETTLED':
        return 'bg-green-100 text-green-800';
      case 'ISSUED':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'PAID':
        return '결제 완료';
      case 'SETTLED':
        return '정산 완료';
      case 'ISSUED':
        return '미결제';
      case 'OVERDUE':
        return '연체';
      case 'DRAFT':
        return '미발행';
      default:
        return status;
    }
  }

  // 권한 체크
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  if (currentRole !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">선생님 계정만 접근 가능합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">수업료 정산</h1>
            <div className="flex gap-2">
              <Link
                href="/billing/statistics"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                📊 통계 보기
              </Link>
              <button
                onClick={() => alert('영수증 다운로드 기능은 추후 구현 예정입니다.')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                📥 영수증 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Month Selector */}
        <div className="mb-6">
          <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-2">
            정산 월 선택
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getMonthOptions().map((month) => (
              <option key={month} value={month}>
                {month.replace('-', '년 ')}월
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm font-medium text-gray-600 mb-1">총 청구 금액</div>
            <div className="text-2xl font-bold text-gray-900">
              {totalAmount.toLocaleString()}원
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm font-medium text-gray-600 mb-1">결제 완료 금액</div>
            <div className="text-2xl font-bold text-green-600">
              {paidAmount.toLocaleString()}원
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm font-medium text-gray-600 mb-1">미결제 금액</div>
            <div className="text-2xl font-bold text-orange-600">
              {unpaidAmount.toLocaleString()}원
              {unpaidCount > 0 && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({unpaidCount}명)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">정산 정보를 불러오는 중...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadBillingDashboard}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Student Cards */}
        {!loading && !error && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                학생별 청구 현황 ({cards.length}명)
              </h2>
            </div>

            {cards.length === 0 ? (
              <div className="bg-white border rounded-lg p-12 text-center">
                <p className="text-gray-600 mb-2">이번 달 정산 내역이 없습니다.</p>
                <p className="text-sm text-gray-500">
                  수업을 진행한 후 청구서를 발송해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cards.map((card) => (
                  <div
                    key={`${card.groupId}-${card.studentId}`}
                    className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {card.studentName}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(
                              card.status
                            )}`}
                          >
                            {getStatusLabel(card.status)}
                          </span>
                          {card.hasWarning && (
                            <span className="text-yellow-600" title={card.warningMessage}>
                              ⚠️
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{card.groupName}</p>

                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-gray-600">약정: </span>
                            <span className="font-medium">{card.expectedLessons}회</span>
                          </div>
                          <div>
                            <span className="text-gray-600">실제: </span>
                            <span className="font-medium">{card.actualLessons}회</span>
                          </div>
                          <div>
                            <span className="text-gray-600">청구 금액: </span>
                            <span className="font-bold text-blue-600">
                              {card.amount.toLocaleString()}원
                            </span>
                          </div>
                        </div>

                        {card.hasWarning && card.warningMessage && (
                          <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded">
                            {card.warningMessage}
                          </p>
                        )}

                        {card.issuedAt && (
                          <p className="mt-2 text-xs text-gray-500">
                            발송일: {new Date(card.issuedAt).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {card.statementId ? (
                          <Link
                            href={`/billing/statements/${card.statementId}`}
                            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 text-center whitespace-nowrap"
                          >
                            청구서 보기
                          </Link>
                        ) : (
                          <button
                            onClick={() =>
                              router.push(`/groups/${card.groupId}/billing?student=${card.studentId}`)
                            }
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap"
                          >
                            청구서 발송
                          </button>
                        )}

                        <Link
                          href={`/groups/${card.groupId}/billing`}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-center whitespace-nowrap"
                        >
                          그룹 정산
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
