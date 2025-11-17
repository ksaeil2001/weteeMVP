"""
Notification Model - F-008 필수 알림 시스템
데이터베이스_설계서.md의 notifications 테이블 정의를 기반으로 구현
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, Text, Integer
from datetime import datetime
import uuid
import enum

from app.database import Base


class NotificationType(str, enum.Enum):
    """
    알림 타입
    F-008: 필수 알림 종류
    """
    SCHEDULE_REMINDER = "SCHEDULE_REMINDER"          # 수업 리마인더 (1시간 전)
    SCHEDULE_CHANGED = "SCHEDULE_CHANGED"            # 일정 변경
    SCHEDULE_CANCELLED = "SCHEDULE_CANCELLED"        # 일정 취소
    ATTENDANCE_CHANGED = "ATTENDANCE_CHANGED"        # 출결 변동
    LESSON_RECORD_CREATED = "LESSON_RECORD_CREATED"  # 수업 기록 작성
    HOMEWORK_ASSIGNED = "HOMEWORK_ASSIGNED"          # 숙제 등록
    MAKEUP_CLASS_AVAILABLE = "MAKEUP_CLASS_AVAILABLE" # 보강 시간 오픈
    MAKEUP_CLASS_REQUESTED = "MAKEUP_CLASS_REQUESTED" # 보강 신청
    BILLING_ISSUED = "BILLING_ISSUED"                # 청구서 발행
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"          # 결제 완료
    PAYMENT_FAILED = "PAYMENT_FAILED"                # 결제 실패
    GROUP_INVITE = "GROUP_INVITE"                    # 그룹 초대
    SYSTEM_NOTICE = "SYSTEM_NOTICE"                  # 시스템 공지


class NotificationCategory(str, enum.Enum):
    """
    알림 카테고리
    필터링 및 탭 구분용
    """
    SCHEDULE = "schedule"      # 수업/일정
    ATTENDANCE = "attendance"  # 출결
    PAYMENT = "payment"        # 정산
    LESSON = "lesson"          # 수업 기록
    GROUP = "group"            # 그룹
    SYSTEM = "system"          # 시스템


class NotificationPriority(str, enum.Enum):
    """
    알림 우선순위
    F-008: 정산 > 수업 리마인더 > 출결 > 수업 기록 > 보강
    """
    CRITICAL = "CRITICAL"  # 정산 알림 (필수, 끌 수 없음)
    HIGH = "HIGH"          # 수업 리마인더
    NORMAL = "NORMAL"      # 출결 변동, 수업 기록
    LOW = "LOW"            # 보강 오픈


class NotificationChannel(str, enum.Enum):
    """
    알림 채널
    F-008: 현재 IN_APP만 구현, 나머지는 2단계
    """
    IN_APP = "IN_APP"  # 앱 내 알림 (MVP)
    EMAIL = "EMAIL"    # 이메일 (2단계)
    SMS = "SMS"        # SMS (2단계)
    PUSH = "PUSH"      # 푸시 알림 (2단계)


class NotificationDeliveryStatus(str, enum.Enum):
    """
    알림 전송 상태
    """
    PENDING = "PENDING"  # 발송 대기
    SENT = "SENT"        # 발송 완료
    FAILED = "FAILED"    # 발송 실패
    READ = "READ"        # 읽음


class Notification(Base):
    """
    Notifications table - 사용자 알림

    Related:
    - F-008: 필수 알림 시스템
    """

    __tablename__ = "notifications"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # User Reference (Foreign Key)
    # F-008: 알림 수신자
    user_id = Column(String(36), nullable=False, index=True)

    # Notification Type & Category
    type = Column(
        SQLEnum(NotificationType, name="notification_type", native_enum=False),
        nullable=False,
    )
    category = Column(
        SQLEnum(NotificationCategory, name="notification_category", native_enum=False),
        nullable=False,
        index=True,
    )

    # Content
    title = Column(String(200), nullable=False)  # 알림 제목
    message = Column(Text, nullable=False)       # 알림 내용

    # Priority
    priority = Column(
        SQLEnum(NotificationPriority, name="notification_priority", native_enum=False),
        nullable=False,
        default=NotificationPriority.NORMAL,
    )

    # Channel (MVP에서는 IN_APP만 사용)
    channel = Column(
        SQLEnum(NotificationChannel, name="notification_channel", native_enum=False),
        nullable=False,
        default=NotificationChannel.IN_APP,
    )

    # Delivery Status
    delivery_status = Column(
        SQLEnum(NotificationDeliveryStatus, name="notification_delivery_status", native_enum=False),
        nullable=False,
        default=NotificationDeliveryStatus.PENDING,
        index=True,
    )

    # Read Status
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)

    # Required (필수 알림 여부 - 끌 수 없음)
    is_required = Column(Boolean, default=False, nullable=False)

    # Related Resource (JSON 형태로 저장)
    # 예: {"type": "schedule", "id": "schedule-123"}
    related_resource_type = Column(String(50), nullable=True)  # schedule, attendance, lesson, payment, group
    related_resource_id = Column(String(36), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    sent_at = Column(DateTime, nullable=True)  # 발송 시간

    # Expiration (선택)
    # F-008: 알림 보관 기간 (기본: 90일)
    expires_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Notification {self.id} - {self.category} - {self.title}>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        프론트엔드의 NotificationItem 타입과 일치
        """
        result = {
            "notification_id": self.id,
            "category": self.category.value,
            "type": self.type.value,
            "title": self.title,
            "message": self.message,
            "status": "read" if self.is_read else "unread",
            "priority": self.priority.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "is_required": self.is_required,
        }

        # Related Resource 추가 (있을 경우)
        if self.related_resource_type and self.related_resource_id:
            result["related_resource"] = {
                "type": self.related_resource_type,
                "id": self.related_resource_id,
            }

        return result
