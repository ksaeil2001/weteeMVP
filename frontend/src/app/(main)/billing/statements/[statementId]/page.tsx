/**
 * Billing Statement Detail Page - 정산서 상세
 * Screen ID: S-029 (청구서 상세), S-042 (정산서 상세)
 * Feature: F-006 수업료 정산
 *
 * 역할:
 * - 정산서의 상세 정보 표시 (학생, 그룹, 기간, 금액 등)
 * - 정산 항목 리스트 (수업별 상세)
 * - 상태 변경 액션 (선생님)
 * - 결제하기 액션 (학부모)
 *
 * 권한:
 * - TEACHER: 모든 정보 및 상태 변경 가능
 * - PARENT/STUDENT: 조회만 가능
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BillingStatement } from '@/types/billing';
import { fetchBillingStatementById, updateBillingStatus } from '@/lib/api/billing';

export default function BillingStatementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const statementId = params.statementId as string;

  const [statement, setStatement] = useState<BillingStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // TODO(F-006): useAuth 훅으로 실제 role 가져오기
  // 임시로 'TEACHER'로 설정 (실제로는 인증된 사용자의 role 사용)
  const [mockRole] = useState<'TEACHER' | 'PARENT' | 'STUDENT'>('TEACHER');

  useEffect(() => {
    loadStatement();
  }, [statementId]);

  async function loadStatement() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBillingStatementById(statementId);
      setStatement(data);
    } catch (err) {
      console.error('정산서 로딩 실패:', err);
      setError('정산서를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!statement) return;
    if (
      !confirm(
        `정산서 상태를 "${newStatus}"(으)로 변경하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      setUpdating(true);
      const updated = await updateBillingStatus({
        statementId: statement.id,
        status: newStatus as any,
      });
      setStatement(updated);
      alert('상태가 변경되었습니다.');
    } catch (err) {
      console.error('상태 변경 실패:', err);
      alert('상태 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
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
        return '발행됨';
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
          <p className="mt-4 text-gray-600">정산서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !statement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '정산서를 찾을 수 없습니다'}</p>
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
            <h1 className="text-2xl font-bold text-gray-900">정산서 상세</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-mono text-blue-600">
              {statement.statementNumber}
            </span>
            <span
              className={`px-3 py-1 text-sm font-medium rounded ${getStatusBadgeClass(
                statement.status
              )}`}
            >
              {getStatusLabel(statement.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Summary Card */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">학생 정보</h3>
              <p className="text-lg font-semibold text-gray-900">{statement.studentName}</p>
              <p className="text-sm text-gray-600">{statement.groupName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">선생님</h3>
              <p className="text-lg font-semibold text-gray-900">{statement.teacherName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">정산 기간</h3>
              <p className="text-gray-900">
                {new Date(statement.periodFrom).toLocaleDateString('ko-KR')} ~{' '}
                {new Date(statement.periodTo).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">총 수업 횟수</h3>
              <p className="text-gray-900">{statement.items.length}회</p>
            </div>
          </div>

          {statement.issuedAt && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">발행일</h3>
                <p className="text-gray-900">
                  {new Date(statement.issuedAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              {statement.dueDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">지불 기한</h3>
                  <p className="text-gray-900">
                    {new Date(statement.dueDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              )}
            </div>
          )}

          {statement.memo && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-600 mb-2">메모</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{statement.memo}</p>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">수업 내역</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    설명
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    단가
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    수량
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    금액
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statement.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(item.date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.description}</div>
                      {item.memo && (
                        <div className="text-xs text-gray-500 mt-1">{item.memo}</div>
                      )}
                      {item.adjustmentReason && (
                        <div className="text-xs text-yellow-600 mt-1">
                          {item.adjustmentReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {item.unitPrice.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {item.amount.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">소계</span>
              <span className="text-gray-900 font-medium">
                {statement.subtotal.toLocaleString()}원
              </span>
            </div>
            {statement.discountTotal !== 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">할인</span>
                <span className="text-red-600 font-medium">
                  {statement.discountTotal.toLocaleString()}원
                </span>
              </div>
            )}
            {statement.adjustmentTotal !== 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">조정/이월</span>
                <span
                  className={`font-medium ${
                    statement.adjustmentTotal > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {statement.adjustmentTotal.toLocaleString()}원
                </span>
              </div>
            )}
            <div className="pt-3 border-t flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">총 청구 금액</span>
              <span className="text-2xl font-bold text-blue-600">
                {statement.totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {mockRole === 'TEACHER' && (
            <>
              {statement.status === 'DRAFT' && (
                <button
                  onClick={() => handleStatusChange('ISSUED')}
                  disabled={updating}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? '처리 중...' : '청구서 발송'}
                </button>
              )}
              {statement.status === 'ISSUED' && (
                <button
                  onClick={() => handleStatusChange('PAID')}
                  disabled={updating}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? '처리 중...' : '입금 확인'}
                </button>
              )}
              {statement.status === 'PAID' && (
                <button
                  onClick={() => handleStatusChange('SETTLED')}
                  disabled={updating}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {updating ? '처리 중...' : '정산 완료'}
                </button>
              )}
            </>
          )}

          {(mockRole === 'PARENT' || mockRole === 'STUDENT') &&
            (statement.status === 'ISSUED' || statement.status === 'OVERDUE') && (
              <button
                onClick={() => router.push(`/billing/payment/${statement.id}`)}
                className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                결제하기
              </button>
            )}

          {statement.status === 'PAID' || statement.status === 'SETTLED' ? (
            <Link
              href={`/billing/receipts/${statement.id}`}
              className="flex-1 px-6 py-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              영수증 보기
            </Link>
          ) : null}

          <button
            onClick={() => alert('PDF 다운로드 기능은 추후 구현 예정입니다.')}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            PDF 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}
