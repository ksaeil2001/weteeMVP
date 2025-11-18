"""
Schedule Schemas - F-003 수업 일정 관리
API_명세서.md 6.3 F-003 기반 요청/응답 스키마
프론트엔드 타입 정의(frontend/src/types/schedule.ts)와 일치
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any, List
from datetime import datetime


# Schedule Type Enum (프론트엔드와 동일)
ScheduleTypeEnum = Literal["REGULAR", "MAKEUP", "EXAM", "HOLIDAY", "OTHER"]

# Schedule Status Enum
ScheduleStatusEnum = Literal["SCHEDULED", "DONE", "CANCELED", "RESCHEDULED"]

# Recurrence Frequency Enum
RecurrenceFrequencyEnum = Literal["daily", "weekly", "biweekly", "monthly"]

# Recurrence End Type Enum
RecurrenceEndTypeEnum = Literal["date", "count", "never"]


# ==========================
# Recurrence Rule Schema
# ==========================


class RecurrenceRuleSchema(BaseModel):
    """
    반복 규칙 스키마
    프론트엔드 RecurrenceRule 타입과 일치
    """
    frequency: RecurrenceFrequencyEnum = Field(..., description="반복 빈도")
    interval: int = Field(..., ge=1, description="간격 (1=매주, 2=격주)")
    days_of_week: Optional[List[int]] = Field(None, description="요일 (1=월요일 ~ 7=일요일)")
    start_date: str = Field(..., description="시작 날짜 (YYYY-MM-DD)")
    end_type: RecurrenceEndTypeEnum = Field(..., description="종료 조건 타입")
    end_date: Optional[str] = Field(None, description="종료 날짜 (endType이 'date'일 때)")
    end_count: Optional[int] = Field(None, ge=1, description="반복 횟수 (endType이 'count'일 때)")

    class Config:
        json_schema_extra = {
            "example": {
                "frequency": "weekly",
                "interval": 1,
                "days_of_week": [1, 3, 5],
                "start_date": "2025-11-18",
                "end_type": "count",
                "end_count": 40,
            }
        }


# ==========================
# Schedule Schemas
# ==========================


class ScheduleBase(BaseModel):
    """
    일정 기본 스키마 (공통 필드)
    """
    title: str = Field(..., min_length=1, max_length=200, description="일정 제목")
    location: Optional[str] = Field(None, max_length=200, description="수업 장소")
    memo: Optional[str] = Field(None, description="메모")


class CreateRegularSchedulePayload(ScheduleBase):
    """
    정규 수업 일정 등록 요청 스키마 (반복 일정)
    프론트엔드 CreateRegularSchedulePayload와 일치

    POST /api/v1/schedules/regular
    """
    group_id: str = Field(..., description="그룹 ID")
    student_ids: Optional[List[str]] = Field(None, description="학생 ID 목록 (선택)")
    start_time: str = Field(..., description="수업 시작 시간 (HH:mm 형식)")
    duration: int = Field(..., ge=30, le=300, description="수업 시간 (분 단위)")
    recurrence: RecurrenceRuleSchema = Field(..., description="반복 규칙")

    class Config:
        json_schema_extra = {
            "example": {
                "group_id": "group-123",
                "title": "수학 정규 수업",
                "start_time": "15:00",
                "duration": 120,
                "location": "학생 집",
                "memo": "이차함수 진도",
                "recurrence": {
                    "frequency": "weekly",
                    "interval": 1,
                    "days_of_week": [1, 3, 5],
                    "start_date": "2025-11-18",
                    "end_type": "count",
                    "end_count": 40,
                },
            }
        }


class CreateSchedulePayload(ScheduleBase):
    """
    단일 일정 생성 요청 스키마 (보강, 기타)
    프론트엔드 CreateSchedulePayload와 일치

    POST /api/v1/schedules
    """
    group_id: str = Field(..., description="그룹 ID")
    type: ScheduleTypeEnum = Field(..., description="일정 타입")
    start_at: str = Field(..., description="시작 시각 (ISO8601 형식)")
    end_at: str = Field(..., description="종료 시각 (ISO8601 형식)")
    student_ids: Optional[List[str]] = Field(None, description="학생 ID 목록 (선택)")
    original_schedule_id: Optional[str] = Field(None, description="원래 일정 ID (보강인 경우)")

    class Config:
        json_schema_extra = {
            "example": {
                "group_id": "group-123",
                "title": "수학 보강 수업",
                "type": "MAKEUP",
                "start_at": "2025-11-20T10:00:00Z",
                "end_at": "2025-11-20T12:00:00Z",
                "location": "학생 집",
                "original_schedule_id": "schedule-456",
            }
        }


class UpdateSchedulePayload(BaseModel):
    """
    일정 수정 요청 스키마
    프론트엔드 UpdateSchedulePayload와 일치

    PATCH /api/v1/schedules/{schedule_id}
    """
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="일정 제목")
    start_at: Optional[str] = Field(None, description="시작 시각 (ISO8601 형식)")
    end_at: Optional[str] = Field(None, description="종료 시각 (ISO8601 형식)")
    location: Optional[str] = Field(None, max_length=200, description="수업 장소")
    memo: Optional[str] = Field(None, description="메모")
    status: Optional[ScheduleStatusEnum] = Field(None, description="일정 상태")
    reschedule_reason: Optional[str] = Field(None, min_length=5, description="변경 사유 (필수, 5자 이상)")
    cancel_reason: Optional[str] = Field(None, min_length=5, description="취소 사유 (필수, 5자 이상)")

    class Config:
        json_schema_extra = {
            "example": {
                "start_at": "2025-11-21T15:00:00Z",
                "end_at": "2025-11-21T17:00:00Z",
                "reschedule_reason": "가족 일정으로 시간 변경",
            }
        }


class ScheduleOut(BaseModel):
    """
    일정 응답 스키마
    프론트엔드 Schedule 타입과 일치
    """
    schedule_id: str
    group_id: str
    group_name: Optional[str] = None  # 표시용
    title: str
    type: ScheduleTypeEnum
    start_at: str  # ISO8601 형식
    end_at: str  # ISO8601 형식
    status: ScheduleStatusEnum
    recurrence_rule: Optional[Dict[str, Any]] = None  # JSON 형식
    location: Optional[str] = None
    memo: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

    # 관련 정보
    teacher_id: Optional[str] = None
    teacher_name: Optional[str] = None
    student_ids: Optional[List[str]] = None
    student_names: Optional[List[str]] = None

    # 원래 일정 (보강/변경인 경우)
    original_schedule_id: Optional[str] = None

    # 취소/변경 사유
    cancel_reason: Optional[str] = None
    reschedule_reason: Optional[str] = None

    # F-005: 수업 기록 연결 (N+1 문제 해결)
    lesson_record_id: Optional[str] = None  # 이 일정에 대한 수업 기록 ID

    class Config:
        json_schema_extra = {
            "example": {
                "schedule_id": "schedule-123",
                "group_id": "group-456",
                "group_name": "중3 수학 반A",
                "title": "수학 정규 수업",
                "type": "REGULAR",
                "start_at": "2025-11-18T15:00:00Z",
                "end_at": "2025-11-18T17:00:00Z",
                "status": "SCHEDULED",
                "recurrence_rule": {
                    "frequency": "weekly",
                    "interval": 1,
                    "days_of_week": [1, 3, 5],
                    "start_date": "2025-11-18",
                    "end_type": "count",
                    "end_count": 40,
                },
                "location": "학생 집",
                "teacher_id": "user-789",
                "teacher_name": "김선생",
                "created_at": "2025-11-18T10:00:00Z",
                "updated_at": "2025-11-18T10:00:00Z",
            }
        }


# ==========================
# Pagination & List Response
# ==========================


class PaginationInfo(BaseModel):
    """
    페이지네이션 정보
    """
    total: int
    page: int
    size: int
    total_pages: int
    has_next: bool = False
    has_prev: bool = False


class ScheduleListResponse(BaseModel):
    """
    일정 목록 응답 (페이지네이션 포함)
    프론트엔드와 일치

    GET /api/v1/schedules
    """
    items: List[ScheduleOut]
    pagination: PaginationInfo

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "schedule_id": "schedule-123",
                        "group_id": "group-456",
                        "title": "수학 정규 수업",
                        "type": "REGULAR",
                        "start_at": "2025-11-18T15:00:00Z",
                        "end_at": "2025-11-18T17:00:00Z",
                        "status": "SCHEDULED",
                        "created_at": "2025-11-18T10:00:00Z",
                    }
                ],
                "pagination": {
                    "total": 50,
                    "page": 1,
                    "size": 20,
                    "total_pages": 3,
                    "has_next": True,
                    "has_prev": False,
                },
            }
        }


# ==========================
# TODO(Phase 2): Makeup Slots, Exam Schedules
# ==========================

# class CreateMakeupSlotPayload(BaseModel):
#     """보강 가능 시간 오픈 요청"""
#     ...

# class MakeupSlotOut(BaseModel):
#     """보강 가능 시간 응답"""
#     ...

# class CreateExamSchedulePayload(BaseModel):
#     """시험 일정 등록 요청"""
#     ...

# class ExamScheduleOut(BaseModel):
#     """시험 일정 응답"""
#     ...
