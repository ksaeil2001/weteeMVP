/**
 * Group Types - WeTee MVP
 * Feature: F-002 과외 그룹 생성 및 매칭
 *
 * Based on:
 * - F-002_과외_그룹_생성_및_매칭.md
 * - API_명세서.md (6.2 F-002)
 * - 데이터베이스_설계서.md (groups, group_members, invite_codes)
 */

import type { UserRole } from '@/lib/hooks/useAuth';

/**
 * 그룹 (과외 그룹)
 */
export interface Group {
  groupId: string;
  name: string;
  subject: string;
  level?: string; // 예: "고등학교 2학년", "중3"
  feePerSession?: number; // 회당 수업료 (원)
  sessionDuration?: number; // 수업 시간 (분)
  description?: string;
  teacher: GroupTeacher;
  memberCount: number;
  members?: GroupMember[];
  nextLessonSummary?: string; // 다음 수업 요약 (예: "11/15 15:00")
  createdAt: string;
  updatedAt?: string;
}

/**
 * 그룹 선생님 정보
 */
export interface GroupTeacher {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
}

/**
 * 그룹 멤버
 */
export interface GroupMember {
  userId: string;
  name: string;
  role: UserRole;
  joinedAt: string;
  // 학부모인 경우 연결된 자녀
  linkedStudent?: {
    userId: string;
    name: string;
  };
}

/**
 * 초대 코드
 */
export interface InviteCode {
  inviteCode: string;
  groupId: string;
  role: UserRole; // 'student' | 'parent'
  maxUses: number;
  currentUses?: number;
  expiresAt: string;
  createdAt: string;
  // 학부모 초대 코드인 경우 연결된 학생
  linkedStudent?: {
    userId: string;
    name: string;
  };
}

/**
 * 그룹 생성 요청 페이로드
 */
export interface CreateGroupPayload {
  name: string;
  subject: string;
  level?: string;
  feePerSession?: number;
  sessionDuration?: number;
  description?: string;
}

/**
 * 초대 코드 발급 요청 페이로드
 */
export interface CreateInviteCodePayload {
  groupId: string;
  role: UserRole;
  maxUses?: number;
  expiresAt?: string;
  // 학부모 초대 시 필수
  linkedStudentId?: string;
}

/**
 * 초대 코드로 그룹 참여 요청 페이로드
 */
export interface JoinGroupPayload {
  inviteCode: string;
}

/**
 * 그룹 수정 요청 페이로드
 */
export interface UpdateGroupPayload {
  name?: string;
  subject?: string;
  level?: string;
  feePerSession?: number;
  sessionDuration?: number;
  description?: string;
}

/**
 * 그룹 목록 조회 쿼리 파라미터
 */
export interface GroupListParams {
  role?: 'all' | 'teacher' | 'student' | 'parent';
  page?: number;
  size?: number;
}
