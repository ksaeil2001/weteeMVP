"""
User Model - F-001 회원가입 및 로그인
데이터베이스_설계서.md의 users 테이블 정의를 기반으로 구현
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    """
    사용자 역할
    F-001: 선생님/학생/학부모 구분
    """

    TEACHER = "teacher"
    STUDENT = "student"
    PARENT = "parent"


class User(Base):
    """
    Users table - 모든 사용자의 공통 정보

    Related:
    - F-001: 회원가입 및 로그인
    - F-007: 프로필 관리
    """

    __tablename__ = "users"

    # Primary Key
    # PostgreSQL: UUID, SQLite: String (UUID as string)
    id = Column(
        String(36),  # Using String for SQLite compatibility
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    # Basic Information
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    profile_image_url = Column(String(500), nullable=True)

    # Role
    role = Column(
        SQLEnum(UserRole, name="user_role", native_enum=False),
        nullable=False,
        index=True,
    )

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    email_verified_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    last_login_at = Column(DateTime, nullable=True)

    # Settings (F-007)
    language = Column(String(10), default="ko", nullable=False)
    timezone = Column(String(50), default="Asia/Seoul", nullable=False)

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

    def to_dict(self):
        """
        Convert model to dictionary (useful for API responses)
        """
        return {
            "user_id": self.id,
            "email": self.email,
            "name": self.name,
            "phone": self.phone,
            "role": self.role.value,
            "is_active": self.is_active,
            "is_email_verified": self.is_email_verified,
            "email_verified_at": (
                self.email_verified_at.isoformat() if self.email_verified_at else None
            ),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login_at": (
                self.last_login_at.isoformat() if self.last_login_at else None
            ),
            "language": self.language,
            "timezone": self.timezone,
        }
