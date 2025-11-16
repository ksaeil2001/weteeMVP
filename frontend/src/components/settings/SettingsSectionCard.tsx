// Step 10: 설정 섹션 카드 컴포넌트

import React from 'react';
import type { SettingsSectionMeta, SettingsToggleOption } from '@/types/settings';
import SettingsToggleItem from './SettingsToggleItem';

interface SettingsSectionCardProps {
  section: SettingsSectionMeta;
  options: SettingsToggleOption[];
}

/**
 * SettingsSectionCard
 *
 * 설정 섹션(계정, 알림, 과외 운영 등)을 카드 형태로 묶어서 표시
 * 섹션 제목/설명 + 내부 토글 옵션 리스트를 렌더링
 *
 * @param section - 섹션 메타데이터 (제목, 설명 등)
 * @param options - 섹션 내 토글 옵션 리스트
 */
const SettingsSectionCard: React.FC<SettingsSectionCardProps> = ({
  section,
  options,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      {/* 섹션 헤더 */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900">
          {section.title}
        </h2>
        <p className="text-sm text-gray-600 mt-1">{section.description}</p>
      </div>

      {/* 옵션 리스트 */}
      {options.length > 0 && (
        <div className="divide-y divide-gray-200">
          {options.map((option) => (
            <SettingsToggleItem key={option.id} option={option} />
          ))}
        </div>
      )}

      {/* 옵션이 없는 경우 */}
      {options.length === 0 && (
        <div className="text-sm text-gray-500 italic py-2">
          설정 항목이 없습니다.
        </div>
      )}
    </div>
  );
};

export default SettingsSectionCard;
