// Step 10: 설정 토글 항목 컴포넌트

import React from 'react';
import type { SettingsToggleOption } from '@/types/settings';

interface SettingsToggleItemProps {
  option: SettingsToggleOption;
}

/**
 * SettingsToggleItem
 *
 * 개별 설정 항목(예: "정산 알림 받기")을 표시하는 토글형 UI 컴포넌트
 * 아직 실제 onClick 동작은 없이 UI만 구현 (presentational component)
 *
 * @param option - 설정 토글 옵션
 */
const SettingsToggleItem: React.FC<SettingsToggleItemProps> = ({ option }) => {
  const isOn = option.enabled;

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      {/* 좌측 영역: 라벨 및 설명 */}
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{option.label}</div>
        {option.description && (
          <div className="text-xs text-gray-600 mt-0.5">
            {option.description}
          </div>
        )}
      </div>

      {/* 우측 영역: 토글 버튼 */}
      <button
        type="button"
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          isOn ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        aria-pressed={isOn}
        aria-label={`${option.label} 토글`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            isOn ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default SettingsToggleItem;
