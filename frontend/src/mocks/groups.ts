/**
 * Mock Groups Data - WeTee MVP
 * Feature: F-002 과외 그룹 생성 및 매칭
 *
 * 역할:
 * - 개발/테스트 단계에서 사용할 목업 데이터 제공
 * - 실제 API 연동 전까지 UI 플로우 검증용
 *
 * TODO:
 * - 실제 API 연동 시 이 파일은 삭제하고 API 레이어로 교체
 */

import type { Group, GroupMember, InviteCode } from '@/types/group';

/**
 * 목업 그룹 목록 (선생님 기준)
 */
export const mockGroups: Group[] = [
  {
    groupId: 'group-1',
    name: '이학생 수학 과외',
    subject: '수학',
    level: '중3',
    feePerSession: 50000,
    sessionDuration: 90,
    description: '수능 대비 수학 과외',
    teacher: {
      userId: 'teacher-1',
      name: '김선생',
      email: 'teacher@example.com',
      phone: '010-1234-5678',
    },
    memberCount: 2, // 학생 1명 + 학부모 1명
    nextLessonSummary: '11/15 (수) 15:00',
    createdAt: '2025-11-01T09:00:00Z',
    updatedAt: '2025-11-12T09:30:00Z',
  },
  {
    groupId: 'group-2',
    name: '최학생 영어 과외',
    subject: '영어',
    level: '고1',
    feePerSession: 60000,
    sessionDuration: 120,
    description: '내신 영어 대비',
    teacher: {
      userId: 'teacher-1',
      name: '김선생',
      email: 'teacher@example.com',
    },
    memberCount: 1, // 학생 1명
    nextLessonSummary: '11/16 (목) 19:00',
    createdAt: '2025-11-05T10:00:00Z',
    updatedAt: '2025-11-10T14:00:00Z',
  },
  {
    groupId: 'group-3',
    name: '박학생 수학 과외',
    subject: '수학',
    level: '고2',
    feePerSession: 55000,
    sessionDuration: 100,
    description: undefined,
    teacher: {
      userId: 'teacher-1',
      name: '김선생',
    },
    memberCount: 0, // 학생 초대 대기 중
    nextLessonSummary: undefined,
    createdAt: '2025-11-10T08:00:00Z',
  },
];

/**
 * 목업 그룹 멤버 목록 (그룹 상세에서 사용)
 */
export const mockGroupMembers: Record<string, GroupMember[]> = {
  'group-1': [
    {
      userId: 'student-1',
      name: '이학생',
      role: 'student',
      joinedAt: '2025-11-02T10:00:00Z',
    },
    {
      userId: 'parent-1',
      name: '이학부모',
      role: 'parent',
      joinedAt: '2025-11-03T14:00:00Z',
      linkedStudent: {
        userId: 'student-1',
        name: '이학생',
      },
    },
  ],
  'group-2': [
    {
      userId: 'student-2',
      name: '최학생',
      role: 'student',
      joinedAt: '2025-11-06T09:00:00Z',
    },
  ],
  'group-3': [],
};

/**
 * 목업 초대 코드 목록 (그룹별)
 */
export const mockInviteCodes: Record<string, InviteCode[]> = {
  'group-3': [
    {
      inviteCode: 'AB12CD',
      groupId: 'group-3',
      role: 'student',
      maxUses: 1,
      currentUses: 0,
      expiresAt: '2025-11-17T23:59:59Z',
      createdAt: '2025-11-10T08:30:00Z',
    },
  ],
};

/**
 * 특정 그룹 ID로 그룹 정보 조회 (목업)
 */
export function getMockGroupById(groupId: string): Group | null {
  const group = mockGroups.find((g) => g.groupId === groupId);
  if (!group) return null;

  // members 추가
  return {
    ...group,
    members: mockGroupMembers[groupId] || [],
  };
}

/**
 * 선생님의 그룹 목록 조회 (목업)
 */
export function getMockGroupsByTeacher(): Group[] {
  return mockGroups;
}

/**
 * 학생/학부모의 그룹 목록 조회 (목업)
 */
export function getMockGroupsByStudent(_userId: string): Group[] {
  // 실제로는 userId를 기준으로 필터링하지만, 목업에서는 단순화
  return mockGroups.filter((g) => g.memberCount > 0);
}

/**
 * 그룹의 초대 코드 목록 조회 (목업)
 */
export function getMockInviteCodesByGroup(groupId: string): InviteCode[] {
  return mockInviteCodes[groupId] || [];
}
