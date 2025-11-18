/**
 * Groups API - WeTee MVP
 * Feature: F-002 과외 그룹 생성 및 매칭
 *
 * Based on:
 * - API_명세서.md (6.2 F-002: 과외 그룹 생성 및 매칭)
 * - backend/app/routers/groups.py
 * - backend/app/schemas/group.py
 *
 * 역할:
 * - 그룹 관련 API 엔드포인트와 실제 백엔드 연동
 * - 백엔드 응답(snake_case)을 프론트엔드 타입(camelCase)으로 변환
 * - apiClient.ts의 apiRequest를 사용하여 인증 및 에러 처리
 */

import type {
  Group,
  CreateGroupPayload,
  UpdateGroupPayload,
  GroupListParams,
  CreateInviteCodePayload,
  InviteCode,
  JoinGroupPayload,
} from '@/types/group';

import { apiRequest } from '@/lib/apiClient';

// ==========================
// Backend Response Types (snake_case)
// ==========================

interface BackendGroupOut {
  group_id: string;
  name: string;
  subject: string;
  description?: string | null;
  owner_id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
  member_count?: number;
  members?: BackendGroupMember[];
}

interface BackendGroupMember {
  member_id: string;
  user_id: string;
  role: 'TEACHER' | 'STUDENT' | 'PARENT';
  invite_status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  joined_at: string;
}

interface BackendPaginationInfo {
  total: number;
  page: number;
  size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface BackendGroupListResponse {
  items: BackendGroupOut[];
  pagination: BackendPaginationInfo;
}

// ==========================
// Response Converters (Backend → Frontend)
// ==========================

/**
 * 백엔드 그룹 응답을 프론트엔드 Group 타입으로 변환
 *
 * 변환 내용:
 * - snake_case → camelCase
 * - owner_id → teacher 객체로 변환 (현재는 최소 정보만)
 * - 백엔드에 없는 필드는 undefined로 설정
 */
function convertBackendGroupToFrontend(backendGroup: BackendGroupOut): Group {
  return {
    groupId: backendGroup.group_id,
    name: backendGroup.name,
    subject: backendGroup.subject,
    description: backendGroup.description ?? undefined,
    teacher: {
      userId: backendGroup.owner_id,
      name: '선생님', // TODO(v2): 백엔드에서 teacher 상세 정보 포함하도록 개선
      email: undefined,
      phone: undefined,
    },
    memberCount: backendGroup.member_count ?? 0,
    members: backendGroup.members?.map((m) => ({
      userId: m.user_id,
      name: '멤버', // TODO(v2): 백엔드에서 user 상세 정보 포함
      role: m.role.toLowerCase() as 'teacher' | 'student' | 'parent',
      joinedAt: m.joined_at,
    })),
    createdAt: backendGroup.created_at,
    updatedAt: backendGroup.updated_at,
    // 백엔드에 아직 없는 필드들 (향후 추가 예정)
    level: undefined,
    feePerSession: undefined,
    sessionDuration: undefined,
    nextLessonSummary: undefined,
  };
}

/**
 * 그룹 목록 조회
 *
 * GET /api/v1/groups
 *
 * @param params 조회 파라미터 (role, page, size)
 * @returns Promise<Group[]>
 *
 * @example
 * ```ts
 * const groups = await fetchGroups({ page: 1, size: 20 });
 * ```
 */
export async function fetchGroups(
  params?: GroupListParams
): Promise<Group[]> {
  const queryParams = new URLSearchParams();

  if (params?.role && params.role !== 'all') {
    queryParams.set('role', params.role.toUpperCase());
  }
  if (params?.page) {
    queryParams.set('page', params.page.toString());
  }
  if (params?.size) {
    queryParams.set('size', params.size.toString());
  }

  const queryString = queryParams.toString();
  const path = queryString ? `/groups?${queryString}` : '/groups';

  const response = await apiRequest<BackendGroupListResponse>(path, {
    method: 'GET',
  });

  // 백엔드 응답을 프론트엔드 타입으로 변환
  return response.items.map(convertBackendGroupToFrontend);
}

/**
 * 그룹 상세 조회
 *
 * GET /api/v1/groups/{groupId}
 *
 * @param groupId 그룹 ID
 * @returns Promise<Group>
 *
 * @example
 * ```ts
 * const group = await fetchGroupById('group-123');
 * ```
 */
export async function fetchGroupById(groupId: string): Promise<Group> {
  const backendGroup = await apiRequest<BackendGroupOut>(`/groups/${groupId}`, {
    method: 'GET',
  });

  return convertBackendGroupToFrontend(backendGroup);
}

/**
 * 그룹 생성 (선생님만 가능)
 *
 * POST /api/v1/groups
 *
 * @param payload 그룹 생성 정보
 * @returns Promise<Group>
 *
 * @example
 * ```ts
 * const newGroup = await createGroup({
 *   name: '중3 수학 과외',
 *   subject: '수학',
 *   description: '수능 대비 수학 과외',
 * });
 * ```
 */
export async function createGroup(
  payload: CreateGroupPayload
): Promise<Group> {
  const backendGroup = await apiRequest<BackendGroupOut>('/groups', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      subject: payload.subject,
      description: payload.description ?? null,
      // TODO(v2): level, feePerSession, sessionDuration 백엔드 지원 후 추가
    }),
  });

  return convertBackendGroupToFrontend(backendGroup);
}

/**
 * 그룹 수정 (선생님만 가능)
 *
 * PATCH /api/v1/groups/{groupId}
 *
 * @param groupId 그룹 ID
 * @param payload 수정할 그룹 정보
 * @returns Promise<Group>
 *
 * @example
 * ```ts
 * const updated = await updateGroup('group-123', {
 *   name: '중3 수학 심화반',
 *   description: '심화 과정으로 변경',
 * });
 * ```
 */
export async function updateGroup(
  groupId: string,
  payload: UpdateGroupPayload
): Promise<Group> {
  const backendGroup = await apiRequest<BackendGroupOut>(`/groups/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: payload.name ?? undefined,
      subject: payload.subject ?? undefined,
      description: payload.description ?? undefined,
      // TODO(v2): level, feePerSession, sessionDuration 백엔드 지원 후 추가
    }),
  });

  return convertBackendGroupToFrontend(backendGroup);
}

/**
 * 그룹 삭제 (선생님만 가능)
 *
 * DELETE /api/v1/groups/{groupId}
 *
 * @param groupId 그룹 ID
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * await deleteGroup('group-123');
 * ```
 */
export async function deleteGroup(groupId: string): Promise<void> {
  await apiRequest<void>(`/groups/${groupId}`, {
    method: 'DELETE',
  });
}

// ==========================
// Invite Code Functions (TODO: Phase 2 - Backend Not Yet Implemented)
// ==========================

/**
 * 초대 코드 발급 (선생님만 가능)
 *
 * TODO(Phase 2): 백엔드 API 구현 후 연동
 * POST /api/v1/groups/{groupId}/invite-codes
 *
 * @param payload 초대 코드 발급 정보
 * @returns Promise<InviteCode>
 */
export async function createInviteCode(
  payload: CreateInviteCodePayload
): Promise<InviteCode> {
  // TODO(Phase 2): 백엔드 초대 코드 API 구현 후 활성화
  // const response = await apiRequest<InviteCode>(`/groups/${payload.groupId}/invite-codes`, {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     role: payload.role,
  //     max_uses: payload.maxUses,
  //     expires_at: payload.expiresAt,
  //     linked_student_id: payload.linkedStudentId,
  //   }),
  // });
  // return response;

  throw new Error('초대 코드 기능은 아직 구현되지 않았습니다. (Phase 2 예정)');
}

/**
 * 그룹의 초대 코드 목록 조회 (선생님만 가능)
 *
 * TODO(Phase 2): 백엔드 API 구현 후 연동
 * GET /api/v1/groups/{groupId}/invite-codes
 *
 * @param groupId 그룹 ID
 * @returns Promise<InviteCode[]>
 */
export async function fetchInviteCodesByGroup(
  groupId: string
): Promise<InviteCode[]> {
  // TODO(Phase 2): 백엔드 초대 코드 API 구현 후 활성화
  throw new Error('초대 코드 기능은 아직 구현되지 않았습니다. (Phase 2 예정)');
}

/**
 * 초대 코드로 그룹 참여 (학생/학부모)
 *
 * TODO(Phase 2): 백엔드 API 구현 후 연동
 * POST /api/v1/groups/join
 *
 * @param payload 초대 코드
 * @returns Promise<Group>
 */
export async function joinGroup(payload: JoinGroupPayload): Promise<Group> {
  // TODO(Phase 2): 백엔드 초대 코드 API 구현 후 활성화
  throw new Error('초대 코드 기능은 아직 구현되지 않았습니다. (Phase 2 예정)');
}
