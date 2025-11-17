'use client';

/**
 * Profile Settings Page - WeTee MVP
 * Feature: F-007 기본 프로필 및 설정
 * Screen: S-034, S-035 (프로필 화면, 프로필 수정 화면)
 * Route: /settings/profile
 *
 * TODO(F-007): 실제 API 연동
 * - fetchUserProfile() 호출
 * - updateUserProfile() 호출
 * - uploadProfileImage() 호출
 */

import React, { useState, useEffect } from 'react';
import {
  fetchUserProfile,
  updateUserProfile,
  uploadProfileImage,
} from '@/lib/api/settings';
import type { FullUserProfile, TeacherProfile } from '@/types/settings';

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<FullUserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 수정 중인 값
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedIntroduction, setEditedIntroduction] = useState('');

  // 프로필 로드
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await fetchUserProfile();
      setProfile(data);
      setEditedName(data.name);
      setEditedPhone(data.phone || '');
      if (data.role === 'TEACHER' && data.profile) {
        const teacherProfile = data.profile as TeacherProfile;
        setEditedIntroduction(teacherProfile.introduction || '');
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }

  // 수정 모드 진입
  function handleEdit() {
    setIsEditing(true);
  }

  // 수정 취소
  function handleCancel() {
    if (profile) {
      setEditedName(profile.name);
      setEditedPhone(profile.phone || '');
      if (profile.role === 'TEACHER' && profile.profile) {
        const teacherProfile = profile.profile as TeacherProfile;
        setEditedIntroduction(teacherProfile.introduction || '');
      }
    }
    setIsEditing(false);
  }

  // 프로필 저장
  async function handleSave() {
    if (!profile) return;

    try {
      setSaving(true);

      const payload: any = {
        name: editedName,
        phone: editedPhone || null,
      };

      // 선생님인 경우 소개 포함
      if (profile.role === 'TEACHER') {
        payload.profile = {
          introduction: editedIntroduction,
        };
      }

      const updated = await updateUserProfile(payload);
      setProfile(updated);
      setIsEditing(false);

      alert('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      alert('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  // 프로필 사진 업로드 (간단한 버전)
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
      return;
    }

    // 파일 형식 체크
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('JPG 또는 PNG 파일만 업로드 가능합니다.');
      return;
    }

    try {
      const result = await uploadProfileImage(file);
      if (profile) {
        setProfile({
          ...profile,
          profile_image_url: result.profile_image_url,
        });
      }
      alert('프로필 사진이 업데이트되었습니다.');
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">프로필을 불러오는 중...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">프로필을 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 페이지 헤더 */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">프로필 설정</h1>
        <p className="text-sm text-gray-600 mt-1">
          프로필 정보를 관리합니다.
        </p>
      </div>

      {/* 프로필 사진 */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">프로필 사진</h2>
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt="프로필"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                {profile.name[0]}
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="profile-image"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
            >
              사진 변경
            </label>
            <input
              id="profile-image"
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleImageUpload}
            />
            <p className="text-sm text-gray-500 mt-2">
              JPG 또는 PNG 파일, 최대 10MB
            </p>
          </div>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">기본 정보</h2>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              수정
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={50}
              />
            ) : (
              <p className="text-gray-900">{profile.name}</p>
            )}
          </div>

          {/* 이메일 (읽기 전용) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 (읽기 전용)
            </label>
            <p className="text-gray-500">{profile.email}</p>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editedPhone}
                onChange={(e) => setEditedPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.phone || '미설정'}</p>
            )}
          </div>

          {/* 역할 (읽기 전용) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              역할
            </label>
            <p className="text-gray-900">
              {profile.role === 'TEACHER'
                ? '선생님'
                : profile.role === 'STUDENT'
                ? '학생'
                : '학부모'}
            </p>
          </div>

          {/* 선생님 전용: 자기소개 */}
          {profile.role === 'TEACHER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                자기소개
              </label>
              {isEditing ? (
                <textarea
                  value={editedIntroduction}
                  onChange={(e) => setEditedIntroduction(e.target.value)}
                  placeholder="자기소개를 입력하세요"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  maxLength={500}
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">
                  {(profile.profile as TeacherProfile)?.introduction ||
                    '미설정'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 수정 모드 액션 버튼 */}
        {isEditing && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 border rounded-lg transition-colors"
              disabled={saving}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400"
              disabled={saving || !editedName.trim()}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-blue-900">
          <strong>ℹ️ F-007 프로필 설정</strong>
        </p>
        <p className="text-blue-800 mt-1">
          현재 목업 데이터로 동작합니다. 실제 API 연동 시 변경사항이 서버에
          저장됩니다.
        </p>
      </div>
    </div>
  );
}
