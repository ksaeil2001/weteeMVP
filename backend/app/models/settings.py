"""
Settings Model - F-007 기본 프로필 및 설정
사용자 알림 설정 및 앱 설정 저장
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON
from datetime import datetime

from app.database import Base


class Settings(Base):
    """
    Settings table - 사용자 설정 (알림, 앱 설정)

    Related:
    - F-007: 기본 프로필 및 설정
    - F-008: 필수 알림 시스템

    Note: User 모델과 1:1 관계
    """

    __tablename__ = "settings"

    # Primary Key (user_id를 PK로 사용)
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )

    # Notification Settings - F-007, F-008
    push_enabled = Column(Boolean, default=True, nullable=False)
    email_enabled = Column(Boolean, default=True, nullable=False)
    sms_enabled = Column(Boolean, default=False, nullable=False)  # SMS는 기본 비활성화

    # Notification Categories (각 카테고리별 알림 on/off)
    # F-008: schedule, attendance, payment, group
    notification_categories = Column(
        JSON,
        default={
            "schedule": True,      # 수업 리마인더
            "attendance": True,    # 출결 변동 알림
            "payment": True,       # 정산 알림 (끌 수 없음)
            "group": True,         # 그룹 관련 알림
        },
        nullable=False,
    )

    # 야간 알림 제한 - F-007
    night_mode_enabled = Column(Boolean, default=False, nullable=False)
    night_mode_start = Column(String(5), default="22:00", nullable=True)  # "HH:MM" format
    night_mode_end = Column(String(5), default="08:00", nullable=True)    # "HH:MM" format

    # App Settings - F-007
    theme = Column(String(20), default="auto", nullable=False)  # "light", "dark", "auto"
    default_screen = Column(String(50), default="home", nullable=True)  # "home", "schedule", "progress", "payment"

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self):
        return f"<Settings user_id={self.user_id}>"

    def to_dict(self):
        """
        Convert model to dictionary (useful for API responses)
        """
        return {
            "user_id": self.user_id,
            "push_enabled": self.push_enabled,
            "email_enabled": self.email_enabled,
            "sms_enabled": self.sms_enabled,
            "notification_categories": self.notification_categories,
            "night_mode_enabled": self.night_mode_enabled,
            "night_mode_start": self.night_mode_start,
            "night_mode_end": self.night_mode_end,
            "theme": self.theme,
            "default_screen": self.default_screen,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
