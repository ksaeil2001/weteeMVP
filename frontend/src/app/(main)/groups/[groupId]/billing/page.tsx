/**
 * Group Billing Detail Page - 그룹별 정산 상세
 * Screen ID: S-041 (문서에서는 S-041로 표기되었으나 요청에서는 그룹별 정산)
 * Feature: F-006 수업료 정산
 *
 * 역할:
 * - 특정 그룹의 월별 정산 상세 정보 표시
 * - 학생별 정산 테이블
 * - 청구서 생성 및 발송 기능
 *
 * 권한: TEACHER만 접근 가능
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { GroupBillingSummary } from '@/types/billing';
import { fetchGroupBillingSummary } from '@/lib/api/billing';

export default function GroupBillingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = params.groupId as string;
  const studentIdParam = searchParams.get('student');

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState<GroupBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGroupBillingSummary();
  }, [groupId, selectedMonth]);

  async function loadGroupBillingSummary() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGroupBillingSummary(groupId, { month: selectedMonth });
      setSummary(data);
    } catch (err) {
      console.error('그룹 정산 로딩 실패:', err);
      setError('그룹 정산 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">정산 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '그룹을 찾을 수 없습니다'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 뒤로
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{summary.groupName}</h1>
          </div>

          <div className="flex items-center justify-between">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getMonthOptions().map((month) => (
                <option key={month} value={month}>
                  {month.replace('-', '년 ')}월
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Billing Info Card */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">수업료 정보</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">회당 수업료</div>
              <div className="text-lg font-semibold text-gray-900">
                {summary.pricePerLesson.toLocaleString()}원
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">결제 방식</div>
              <div className="text-lg font-semibold text-gray-900">
                {summary.paymentMethod === 'PREPAY' ? '선불' : '후불'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">정산 주기</div>
              <div className="text-lg font-semibold text-gray-900">
                {summary.billingCycle === 'MONTHLY' ? '매월 말' : summary.billingCycle}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">월 예상 수업</div>
              <div className="text-lg font-semibold text-gray-900">
                {summary.expectedLessonsPerMonth}회
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm font-medium text-gray-600 mb-1">총 청구 금액</div>
            <div className="text-2xl font-bold text-gray-900">
              {summary.totalAmount.toLocaleString()}원
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm font-medium text-gray-600 mb-1">결제 완료</div>
            <div className="text-2xl font-bold text-green-600">
              {summary.paidAmount.toLocaleString()}원
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-sm font-medium text-gray-600 mb-1">미결제</div>
            <div className="text-2xl font-bold text-orange-600">
              {summary.unpaidAmount.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                학생별 정산 ({summary.studentSummaries.length}명)
              </h2>
              <button
                onClick={() =>
                  alert('이 달 정산서 일괄 생성 기능은 추후 구현 예정입니다.')
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                이 달 정산서 일괄 생성
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    학생 이름
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    약정 횟수
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    실제 횟수
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    청구 금액
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summary.studentSummaries.map((student) => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{student.studentName}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-900">
                      {student.expectedLessons}회
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`font-medium ${
                          Math.abs(student.expectedLessons - student.actualLessons) >= 3
                            ? 'text-yellow-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {student.actualLessons}회
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {student.amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(
                          student.status
                        )}`}
                      >
                        {getStatusLabel(student.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.statementId ? (
                        <Link
                          href={`/billing/statements/${student.statementId}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          정산서 보기
                        </Link>
                      ) : (
                        <button
                          onClick={() =>
                            alert('청구서 생성 기능은 추후 구현 예정입니다.')
                          }
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          청구서 생성
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 font-semibold text-gray-900">합계</td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    {summary.studentSummaries.reduce(
                      (sum, s) => sum + s.expectedLessons,
                      0
                    )}
                    회
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">
                    {summary.totalLessons}회
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    {summary.totalAmount.toLocaleString()}원
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
