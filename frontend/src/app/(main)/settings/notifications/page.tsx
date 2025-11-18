'use client';

/**
 * Notification Settings Page - WeTee MVP
 * Feature: F-007 기본 프로필 및 설정 + F-008 필수 알림 시스템
 * Screen: S-037 (알림 설정 화면)
 * Route: /settings/notifications
 *
 * TODO(F-007): 실제 API 연동
 * - fetchNotificationSettings() 호출
 * - updateNotificationSettings() 호출
 * - 자동 저장 기능 구현
 */

import React, { useState, useEffect } from 'react';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from '@/lib/api/settings';
import type { NotificationSettings } from '@/types/settings';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await fetchNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error('알림 설정 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }

  // 채널 토글 (push/email)
  async function handleChannelToggle(
    channel: 'push_enabled' | 'email_enabled',
    value: boolean
  ) {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      [channel]: value,
    };
    setSettings(updatedSettings);

    try {
      setSaving(true);
      const result = await updateNotificationSettings({ [channel]: value });
      setSettings(result);
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      setSettings(settings);
      alert('설정 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  // 카테고리별 알림 토글
  async function handleCategoryToggle(category: string, value: boolean) {
    if (!settings) return;

    const updatedCategories = {
      ...settings.notification_categories,
      [category]: value,
    };

    const updatedSettings = {
      ...settings,
      notification_categories: updatedCategories,
    };
    setSettings(updatedSettings);

    try {
      setSaving(true);
      const result = await updateNotificationSettings({
        notification_categories: updatedCategories,
      });
      setSettings(result);
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      setSettings(settings);
      alert('설정 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  // 야간 모드 토글
  async function handleNightModeToggle(value: boolean) {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      night_mode_enabled: value,
    };
    setSettings(updatedSettings);

    try {
      setSaving(true);
      const result = await updateNotificationSettings({
        night_mode_enabled: value,
      });
      setSettings(result);
    } catch (error) {
      console.error('야간 모드 설정 저장 실패:', error);
      setSettings(settings);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  // 야간 시간 변경
  async function handleTimeChange(
    key: 'night_mode_start' | 'night_mode_end',
    value: string
  ) {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(updatedSettings);

    try {
      setSaving(true);
      const result = await updateNotificationSettings({ [key]: value });
      setSettings(result);
    } catch (error) {
      console.error('시간 설정 저장 실패:', error);
      setSettings(settings);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">알림 설정을 불러오는 중...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">알림 설정을 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 페이지 헤더 */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
        <p className="text-sm text-gray-600 mt-1">
          알림 수신 방법을 설정합니다. 변경사항은 자동으로 저장됩니다.
        </p>
        {saving && (
          <p className="text-sm text-blue-600 mt-2">저장 중...</p>
        )}
      </div>

      {/* 알림 채널 설정 */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">알림 채널 설정</h2>
        <div className="space-y-4">
          <ToggleItem
            label="푸시 알림"
            description="모바일 앱 또는 브라우저 푸시 알림"
            checked={settings.push_enabled}
            onChange={(checked) => handleChannelToggle('push_enabled', checked)}
          />

          <ToggleItem
            label="이메일 알림"
            description="이메일로 알림 수신"
            checked={settings.email_enabled}
            onChange={(checked) =>
              handleChannelToggle('email_enabled', checked)
            }
          />
        </div>
      </div>

      {/* 카테고리별 알림 설정 */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">카테고리별 알림</h2>
        <div className="space-y-4">
          <ToggleItem
            label="일정 알림"
            description="수업 일정 변경 및 리마인더"
            checked={settings.notification_categories.schedule}
            onChange={(checked) => handleCategoryToggle('schedule', checked)}
            disabled={!settings.push_enabled && !settings.email_enabled}
          />

          <ToggleItem
            label="출결 알림"
            description="출결 수정 및 변동 알림"
            checked={settings.notification_categories.attendance}
            onChange={(checked) => handleCategoryToggle('attendance', checked)}
            disabled={!settings.push_enabled && !settings.email_enabled}
          />

          <ToggleItem
            label="정산 알림 (끌 수 없음)"
            description="청구서 발행, 결제 완료 등 정산 관련 알림"
            checked={settings.notification_categories.payment}
            onChange={() => {}}
            disabled={true}
            notice="정산 알림은 중요하므로 끌 수 없습니다"
          />

          <ToggleItem
            label="그룹 알림"
            description="그룹 초대 및 멤버 변동 알림"
            checked={settings.notification_categories.group}
            onChange={(checked) => handleCategoryToggle('group', checked)}
            disabled={!settings.push_enabled && !settings.email_enabled}
          />
        </div>
      </div>

      {/* 야간 알림 제한 */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">야간 알림 제한</h2>

        <ToggleItem
          label="야간에는 알림을 받지 않습니다"
          description="설정한 시간 동안 알림이 발송되지 않습니다"
          checked={settings.night_mode_enabled}
          onChange={(checked) => handleNightModeToggle(checked)}
          disabled={!settings.push_enabled && !settings.email_enabled}
        />

        {settings.night_mode_enabled && (
          <div className="mt-4 pl-6 space-y-3 border-l-2 border-blue-500">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 시간
              </label>
              <input
                type="time"
                value={settings.night_mode_start}
                onChange={(e) =>
                  handleTimeChange('night_mode_start', e.target.value)
                }
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 시간
              </label>
              <input
                type="time"
                value={settings.night_mode_end}
                onChange={(e) =>
                  handleTimeChange('night_mode_end', e.target.value)
                }
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-sm text-gray-600">
              {settings.night_mode_start}부터 {settings.night_mode_end}까지
              알림이 발송되지 않으며, 대신 종료 직후 요약 알림이 발송됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
        <p className="text-green-900">
          <strong>✓ F-007 & F-008 알림 설정 - 백엔드 연동 완료</strong>
        </p>
        <p className="text-green-800 mt-1">
          변경사항은 자동으로 저장되며 즉시 적용됩니다. 정산 알림은 중요하므로
          끌 수 없습니다.
        </p>
      </div>
    </div>
  );
}

// 토글 항목 컴포넌트
function ToggleItem({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  notice,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  notice?: string;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        {notice && (
          <p className="text-sm text-yellow-700 mt-1 bg-yellow-50 px-2 py-1 rounded">
            {notice}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          disabled
            ? 'bg-gray-300 cursor-not-allowed'
            : checked
            ? 'bg-blue-600'
            : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
