"""
Attendance Schemas - F-004 출결 관리
API_명세서.md 6.4 F-004 기반 요청/응답 스키마
프론트엔드 타입 정의와 일치
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime


# Attendance Status Enum (프론트엔드와 동일)
AttendanceStatusEnum = Literal["PRESENT", "LATE", "EARLY_LEAVE", "ABSENT"]


# ==========================
# Attendance Schemas
# ==========================


class AttendanceBase(BaseModel):
    """
    출결 기본 스키마 (공통 필드)
    """
    status: AttendanceStatusEnum = Field(..., description="출결 상태")
    late_minutes: Optional[int] = Field(None, ge=0, le=120, description="지각 시간 (분, 선택)")
    notes: Optional[str] = Field(None, max_length=500, description="메모 (사유 등)")


class CreateAttendancePayload(AttendanceBase):
    """
    출결 생성 요청 스키마 (단일 학생)

    POST /api/v1/attendances
    """
    schedule_id: str = Field(..., description="수업 일정 ID")
    student_id: str = Field(..., description="학생 ID")

    class Config:
        json_schema_extra = {
            "example": {
                "schedule_id": "schedule-123",
                "student_id": "student-456",
                "status": "PRESENT",
                "notes": "수업 잘 들음"
            }
        }


class BatchAttendanceItemPayload(BaseModel):
    """
    배치 출결 체크 - 개별 학생 항목
    """
    student_id: str = Field(..., description="학생 ID")
    status: AttendanceStatusEnum = Field(..., description="출결 상태")
    late_minutes: Optional[int] = Field(None, ge=0, le=120, description="지각 시간 (분, 선택)")
    notes: Optional[str] = Field(None, max_length=500, description="메모")


class BatchCreateAttendancePayload(BaseModel):
    """
    배치 출결 체크 요청 스키마 (여러 학생 동시)
    API 명세서 6.4.1 기반

    POST /api/v1/schedules/{schedule_id}/attendances
    """
    attendances: List[BatchAttendanceItemPayload] = Field(..., description="출결 목록")
    checked_at: Optional[str] = Field(None, description="출결 체크 시각 (ISO8601, 선택)")

    class Config:
        json_schema_extra = {
            "example": {
                "attendances": [
                    {
                        "student_id": "student-1",
                        "status": "PRESENT",
                        "notes": "수업 잘 들음"
                    },
                    {
                        "student_id": "student-2",
                        "status": "LATE",
                        "late_minutes": 10,
                        "notes": "10분 지각"
                    }
                ],
                "checked_at": "2025-11-18T16:30:00Z"
            }
        }


class UpdateAttendancePayload(BaseModel):
    """
    출결 수정 요청 스키마
    API 명세서 6.4.2 기반

    PATCH /api/v1/attendances/{attendance_id}
    """
    status: Optional[AttendanceStatusEnum] = Field(None, description="출결 상태")
    late_minutes: Optional[int] = Field(None, ge=0, le=120, description="지각 시간 (분)")
    notes: Optional[str] = Field(None, max_length=500, description="메모")
    # F-004 명세서: 수정 사유 필수
    # 하지만 API 명세서에는 없음. MVP에서는 notes에 포함하는 것으로 간주
    # TODO(Phase 2): 별도 수정 사유 필드 추가 고려

    class Config:
        json_schema_extra = {
            "example": {
                "status": "LATE",
                "late_minutes": 10,
                "notes": "10분 지각 (수정)"
            }
        }


class StudentInfo(BaseModel):
    """
    학생 정보 (출결 응답용)
    """
    user_id: str
    name: str


class AttendanceOut(BaseModel):
    """
    출결 응답 스키마
    API 명세서 8.4 Attendance 기반
    """
    attendance_id: str
    schedule_id: str
    student_id: str
    student: Optional[StudentInfo] = None  # 학생 정보 (조인 시)
    status: AttendanceStatusEnum
    late_minutes: Optional[int] = None
    notes: Optional[str] = None
    recorded_at: str  # ISO8601 형식 (checked_at과 동일)
    updated_at: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "attendance_id": "attendance-123",
                "schedule_id": "schedule-456",
                "student_id": "student-789",
                "student": {
                    "user_id": "student-789",
                    "name": "박민수"
                },
                "status": "PRESENT",
                "notes": "수업 잘 들음",
                "recorded_at": "2025-11-18T16:30:00Z",
                "updated_at": "2025-11-18T16:30:00Z"
            }
        }


class BatchAttendanceResponse(BaseModel):
    """
    배치 출결 체크 응답
    API 명세서 6.4.1 응답 기반
    """
    schedule_id: str
    attendances: List[AttendanceOut]

    class Config:
        json_schema_extra = {
            "example": {
                "schedule_id": "schedule-123",
                "attendances": [
                    {
                        "attendance_id": "attendance-1",
                        "schedule_id": "schedule-123",
                        "student_id": "student-1",
                        "student": {"user_id": "student-1", "name": "박민수"},
                        "status": "PRESENT",
                        "notes": "수업 잘 들음",
                        "recorded_at": "2025-11-18T16:30:00Z"
                    }
                ]
            }
        }


# ==========================
# List & Stats Response
# ==========================


class AttendanceListResponse(BaseModel):
    """
    출결 목록 응답
    """
    items: List[AttendanceOut]
    total: int = Field(..., description="총 출결 수")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "attendance_id": "attendance-123",
                        "schedule_id": "schedule-456",
                        "student_id": "student-789",
                        "status": "PRESENT",
                        "recorded_at": "2025-11-18T16:30:00Z"
                    }
                ],
                "total": 10
            }
        }


class AttendanceStats(BaseModel):
    """
    출결 통계
    API 명세서 6.4.3 응답 기반
    """
    total_sessions: int = Field(..., description="총 수업 횟수")
    present: int = Field(..., description="출석 횟수")
    late: int = Field(..., description="지각 횟수")
    early_leave: int = Field(0, description="조퇴 횟수")
    absent: int = Field(..., description="결석 횟수")
    attendance_rate: float = Field(..., description="출석률 (%)")


class RecentAttendanceRecord(BaseModel):
    """
    최근 출결 기록 (통계용)
    """
    schedule_id: str
    date: str  # YYYY-MM-DD
    status: AttendanceStatusEnum
    notes: Optional[str] = None


class AttendanceStatsResponse(BaseModel):
    """
    출결 통계 응답
    API 명세서 6.4.3 응답 기반

    GET /api/v1/groups/{group_id}/attendances/stats
    """
    student: Optional[StudentInfo] = None  # 특정 학생 통계일 경우
    period: dict  # {"start_date": "...", "end_date": "..."}
    stats: AttendanceStats
    recent_records: List[RecentAttendanceRecord] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "student": {
                    "user_id": "student-123",
                    "name": "박민수"
                },
                "period": {
                    "start_date": "2025-11-01",
                    "end_date": "2025-11-30"
                },
                "stats": {
                    "total_sessions": 12,
                    "present": 10,
                    "late": 1,
                    "early_leave": 0,
                    "absent": 1,
                    "attendance_rate": 91.7
                },
                "recent_records": [
                    {
                        "schedule_id": "schedule-123",
                        "date": "2025-11-18",
                        "status": "PRESENT",
                        "notes": "수업 잘 들음"
                    }
                ]
            }
        }


# ==========================
# TODO(Phase 2): Advanced Features
# ==========================

# class AttendanceHistoryOut(BaseModel):
#     """출결 수정 이력"""
#     ...

# class AttendanceModificationRequest(BaseModel):
#     """출결 수정 요청 (학생/학부모 → 선생님)"""
#     ...
