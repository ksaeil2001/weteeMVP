/**
 * Lessons API - WeTee MVP
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * Based on:
 * - API_명세서.md (6.5 F-005: 수업 기록 및 진도 관리)
 *
 * 역할:
 * - 수업 기록 및 진도 관련 API 엔드포인트 시그니처 정의
 * - 현재는 목업 데이터 반환 (실제 API 연동 전)
 *
 * TODO (F-005 디버깅/연결 단계):
 * - 실제 FastAPI 백엔드 /api/v1/lessons, /api/v1/progress 엔드포인트와 연결
 * - apiClient.ts의 apiRequest를 사용하여 네트워크 요청
 * - 에러 핸들링 강화 (네트워크 오류, 권한 오류 등)
 * - 다중 교재 진도 입력 처리 (최대 5개)
 * - 파일 첨부 기능 (2단계 고려)
 */

import type {
  LessonRecord,
  Textbook,
  GroupProgressSummary,
  StudentProgressSummary,
  ProgressReport,
  CreateLessonRecordPayload,
  UpdateLessonRecordPayload,
  CreateTextbookPayload,
  UpdateTextbookPayload,
  LessonRecordListParams,
  ProgressQueryParams,
  GenerateProgressReportPayload,
  LessonRecordCardView,
} from '@/types/lesson';

import {
  getMockLessonRecordsByGroup,
  getMockLessonRecordById,
  getMockTextbooksByGroup,
  getMockTextbookById,
  getMockGroupProgressSummary,
  getMockStudentProgressSummary,
  getMockProgressReport,
  convertToLessonRecordCardView,
} from '@/mocks/lessons';

/**
 * 그룹별 수업 기록 목록 조회
 * S-032: 그룹 진도 히스토리
 *
 * TODO(F-005): 실제 API 연동
 * - GET /api/v1/groups/{groupId}/lesson-records?page=1&size=20
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: { items: LessonRecord[], pagination: {...} } }
 *
 * @param params 조회 파라미터
 * @returns Promise<LessonRecord[]>
 */
export async function fetchLessonRecords(
  params: LessonRecordListParams
): Promise<LessonRecord[]> {
  // TODO(F-005): 실제 API 호출
  // const response = await apiRequest<{ items: LessonRecord[] }>(
  //   'GET',
  //   `/api/v1/groups/${params.groupId}/lesson-records`,
  //   { params }
  // );
  // return response.items;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchLessonRecords] 목업 데이터 반환:', params);
  return new Promise((resolve) => {
    setTimeout(() => {
      if (params.groupId) {
        resolve(getMockLessonRecordsByGroup(params.groupId));
      } else {
        resolve([]);
      }
    }, 300);
  });
}

/**
 * 수업 기록 상세 조회
 * S-023: 수업 기록 상세 화면
 *
 * TODO(F-005): 실제 API 연동
 * - GET /api/v1/lesson-records/{lessonRecordId}
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: LessonRecord }
 *
 * @param lessonRecordId 수업 기록 ID
 * @returns Promise<LessonRecord>
 */
export async function fetchLessonRecordById(
  lessonRecordId: string
): Promise<LessonRecord> {
  // TODO(F-005): 실제 API 호출
  // const response = await apiRequest<LessonRecord>(
  //   'GET',
  //   `/api/v1/lesson-records/${lessonRecordId}`
  // );
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchLessonRecordById] 목업 데이터 반환:', lessonRecordId);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const record = getMockLessonRecordById(lessonRecordId);
      if (record) {
        resolve(record);
      } else {
        reject(new Error('수업 기록을 찾을 수 없습니다.'));
      }
    }, 300);
  });
}

/**
 * 수업 기록 작성 (선생님만 가능)
 * S-022: 수업 기록 작성 화면
 *
 * TODO(F-005): 실제 API 연동
 * - POST /api/v1/schedules/{scheduleId}/lesson-record
 * - Authorization: Bearer <access_token>
 * - 요청: CreateLessonRecordPayload
 * - 응답: { success: true, data: LessonRecord }
 *
 * 비즈니스 규칙 (F-005 참조):
 * - content: 필수, 최소 10자, 최대 2000자
 * - studentFeedback: 선택, 최대 500자
 * - homework: 선택, 최대 1000자
 * - progressRecords: 다중 교재 가능 (최대 5개)
 * - 저장 후 학생/학부모에게 자동 알림 전송 (F-008 연계)
 *
 * @param payload 수업 기록 작성 정보
 * @returns Promise<LessonRecord>
 */
export async function createLessonRecord(
  payload: CreateLessonRecordPayload
): Promise<LessonRecord> {
  // TODO(F-005): 실제 API 호출
  // const response = await apiRequest<LessonRecord>(
  //   'POST',
  //   `/api/v1/schedules/${payload.scheduleId}/lesson-record`,
  //   { body: payload }
  // );
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[createLessonRecord] 목업 수업 기록 생성:', payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newRecord: LessonRecord = {
        lessonRecordId: `lesson-${Date.now()}`,
        scheduleId: payload.scheduleId,
        groupId: payload.groupId,
        groupName: '새 그룹', // 목업
        date: new Date().toISOString().split('T')[0],
        content: payload.content,
        studentFeedback: payload.studentFeedback,
        homework: payload.homework,
        homeworkDueDate: payload.homeworkDueDate,
        progressRecords: payload.progressRecords?.map((pr) => ({
          textbook: {
            textbookId: pr.textbookId,
            name: '교재명', // 목업
          },
          unit: pr.unit,
          pageStart: pr.pageStart,
          pageEnd: pr.pageEnd,
          pagesCovered:
            pr.pageStart && pr.pageEnd ? pr.pageEnd - pr.pageStart + 1 : 0,
          notes: pr.notes,
        })),
        studentEvaluations: payload.studentEvaluations?.map((se) => ({
          studentId: se.studentId,
          studentName: '학생명', // 목업
          understanding: se.understanding,
          concentration: se.concentration,
          difficulty: se.difficulty,
          memo: se.memo,
        })),
        createdBy: {
          userId: 'teacher-1',
          name: '김선생',
        },
        isShared: payload.isShared !== false, // 기본값: true
        sharedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      resolve(newRecord);
    }, 500);
  });
}

/**
 * 수업 기록 수정 (선생님만 가능)
 *
 * TODO(F-005): 실제 API 연동
 * - PATCH /api/v1/lesson-records/{lessonRecordId}
 * - Authorization: Bearer <access_token>
 * - 요청: UpdateLessonRecordPayload
 * - 응답: { success: true, data: LessonRecord }
 *
 * 비즈니스 규칙 (F-005 참조):
 * - 작성 후 30일 이내만 수정 가능
 * - 수정 시 학부모에게 "수정됨" 알림 전송
 *
 * @param lessonRecordId 수업 기록 ID
 * @param payload 수정할 정보
 * @returns Promise<LessonRecord>
 */
export async function updateLessonRecord(
  lessonRecordId: string,
  payload: UpdateLessonRecordPayload
): Promise<LessonRecord> {
  // TODO(F-005): 실제 API 호출
  // const response = await apiRequest<LessonRecord>(
  //   'PATCH',
  //   `/api/v1/lesson-records/${lessonRecordId}`,
  //   { body: payload }
  // );
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[updateLessonRecord] 목업 수업 기록 수정:', lessonRecordId, payload);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const record = getMockLessonRecordById(lessonRecordId);
      if (record) {
        // 페이로드를 LessonRecord 형식으로 변환 (progressRecords, studentEvaluations 등 처리)
        const updates: Partial<LessonRecord> = {
          content: payload.content,
          studentFeedback: payload.studentFeedback,
          homework: payload.homework,
          homeworkDueDate: payload.homeworkDueDate,
          updatedAt: new Date().toISOString(),
        };

        const updatedRecord: LessonRecord = {
          ...record,
          ...updates,
        };
        resolve(updatedRecord);
      } else {
        reject(new Error('수업 기록을 찾을 수 없습니다.'));
      }
    }, 500);
  });
}

/**
 * 수업 기록 삭제 (선생님만 가능)
 *
 * TODO(F-005): 실제 API 연동
 * - DELETE /api/v1/lesson-records/{lessonRecordId}
 * - Authorization: Bearer <access_token>
 * - 응답: 204 No Content
 *
 * 비즈니스 규칙 (F-005 참조):
 * - 작성 후 24시간 이내만 삭제 가능
 * - 24시간 경과 후엔 수정만 가능
 *
 * @param lessonRecordId 수업 기록 ID
 * @returns Promise<void>
 */
export async function deleteLessonRecord(
  lessonRecordId: string
): Promise<void> {
  // TODO(F-005): 실제 API 호출
  // await apiRequest('DELETE', `/api/v1/lesson-records/${lessonRecordId}`);

  // 목업 데이터 반환 (개발 중)
  console.log('[deleteLessonRecord] 목업 수업 기록 삭제:', lessonRecordId);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });
}

/**
 * 그룹별 교재 목록 조회
 * S-024: 교재 관리 화면
 *
 * TODO(F-005): 실제 API 연동
 * - GET /api/v1/groups/{groupId}/textbooks
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: { items: Textbook[] } }
 *
 * @param groupId 그룹 ID
 * @returns Promise<Textbook[]>
 */
export async function fetchTextbooks(groupId: string): Promise<Textbook[]> {
  // TODO(F-005): 실제 API 호출
  // const response = await apiRequest<{ items: Textbook[] }>(
  //   'GET',
  //   `/api/v1/groups/${groupId}/textbooks`
  // );
  // return response.items;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchTextbooks] 목업 교재 목록 반환:', groupId);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMockTextbooksByGroup(groupId));
    }, 300);
  });
}

/**
 * 교재 등록 (선생님만 가능)
 *
 * TODO(F-005): 실제 API 연동
 * - POST /api/v1/groups/{groupId}/textbooks
 * - Authorization: Bearer <access_token>
 * - 요청: CreateTextbookPayload
 * - 응답: { success: true, data: Textbook }
 *
 * 비즈니스 규칙 (F-005 참조):
 * - name: 필수, 최소 1자, 최대 100자
 * - totalPages: 선택, 입력하면 진도율 자동 계산
 * - 중복 이름 허용 (예: 수학1, 수학1-2권)
 *
 * @param payload 교재 등록 정보
 * @returns Promise<Textbook>
 */
export async function createTextbook(
  payload: CreateTextbookPayload
): Promise<Textbook> {
  // TODO(F-005): 실제 API 호출
  // const response = await apiRequest<Textbook>(
  //   'POST',
  //   `/api/v1/groups/${payload.groupId}/textbooks`,
  //   { body: payload }
  // );
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[createTextbook] 목업 교재 등록:', payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newTextbook: Textbook = {
        textbookId: `textbook-${Date.now()}`,
        groupId: payload.groupId,
        name: payload.name,
        publisher: payload.publisher,
        totalPages: payload.totalPages,
        startPage: payload.startPage || 1,
        currentPage: payload.startPage || 1,
        progressPercentage: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      resolve(newTextbook);
    }, 500);
  });
}

/**
 * 교재 수정 (선생님만 가능)
 *
 * TODO(F-005): 실제 API 연동
 * - PATCH /api/v1/textbooks/{textbookId}
 * - Authorization: Bearer <access_token>
 * - 요청: UpdateTextbookPayload
 * - 응답: { success: true, data: Textbook }
 *
 * @param textbookId 교재 ID
 * @param payload 수정할 정보
 * @returns Promise<Textbook>
 */
export async function updateTextbook(
  textbookId: string,
  payload: UpdateTextbookPayload
): Promise<Textbook> {
  // TODO(F-005): 실제 API 호출
  // const response = await apiRequest<Textbook>(
  //   'PATCH',
  //   `/api/v1/textbooks/${textbookId}`,
  //   { body: payload }
  // );
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[updateTextbook] 목업 교재 수정:', textbookId, payload);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const textbook = getMockTextbookById(textbookId);
      if (textbook) {
        const updatedTextbook: Textbook = {
          ...textbook,
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedTextbook);
      } else {
        reject(new Error('교재를 찾을 수 없습니다.'));
      }
    }, 500);
  });
}

/**
 * 교재 삭제/숨기기 (선생님만 가능)
 *
 * TODO(F-005): 실제 API 연동
 * - DELETE /api/v1/textbooks/{textbookId} (진도 기록 없을 때만)
 * - 또는 PATCH로 isActive: false (진도 기록 있을 때 숨기기)
 *
 * 비즈니스 규칙 (F-005 참조):
 * - 진도 기록이 있는 교재는 삭제 불가, 숨기기만 가능
 *
 * @param textbookId 교재 ID
 * @param hideOnly 숨기기만 할지 (true), 완전 삭제할지 (false)
 * @returns Promise<void>
 */
export async function deleteTextbook(
  textbookId: string,
  hideOnly: boolean = false
): Promise<void> {
  // TODO(F-005): 실제 API 호출
  // if (hideOnly) {
  //   await apiRequest('PATCH', `/api/v1/textbooks/${textbookId}`, {
  //     body: { isActive: false },
  //   });
  // } else {
  //   await apiRequest('DELETE', `/api/v1/textbooks/${textbookId}`);
  // }

  // 목업 데이터 반환 (개발 중)
  console.log('[deleteTextbook] 목업 교재 삭제/숨기기:', textbookId, hideOnly);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });
}

/**
 * 그룹 진도 요약 조회
 * S-030: 그룹 진도 대시보드
 *
 * TODO(F-005): 실제 API 연동
 * - GET /api/v1/groups/{groupId}/progress
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: GroupProgressSummary }
 *
 * @param groupId 그룹 ID
 * @returns Promise<GroupProgressSummary>
 */
export async function fetchGroupProgressSummary(
  groupId: string
): Promise<GroupProgressSummary> {
  // TODO(F-005): 실제 API 호출
  // const response = await apiRequest<GroupProgressSummary>(
  //   'GET',
  //   `/api/v1/groups/${groupId}/progress`
  // );
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchGroupProgressSummary] 목업 그룹 진도 요약 반환:', groupId);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const summary = getMockGroupProgressSummary(groupId);
      if (summary) {
        resolve(summary);
      } else {
        reject(new Error('그룹 진도 정보를 찾을 수 없습니다.'));
      }
    }, 300);
  });
}

/**
 * 학생별 학습 리포트 조회
 * S-033: 학생별 학습 리포트
 *
 * TODO(F-005): 실제 API 연동
 * - GET /api/v1/students/{studentId}/progress?groupId={groupId}
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: StudentProgressSummary }
 *
 * @param studentId 학생 ID
 * @param groupId 그룹 ID (선택)
 * @returns Promise<StudentProgressSummary>
 */
export async function fetchStudentProgressSummary(
  studentId: string,
  groupId?: string
): Promise<StudentProgressSummary> {
  // TODO(F-005): 실제 API 호출
  // const response = await apiRequest<StudentProgressSummary>(
  //   'GET',
  //   `/api/v1/students/${studentId}/progress`,
  //   { params: { groupId } }
  // );
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchStudentProgressSummary] 목업 학생 학습 리포트 반환:', studentId, groupId);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const summary = getMockStudentProgressSummary(studentId, groupId);
      if (summary) {
        resolve(summary);
      } else {
        reject(new Error('학생 학습 리포트를 찾을 수 없습니다.'));
      }
    }, 300);
  });
}

/**
 * 진도 리포트 생성
 * S-026: 진도 리포트 화면 (선생님)
 *
 * TODO(F-005): 실제 API 연동
 * - POST /api/v1/groups/{groupId}/progress/report
 * - Authorization: Bearer <access_token>
 * - 요청: GenerateProgressReportPayload
 * - 응답: { success: true, data: ProgressReport }
 *
 * @param payload 리포트 생성 요청
 * @returns Promise<ProgressReport>
 */
export async function generateProgressReport(
  payload: GenerateProgressReportPayload
): Promise<ProgressReport> {
  // TODO(F-005): 실제 API 호출
  // const response = await apiRequest<ProgressReport>(
  //   'POST',
  //   `/api/v1/groups/${payload.groupId}/progress/report`,
  //   { body: payload }
  // );
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[generateProgressReport] 목업 진도 리포트 생성:', payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      const report = getMockProgressReport(payload.groupId);
      resolve(report);
    }, 500);
  });
}

/**
 * 진도 리포트 학부모에게 공유
 *
 * TODO(F-005): 실제 API 연동
 * - POST /api/v1/progress/reports/{reportId}/share
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true }
 *
 * 비즈니스 규칙 (F-005 참조):
 * - 공유 시 학부모에게 알림 전송 (F-008 연계)
 *
 * @param reportId 리포트 ID
 * @returns Promise<void>
 */
export async function shareProgressReportToParents(
  reportId: string
): Promise<void> {
  // TODO(F-005): 실제 API 호출
  // await apiRequest('POST', `/api/v1/progress/reports/${reportId}/share`);

  // 목업 데이터 반환 (개발 중)
  console.log('[shareProgressReportToParents] 목업 진도 리포트 공유:', reportId);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });
}

/**
 * 수업 기록 카드 뷰 목록 조회 (UI 표시용)
 * S-032: 그룹 진도 히스토리
 *
 * @param groupId 그룹 ID
 * @returns Promise<LessonRecordCardView[]>
 */
export async function fetchLessonRecordCards(
  groupId: string
): Promise<LessonRecordCardView[]> {
  const lessons = await fetchLessonRecords({ groupId });
  return lessons.map(convertToLessonRecordCardView);
}
