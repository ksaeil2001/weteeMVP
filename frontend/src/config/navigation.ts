/**
 * Navigation Configuration - WeTee MVP
 *
 * 역할별 사이드바 메뉴 구성
 * Based on: UX_UI_설계서.md Section 3.2 (네비게이션 구조)
 *
 * 역할별 메뉴:
 * - teacher: 선생님 (그룹 생성, 출결 관리, 수업 기록, 청구서 생성 등)
 * - student: 학생 (수업 일정, 수업 기록 조회, 숙제 등)
 * - parent: 학부모 (수업 일정, 수업 기록 조회, 결제 등)
 *
 * TODO (향후 확장):
 * - 아이콘을 이모지에서 실제 아이콘 라이브러리로 교체 (SF Symbols, Material Icons)
 * - 권한 기반 메뉴 표시 제어 (특정 기능 on/off)
 * - 메뉴 뱃지 (읽지 않은 알림 개수 등)
 * - 서브메뉴/중첩 메뉴 구조
 */

export interface NavItem {
  id: string;
  label: string;
  icon: string; // 현재는 이모지, 향후 아이콘 컴포넌트로 교체
  path: string;
  description?: string;
}

/**
 * 선생님 메뉴
 * 기능: 그룹 생성, 일정 관리, 출결 체크, 수업 기록, 청구서 발송, 정산 통계
 */
export const teacherNavigation: NavItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: '🏠',
    path: '/',
    description: '대시보드 - 오늘의 수업과 요약',
  },
  {
    id: 'groups',
    label: '그룹 관리',
    icon: '👥',
    path: '/groups',
    description: '과외 그룹 생성 및 관리',
  },
  {
    id: 'schedule',
    label: '수업 일정',
    icon: '📅',
    path: '/schedule',
    description: '정규 수업 및 보강 일정',
  },
  {
    id: 'attendance',
    label: '출결 관리',
    icon: '✅',
    path: '/attendance',
    description: '출석/결석/보강 체크',
  },
  {
    id: 'lessons',
    label: '수업 기록',
    icon: '📝',
    path: '/lessons',
    description: '수업 내용 및 진도 기록',
  },
  {
    id: 'payments',
    label: '정산',
    icon: '💰',
    path: '/payments',
    description: '청구서 생성 및 수업료 정산',
  },
  {
    id: 'notifications',
    label: '알림',
    icon: '🔔',
    path: '/notifications',
    description: '알림 센터',
  },
  {
    id: 'settings',
    label: '설정',
    icon: '⚙️',
    path: '/settings',
    description: '프로필 및 앱 설정',
  },
];

/**
 * 학생 메뉴
 * 기능: 수업 일정 조회, 보강 예약, 수업 기록 조회, 숙제 확인
 */
export const studentNavigation: NavItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: '🏠',
    path: '/',
    description: '대시보드 - 오늘의 수업과 숙제',
  },
  {
    id: 'schedule',
    label: '수업 일정',
    icon: '📅',
    path: '/schedule',
    description: '수업 일정 및 보강 예약',
  },
  {
    id: 'lessons',
    label: '수업 기록',
    icon: '📝',
    path: '/lessons',
    description: '수업 내용 및 숙제 확인',
  },
  {
    id: 'progress',
    label: '진도 현황',
    icon: '📊',
    path: '/progress',
    description: '학습 진도 및 통계',
  },
  {
    id: 'notifications',
    label: '알림',
    icon: '🔔',
    path: '/notifications',
    description: '알림 센터',
  },
  {
    id: 'settings',
    label: '설정',
    icon: '⚙️',
    path: '/settings',
    description: '프로필 및 앱 설정',
  },
];

/**
 * 학부모 메뉴
 * 기능: 수업 일정 조회, 수업 기록 조회, 수업료 결제, 정산 내역
 */
export const parentNavigation: NavItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: '🏠',
    path: '/',
    description: '대시보드 - 자녀 수업 요약',
  },
  {
    id: 'schedule',
    label: '수업 일정',
    icon: '📅',
    path: '/schedule',
    description: '수업 일정 확인',
  },
  {
    id: 'lessons',
    label: '수업 기록',
    icon: '📝',
    path: '/lessons',
    description: '수업 내용 및 진도 확인',
  },
  {
    id: 'payments',
    label: '결제/정산',
    icon: '💰',
    path: '/payments',
    description: '청구서 및 결제 내역',
  },
  {
    id: 'notifications',
    label: '알림',
    icon: '🔔',
    path: '/notifications',
    description: '알림 센터',
  },
  {
    id: 'settings',
    label: '설정',
    icon: '⚙️',
    path: '/settings',
    description: '프로필 및 앱 설정',
  },
];

/**
 * 역할에 따른 네비게이션 반환
 * @param role - 사용자 역할 (teacher | student | parent)
 * @returns 해당 역할의 메뉴 배열
 */
export function getNavigationByRole(
  role: 'teacher' | 'student' | 'parent' | null | undefined
): NavItem[] {
  switch (role) {
    case 'teacher':
      return teacherNavigation;
    case 'student':
      return studentNavigation;
    case 'parent':
      return parentNavigation;
    default:
      // 역할 정보가 없을 때는 teacher 메뉴를 기본값으로 사용
      return teacherNavigation;
  }
}
