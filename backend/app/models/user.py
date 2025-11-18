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


class Teacher(Base):
    """
    Teachers table - 선생님 추가 정보

    Related:
    - F-001: 선생님 전용 정보
    - F-006: 기본 수업료
    - 데이터베이스_설계서.md 3.2
    """

    __tablename__ = "teachers"

    # Primary Key (FK to users)
    user_id = Column(
        String(36),
        primary_key=True,
        index=True,
    )

    # Professional Information
    subjects = Column(String(500), nullable=True)  # JSON array stored as string for SQLite
    education = Column(String(500), nullable=True)  # 학력
    career_years = Column(String(10), nullable=True)  # 경력 (년) - String for SQLite
    introduction = Column(String(2000), nullable=True)  # 자기소개

    # Default lesson fee (F-006)
    default_hourly_rate = Column(String(20), nullable=True)  # 시간당 기본 수업료 - String for SQLite

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self):
        return f"<Teacher user_id={self.user_id}>"

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "subjects": self.subjects,
            "education": self.education,
            "career_years": self.career_years,
            "introduction": self.introduction,
            "default_hourly_rate": self.default_hourly_rate,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Student(Base):
    """
    Students table - 학생 추가 정보

    Related:
    - F-001: 학생 정보
    - F-002: 학부모 연결
    - 데이터베이스_설계서.md 3.3
    """

    __tablename__ = "students"

    # Primary Key (FK to users)
    user_id = Column(
        String(36),
        primary_key=True,
        index=True,
    )

    # Student Information
    school_name = Column(String(100), nullable=True)  # 학교명
    grade = Column(String(10), nullable=True)  # 학년 - String for SQLite
    birth_date = Column(DateTime, nullable=True)  # 생년월일

    # Parent connection
    parent_id = Column(String(36), nullable=True, index=True)  # FK to users

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self):
        return f"<Student user_id={self.user_id} school={self.school_name}>"

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "school_name": self.school_name,
            "grade": self.grade,
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "parent_id": self.parent_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Parent(Base):
    """
    Parents table - 학부모 추가 정보

    Related:
    - F-001: 학부모 정보
    - 데이터베이스_설계서.md 3.4
    """

    __tablename__ = "parents"

    # Primary Key (FK to users)
    user_id = Column(
        String(36),
        primary_key=True,
        index=True,
    )

    # Parent Information
    relation = Column(String(20), nullable=True)  # 'father', 'mother', 'guardian'

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self):
        return f"<Parent user_id={self.user_id} relation={self.relation}>"

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "relation": self.relation,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
