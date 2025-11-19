/**
 * Student Billing Page - 학생/학부모용 청구 내역
 * Screen ID: S-043
 * Feature: F-006 수업료 정산
 *
 * 역할:
 * - 학생별 월별 청구서 목록 표시
 * - 청구서 상세 조회
 * - 결제 내역 확인
 *
 * 권한: STUDENT, PARENT만 접근 가능 (해당 학생 본인 또는 학부모)
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { StudentBillingSummary } from '@/types/billing';
import { fetchStudentBillingSummary } from '@/lib/api/billing';

export default function StudentBillingPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState<StudentBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO(F-006): useAuth 훅으로 실제 role과 권한 확인
  const mockRole = 'PARENT'; // 'PARENT' | 'STUDENT'

  useEffect(() => {
    loadStudentBillingSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, selectedMonth]);

  async function loadStudentBillingSummary() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStudentBillingSummary(studentId, { month: selectedMonth });
      setSummary(data);
    } catch (err) {
      console.error('학생 정산 로딩 실패:', err);
      setError('청구 내역을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function getMonthOptions() {
    const options: string[] = [];
    const now = new Date();
    for (let i = -6; i <= 0; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      options.push(month);
    }
    return options.reverse();
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
        return '결제 필요';
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
          <p className="mt-4 text-gray-600">청구 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '청구 내역을 찾을 수 없습니다'}</p>
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 뒤로
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{summary.studentName} 청구 내역</h1>
          </div>

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

      <div className="max-w-4xl mx-auto px-4 py-6">
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

        {/* Statements List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              청구서 목록 ({summary.statements.length}건)
            </h2>
          </div>

          {summary.statements.length === 0 ? (
            <div className="bg-white border rounded-lg p-12 text-center">
              <p className="text-gray-600 mb-2">이번 달 청구서가 없습니다.</p>
              <p className="text-sm text-gray-500">
                선생님이 청구서를 발송하면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <>
              {summary.statements.map((statement) => (
                <div
                  key={statement.id}
                  className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {statement.groupName}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(
                            statement.status
                          )}`}
                        >
                          {getStatusLabel(statement.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        청구서 번호: {statement.statementNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        기간: {new Date(statement.periodFrom).toLocaleDateString('ko-KR')} ~{' '}
                        {new Date(statement.periodTo).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <span className="text-sm text-gray-600">수업 횟수: </span>
                        <span className="text-sm font-medium text-gray-900">
                          {statement.items.length}회
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">청구 금액: </span>
                        <span className="text-lg font-bold text-blue-600">
                          {statement.totalAmount.toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    {statement.issuedAt && (
                      <p className="text-xs text-gray-500">
                        발송일: {new Date(statement.issuedAt).toLocaleDateString('ko-KR')}
                      </p>
                    )}

                    {statement.dueDate &&
                      (statement.status === 'ISSUED' || statement.status === 'OVERDUE') && (
                        <p className="text-xs text-orange-600 mt-1">
                          결제 기한: {new Date(statement.dueDate).toLocaleDateString('ko-KR')}
                        </p>
                      )}

                    {statement.paidAt && (
                      <p className="text-xs text-green-600 mt-1">
                        결제 완료: {new Date(statement.paidAt).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>

                  {statement.memo && (
                    <div className="bg-gray-50 rounded p-3 mb-4">
                      <p className="text-sm text-gray-700">{statement.memo}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/billing/statements/${statement.id}`}
                      className="flex-1 px-4 py-2 text-sm font-medium text-center text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      상세 보기
                    </Link>

                    {mockRole === 'PARENT' &&
                      (statement.status === 'ISSUED' || statement.status === 'OVERDUE') && (
                        <button
                          onClick={() =>
                            alert('결제 기능은 추후 토스페이먼츠 등 PG 연동 후 구현 예정입니다.')
                          }
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          결제하기
                        </button>
                      )}

                    {(statement.status === 'PAID' || statement.status === 'SETTLED') && (
                      <button
                        onClick={() => router.push(`/billing/receipts/${statement.id}`)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        영수증
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            💡 청구서 관련 안내
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 청구서는 선생님이 발송하면 자동으로 여기에 표시됩니다.</li>
            <li>• 각 청구서에서 수업 내역을 자세히 확인할 수 있습니다.</li>
            <li>• 내역이 맞지 않는 경우 선생님에게 문의해주세요.</li>
            <li>• 결제 후 영수증은 언제든지 다시 확인할 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
