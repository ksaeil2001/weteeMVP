// Step 10: 설정 관리 타입 기본 정의
// TODO: 현재는 mock 데이터 및 UI 레벨에서만 사용, 추후 API/DB 기반 설정 모델로 확장 예정

/**
 * 설정 카테고리 (분류)
 * - account: 계정 관련 설정
 * - notifications: 알림 관련 설정
 * - billing: 정산/결제 관련 설정
 * - classroom: 과외 운영 관련 설정
 */
export type SettingsCategory = 'account' | 'notifications' | 'billing' | 'classroom';

/**
 * 설정 섹션 메타데이터
 */
export interface SettingsSectionMeta {
  id: string;                  // 섹션 식별자
  category: SettingsCategory;  // 설정 카테고리
  title: string;               // 섹션 제목
  description: string;         // 섹션 설명 문구
}

/**
 * 설정 토글 옵션 (개별 설정 항목)
 */
export interface SettingsToggleOption {
  id: string;          // 옵션 식별자
  label: string;       // 옵션 라벨
  description?: string;// 옵션 설명
  enabled: boolean;    // 현재 활성화 여부 (mock)
}

// TODO:
// - SettingsUpdatePayload (설정 변경 요청 payload)
// - SettingsSectionWithOptions (섹션 + 항목 묶음 타입)
// - SettingsLoadResponse (초기 설정 로딩 응답 타입)
// - SettingsAuditLogItem (설정 변경 이력용 타입)
