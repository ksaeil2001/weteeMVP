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
from app.schemas.textbook import (
    TextbookOut,
    TextbookListResponse,
    CreateTextbookPayload,
    UpdateTextbookPayload,
)
from app.schemas.lesson import (
    LessonRecordOut,
    LessonRecordListResponse,
    CreateLessonRecordPayload,
    UpdateLessonRecordPayload,
    ProgressRecordOut,
    ProgressRecordCreate,
    ProgressSummary,
    ProgressHistoryResponse,
)
from app.schemas.invoice import (
    InvoiceCreateRequest,
    InvoiceUpdateRequest,
    InvoiceBasicInfo,
    InvoiceDetailResponse,
    InvoiceListResponse,
    SettlementSummaryItem,
    SettlementSummaryResponse,
    PaymentCreateRequest,
    PaymentResponse,
    TransactionResponse,
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
    "TextbookOut",
    "TextbookListResponse",
    "CreateTextbookPayload",
    "UpdateTextbookPayload",
    "LessonRecordOut",
    "LessonRecordListResponse",
    "CreateLessonRecordPayload",
    "UpdateLessonRecordPayload",
    "ProgressRecordOut",
    "ProgressRecordCreate",
    "ProgressSummary",
    "ProgressHistoryResponse",
    "InvoiceCreateRequest",
    "InvoiceUpdateRequest",
    "InvoiceBasicInfo",
    "InvoiceDetailResponse",
    "InvoiceListResponse",
    "SettlementSummaryItem",
    "SettlementSummaryResponse",
    "PaymentCreateRequest",
    "PaymentResponse",
    "TransactionResponse",
]
