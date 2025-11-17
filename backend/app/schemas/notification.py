"""
Notification Schemas - F-008 필수 알림 시스템
API_명세서.md 6.8 기반 요청/응답 스키마
프론트엔드 타입 정의(frontend/src/types/notifications.ts)와 일치
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# Notification Types (프론트엔드와 동일)
NotificationTypeEnum = Literal[
    "SCHEDULE_REMINDER",
    "SCHEDULE_CHANGED",
    "SCHEDULE_CANCELLED",
    "ATTENDANCE_CHANGED",
    "LESSON_RECORD_CREATED",
    "HOMEWORK_ASSIGNED",
    "MAKEUP_CLASS_AVAILABLE",
    "MAKEUP_CLASS_REQUESTED",
    "BILLING_ISSUED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_FAILED",
    "GROUP_INVITE",
    "SYSTEM_NOTICE",
]

NotificationCategoryEnum = Literal[
    "schedule",
    "attendance",
    "payment",
    "lesson",
    "group",
    "system",
]

NotificationPriorityEnum = Literal[
    "CRITICAL",
    "HIGH",
    "NORMAL",
    "LOW",
]

NotificationStatusEnum = Literal["unread", "read"]


class RelatedResource(BaseModel):
    """
    관련 리소스 정보
    """
    type: Literal["schedule", "attendance", "lesson", "payment", "group", "student"]
    id: str


class NotificationOut(BaseModel):
    """
    알림 항목 응답 스키마 (NotificationItem)
    프론트엔드의 NotificationItem 타입과 일치
    """
    notification_id: str
    category: NotificationCategoryEnum
    type: NotificationTypeEnum
    title: str
    message: str
    status: NotificationStatusEnum
    priority: NotificationPriorityEnum
    created_at: str  # ISO 8601 format
    read_at: Optional[str] = None  # ISO 8601 format
    related_resource: Optional[RelatedResource] = None
    is_required: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "notification_id": "notif-123",
                "category": "schedule",
                "type": "SCHEDULE_REMINDER",
                "title": "🔔 1시간 후 수업",
                "message": "최학생 - 수학 (오후 3시)",
                "status": "unread",
                "priority": "HIGH",
                "created_at": "2025-11-17T14:00:00Z",
                "read_at": None,
                "related_resource": {
                    "type": "schedule",
                    "id": "schedule-456"
                },
                "is_required": False,
            }
        }


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


class NotificationListResponse(BaseModel):
    """
    알림 목록 응답 (페이지네이션 포함)
    프론트엔드의 NotificationListResponse 타입과 일치
    """
    items: list[NotificationOut]
    pagination: PaginationInfo
    unread_count: int

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "notification_id": "notif-123",
                        "category": "schedule",
                        "type": "SCHEDULE_REMINDER",
                        "title": "🔔 1시간 후 수업",
                        "message": "최학생 - 수학 (오후 3시)",
                        "status": "unread",
                        "priority": "HIGH",
                        "created_at": "2025-11-17T14:00:00Z",
                        "read_at": None,
                        "is_required": False,
                    }
                ],
                "pagination": {
                    "total": 42,
                    "page": 1,
                    "size": 20,
                    "total_pages": 3,
                    "has_next": True,
                    "has_prev": False,
                },
                "unread_count": 12,
            }
        }


class NotificationCategoryCounts(BaseModel):
    """
    카테고리별 알림 개수
    """
    schedule: int = 0
    attendance: int = 0
    payment: int = 0
    lesson: int = 0
    group: int = 0
    system: int = 0


class NotificationSummary(BaseModel):
    """
    알림 요약 정보
    프론트엔드의 NotificationSummary 타입과 일치
    """
    total_unread: int
    by_category: NotificationCategoryCounts
    latest_notification: Optional[NotificationOut] = None

    class Config:
        json_schema_extra = {
            "example": {
                "total_unread": 12,
                "by_category": {
                    "schedule": 5,
                    "attendance": 2,
                    "payment": 3,
                    "lesson": 1,
                    "group": 1,
                    "system": 0,
                },
                "latest_notification": {
                    "notification_id": "notif-999",
                    "category": "payment",
                    "type": "BILLING_ISSUED",
                    "title": "💳 11월 수업료 청구",
                    "message": "총 400,000원이 청구되었습니다.",
                    "status": "unread",
                    "priority": "CRITICAL",
                    "created_at": "2025-11-17T09:00:00Z",
                    "read_at": None,
                    "is_required": True,
                },
            }
        }


class MarkAllReadRequest(BaseModel):
    """
    일괄 읽음 처리 요청
    """
    category: Optional[NotificationCategoryEnum] = None


class MarkAllReadResponse(BaseModel):
    """
    일괄 읽음 처리 응답
    프론트엔드의 MarkAllReadResponse 타입과 일치
    """
    marked_count: int
    remaining_unread: int

    class Config:
        json_schema_extra = {
            "example": {
                "marked_count": 8,
                "remaining_unread": 4,
            }
        }


class CreateTestNotificationRequest(BaseModel):
    """
    테스트 알림 생성 요청 (개발 환경 전용)
    """
    type: Literal["schedule", "payment", "attendance", "lesson"]


class FCMTokenRequest(BaseModel):
    """
    FCM 토큰 등록 요청 (2단계)
    """
    fcm_token: str
    device_info: Optional[dict] = None


class FCMTokenResponse(BaseModel):
    """
    FCM 토큰 등록 응답 (2단계)
    """
    token_id: str
    registered_at: str
