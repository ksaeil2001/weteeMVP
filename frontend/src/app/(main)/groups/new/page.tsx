/**
 * Create Group Page - WeTee MVP
 * Screen: S-006 (그룹 생성 화면)
 * Route: /groups/new
 *
 * Based on:
 * - F-002_과외_그룹_생성_및_매칭.md (시나리오 1)
 * - UX_UI_설계서.md (S-006)
 * - API_명세서.md (6.2.1 그룹 생성)
 *
 * 역할:
 * - 선생님이 새로운 과외 그룹을 생성
 * - 필수 입력: 그룹 이름, 과목
 * - 선택 입력: 학년, 수업료, 수업 시간, 설명
 *
 * TODO (향후 디버깅/연결 단계):
 * - 실제 그룹 생성 API 연동 (createGroup)
 * - 입력 유효성 검증 강화
 * - 에러 핸들링 개선
 * - 토스트 알림 추가
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { createGroup } from '@/lib/api/groups';
import type { CreateGroupPayload } from '@/types/group';

// 과목 선택 옵션 (F-002 명세서 기준)
const SUBJECTS = ['국어', '영어', '수학', '과학', '사회', '기타'];

export default function CreateGroupPage() {
  const router = useRouter();
  const { currentRole } = useAuth();

  const [formData, setFormData] = useState<CreateGroupPayload>({
    name: '',
    subject: '',
    level: '',
    feePerSession: undefined,
    sessionDuration: undefined,
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 선생님이 아니면 접근 불가
  if (currentRole !== 'teacher') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            권한이 없습니다
          </h2>
          <p className="text-sm text-gray-600">
            그룹 생성은 선생님만 가능합니다.
          </p>
          <button
            type="button"
            onClick={() => router.push('/groups')}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← 그룹 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 입력 핸들러
  const handleChange = (
    field: keyof CreateGroupPayload,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 그룹 생성 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 입력 검증
    if (!formData.name.trim()) {
      setError('그룹 이름을 입력해주세요.');
      return;
    }

    if (!formData.subject) {
      setError('과목을 선택해주세요.');
      return;
    }

    // 그룹 이름 길이 검증 (F-002 비즈니스 규칙)
    if (formData.name.trim().length < 2) {
      setError('그룹 이름은 2자 이상 입력해주세요.');
      return;
    }

    if (formData.name.trim().length > 50) {
      setError('그룹 이름은 50자 이하로 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // 그룹 생성 API 호출
      const newGroup = await createGroup({
        name: formData.name.trim(),
        subject: formData.subject,
        level: formData.level?.trim() || undefined,
        feePerSession: formData.feePerSession || undefined,
        sessionDuration: formData.sessionDuration || undefined,
        description: formData.description?.trim() || undefined,
      });

      console.log('[CreateGroupPage] 그룹 생성 성공:', newGroup);

      // 그룹 상세 페이지로 이동
      router.push(`/groups/${newGroup.groupId}`);
    } catch (err) {
      console.error('[CreateGroupPage] 그룹 생성 실패:', err);
      setError('그룹 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 취소 버튼
  const handleCancel = () => {
    router.push('/groups');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">과외 그룹 만들기</h1>
        <p className="mt-1 text-sm text-gray-500">
          새로운 과외 그룹을 만들고 학생을 초대하세요.
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 그룹 생성 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* 그룹 이름 (필수) */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            그룹 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="예) 이학생 수학 과외, 고3 영어반"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            maxLength={50}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            나중에 변경 가능합니다. (2-50자)
          </p>
        </div>

        {/* 과목 (필수) */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            과목 <span className="text-red-500">*</span>
          </label>
          <select
            id="subject"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">과목을 선택하세요</option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* 학년/레벨 (선택) */}
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
            대상 학년
          </label>
          <input
            type="text"
            id="level"
            value={formData.level || ''}
            onChange={(e) => handleChange('level', e.target.value)}
            placeholder="예) 중3, 고2, 초6"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* 수업료 (선택) */}
        <div>
          <label htmlFor="feePerSession" className="block text-sm font-medium text-gray-700 mb-1">
            수업료 (회당)
          </label>
          <div className="relative">
            <input
              type="number"
              id="feePerSession"
              value={formData.feePerSession || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                handleChange('feePerSession', value);
              }}
              placeholder="50000"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min={0}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              원
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            나중에 입력하거나 수정할 수 있습니다.
          </p>
        </div>

        {/* 기본 수업 시간 (선택) */}
        <div>
          <label htmlFor="sessionDuration" className="block text-sm font-medium text-gray-700 mb-1">
            기본 수업 시간
          </label>
          <div className="relative">
            <input
              type="number"
              id="sessionDuration"
              value={formData.sessionDuration || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                handleChange('sessionDuration', value);
              }}
              placeholder="90"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min={0}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              분
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            일정 등록 시 기본값으로 사용됩니다.
          </p>
        </div>

        {/* 설명 (선택) */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            그룹 설명
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="예) 수능 대비 수학 과외"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.description?.length || 0} / 500자
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.name.trim() || !formData.subject}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '생성 중...' : '그룹 만들기'}
          </button>
        </div>
      </form>

      {/* 개발 안내 */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
        <p className="font-semibold text-green-900 mb-1">
          ✅ F-002 그룹 생성 - 백엔드 API 연동 완료
        </p>
        <p className="text-green-800">
          실제 백엔드 API(/api/v1/groups)와 연동되어 있습니다. 그룹 생성 시 데이터베이스에 저장됩니다.
        </p>
      </div>
    </div>
  );
}
