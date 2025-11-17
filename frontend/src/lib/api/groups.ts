/**
 * Groups API - WeTee MVP
 * Feature: F-002 과외 그룹 생성 및 매칭
 *
 * Based on:
 * - API_명세서.md (6.2 F-002: 과외 그룹 생성 및 매칭)
 *
 * 역할:
 * - 그룹 관련 API 엔드포인트 시그니처 정의
 * - 현재는 목업 데이터 반환 (실제 API 연동 전)
 *
 * TODO (F-002 디버깅/연결 단계):
 * - 실제 FastAPI 백엔드 /api/v1/groups 엔드포인트와 연결
 * - apiClient.ts의 apiRequest를 사용하여 네트워크 요청
 * - 에러 핸들링 강화 (네트워크 오류, 권한 오류 등)
 * - 페이지네이션 처리
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

import {
  getMockGroupsByTeacher,
  getMockGroupById,
  getMockInviteCodesByGroup,
} from '@/mocks/groups';

/**
 * 그룹 목록 조회
 *
 * TODO(F-002): 실제 API 연동
 * - GET /api/v1/groups?role=all&page=1&size=20
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: { items: Group[], pagination: {...} } }
 *
 * @param params 조회 파라미터 (role, page, size)
 * @returns Promise<Group[]>
 */
export async function fetchGroups(
  params?: GroupListParams
): Promise<Group[]> {
  // TODO(F-002): 실제 API 호출
  // const response = await apiRequest<{ items: Group[] }>('GET', '/api/v1/groups', { params });
  // return response.items;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchGroups] 목업 데이터 반환:', params);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMockGroupsByTeacher());
    }, 300); // 네트워크 지연 시뮬레이션
  });
}

/**
 * 그룹 상세 조회
 *
 * TODO(F-002): 실제 API 연동
 * - GET /api/v1/groups/{groupId}
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: Group }
 *
 * @param groupId 그룹 ID
 * @returns Promise<Group>
 */
export async function fetchGroupById(groupId: string): Promise<Group> {
  // TODO(F-002): 실제 API 호출
  // const response = await apiRequest<Group>('GET', `/api/v1/groups/${groupId}`);
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchGroupById] 목업 데이터 반환:', groupId);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const group = getMockGroupById(groupId);
      if (group) {
        resolve(group);
      } else {
        reject(new Error('그룹을 찾을 수 없습니다.'));
      }
    }, 300);
  });
}

/**
 * 그룹 생성 (선생님만 가능)
 *
 * TODO(F-002): 실제 API 연동
 * - POST /api/v1/groups
 * - Authorization: Bearer <access_token>
 * - 요청: CreateGroupPayload
 * - 응답: { success: true, data: Group }
 *
 * @param payload 그룹 생성 정보
 * @returns Promise<Group>
 */
export async function createGroup(
  payload: CreateGroupPayload
): Promise<Group> {
  // TODO(F-002): 실제 API 호출
  // const response = await apiRequest<Group>('POST', '/api/v1/groups', { body: payload });
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[createGroup] 목업 그룹 생성:', payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newGroup: Group = {
        groupId: `group-${Date.now()}`,
        name: payload.name,
        subject: payload.subject,
        level: payload.level,
        feePerSession: payload.feePerSession,
        sessionDuration: payload.sessionDuration,
        description: payload.description,
        teacher: {
          userId: 'teacher-1',
          name: '김선생',
          email: 'teacher@example.com',
        },
        memberCount: 0,
        createdAt: new Date().toISOString(),
      };
      resolve(newGroup);
    }, 500);
  });
}

/**
 * 그룹 수정 (선생님만 가능)
 *
 * TODO(F-002): 실제 API 연동
 * - PATCH /api/v1/groups/{groupId}
 * - Authorization: Bearer <access_token>
 * - 요청: UpdateGroupPayload
 * - 응답: { success: true, data: Group }
 *
 * @param groupId 그룹 ID
 * @param payload 수정할 그룹 정보
 * @returns Promise<Group>
 */
export async function updateGroup(
  groupId: string,
  payload: UpdateGroupPayload
): Promise<Group> {
  // TODO(F-002): 실제 API 호출
  // const response = await apiRequest<Group>('PATCH', `/api/v1/groups/${groupId}`, { body: payload });
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[updateGroup] 목업 그룹 수정:', groupId, payload);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const group = getMockGroupById(groupId);
      if (group) {
        const updatedGroup: Group = {
          ...group,
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGroup);
      } else {
        reject(new Error('그룹을 찾을 수 없습니다.'));
      }
    }, 500);
  });
}

/**
 * 그룹 삭제 (선생님만 가능)
 *
 * TODO(F-002): 실제 API 연동
 * - DELETE /api/v1/groups/{groupId}
 * - Authorization: Bearer <access_token>
 * - 응답: 204 No Content
 *
 * @param groupId 그룹 ID
 * @returns Promise<void>
 */
export async function deleteGroup(groupId: string): Promise<void> {
  // TODO(F-002): 실제 API 호출
  // await apiRequest('DELETE', `/api/v1/groups/${groupId}`);

  // 목업 데이터 반환 (개발 중)
  console.log('[deleteGroup] 목업 그룹 삭제:', groupId);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });
}

/**
 * 초대 코드 발급 (선생님만 가능)
 *
 * TODO(F-002): 실제 API 연동
 * - POST /api/v1/groups/{groupId}/invite-codes
 * - Authorization: Bearer <access_token>
 * - 요청: CreateInviteCodePayload
 * - 응답: { success: true, data: InviteCode }
 *
 * @param payload 초대 코드 발급 정보
 * @returns Promise<InviteCode>
 */
export async function createInviteCode(
  payload: CreateInviteCodePayload
): Promise<InviteCode> {
  // TODO(F-002): 실제 API 호출
  // const response = await apiRequest<InviteCode>('POST', `/api/v1/groups/${payload.groupId}/invite-codes`, { body: payload });
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[createInviteCode] 목업 초대 코드 생성:', payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newCode: InviteCode = {
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        groupId: payload.groupId,
        role: payload.role,
        maxUses: payload.maxUses || 1,
        currentUses: 0,
        expiresAt:
          payload.expiresAt ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        linkedStudent: payload.linkedStudentId
          ? {
              userId: payload.linkedStudentId,
              name: '연결된 학생',
            }
          : undefined,
      };
      resolve(newCode);
    }, 500);
  });
}

/**
 * 그룹의 초대 코드 목록 조회 (선생님만 가능)
 *
 * TODO(F-002): 실제 API 연동
 * - GET /api/v1/groups/{groupId}/invite-codes
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: { items: InviteCode[] } }
 *
 * @param groupId 그룹 ID
 * @returns Promise<InviteCode[]>
 */
export async function fetchInviteCodesByGroup(
  groupId: string
): Promise<InviteCode[]> {
  // TODO(F-002): 실제 API 호출
  // const response = await apiRequest<{ items: InviteCode[] }>('GET', `/api/v1/groups/${groupId}/invite-codes`);
  // return response.items;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchInviteCodesByGroup] 목업 초대 코드 목록 반환:', groupId);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMockInviteCodesByGroup(groupId));
    }, 300);
  });
}

/**
 * 초대 코드로 그룹 참여 (학생/학부모)
 *
 * TODO(F-002): 실제 API 연동
 * - POST /api/v1/groups/join
 * - Authorization: Bearer <access_token>
 * - 요청: JoinGroupPayload
 * - 응답: { success: true, data: { group: Group, member: GroupMember } }
 *
 * @param payload 초대 코드
 * @returns Promise<Group>
 */
export async function joinGroup(payload: JoinGroupPayload): Promise<Group> {
  // TODO(F-002): 실제 API 호출
  // const response = await apiRequest<{ group: Group }>('POST', '/api/v1/groups/join', { body: payload });
  // return response.group;

  // 목업 데이터 반환 (개발 중)
  console.log('[joinGroup] 목업 그룹 참여:', payload);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 간단한 목업: 첫 번째 그룹 반환
      const group = getMockGroupById('group-1');
      if (group) {
        resolve(group);
      } else {
        reject(new Error('유효하지 않은 초대 코드입니다.'));
      }
    }, 500);
  });
}
