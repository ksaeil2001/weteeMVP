"""
Pydantic Schemas Package
API 요청/응답 스키마
"""

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    LoginResponse,
    UserResponse,
    TokenResponse,
)
from app.schemas.schedule import (
    ScheduleOut,
    ScheduleListResponse,
    CreateRegularSchedulePayload,
    CreateSchedulePayload,
    UpdateSchedulePayload,
)
from app.schemas.attendance import (
    AttendanceOut,
    AttendanceListResponse,
    AttendanceStatsResponse,
    CreateAttendancePayload,
    BatchCreateAttendancePayload,
    UpdateAttendancePayload,
)

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "LoginResponse",
    "UserResponse",
    "TokenResponse",
    "ScheduleOut",
    "ScheduleListResponse",
    "CreateRegularSchedulePayload",
    "CreateSchedulePayload",
    "UpdateSchedulePayload",
    "AttendanceOut",
    "AttendanceListResponse",
    "AttendanceStatsResponse",
    "CreateAttendancePayload",
    "BatchCreateAttendancePayload",
    "UpdateAttendancePayload",
]
