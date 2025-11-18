"""
Group Models - F-002 과외 그룹 생성 및 매칭
데이터베이스_설계서.md의 groups, group_members, invite_codes 테이블 정의를 기반으로 구현
"""

from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class GroupStatus(str, enum.Enum):
    """
    그룹 상태
    F-002: 과외 그룹의 활성화 상태
    """
    ACTIVE = "ACTIVE"        # 활성 그룹
    INACTIVE = "INACTIVE"    # 비활성 그룹
    ARCHIVED = "ARCHIVED"    # 보관됨 (종료된 그룹)


class GroupMemberRole(str, enum.Enum):
    """
    그룹 멤버 역할
    F-002: 그룹 내에서의 역할
    """
    TEACHER = "TEACHER"    # 선생님 (그룹 생성자)
    STUDENT = "STUDENT"    # 학생
    PARENT = "PARENT"      # 학부모


class GroupMemberInviteStatus(str, enum.Enum):
    """
    초대 상태
    F-002: 그룹 초대 상태 (MVP에서는 기본값 ACCEPTED)
    """
    PENDING = "PENDING"      # 초대 대기 중
    ACCEPTED = "ACCEPTED"    # 수락됨
    REJECTED = "REJECTED"    # 거절됨


class PaymentType(str, enum.Enum):
    """
    정산 타입
    F-006: 수업료 정산 방식
    """
    PREPAID = "prepaid"   # 선불
    POSTPAID = "postpaid" # 후불


class Group(Base):
    """
    Groups table - 과외 그룹

    Related:
    - F-002: 과외 그룹 생성 및 매칭
    - F-006: 수업료 정산
    - 데이터베이스_설계서.md 3.5
    """

    __tablename__ = "groups"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Group Information
    name = Column(String(100), nullable=False)  # 그룹 이름 (예: "중3 수학 반A")
    subject = Column(String(50), nullable=False)  # 과목 (예: "수학", "영어")
    description = Column(Text, nullable=True)  # 그룹 설명 (선택)

    # Owner (선생님)
    # Foreign Key to users table
    owner_id = Column(String(36), nullable=False, index=True)

    # Payment settings (F-006 수업료 정산)
    lesson_fee = Column(Integer, nullable=False)  # 회당 수업료
    payment_type = Column(
        SQLEnum(PaymentType, name="payment_type", native_enum=False),
        nullable=False,
        default=PaymentType.POSTPAID,
    )  # 'prepaid', 'postpaid'
    payment_cycle = Column(Integer, nullable=False, default=4)  # 정산 주기 (회)

    # Status
    status = Column(
        SQLEnum(GroupStatus, name="group_status", native_enum=False),
        nullable=False,
        default=GroupStatus.ACTIVE,
        index=True,
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    # GroupMember와의 관계 (1:N)
    members = relationship(
        "GroupMember",
        back_populates="group",
        cascade="all, delete-orphan",  # 그룹 삭제 시 멤버도 삭제
    )

    def __repr__(self):
        return f"<Group {self.id} - {self.name} ({self.subject})>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        """
        return {
            "group_id": self.id,
            "name": self.name,
            "subject": self.subject,
            "description": self.description,
            "owner_id": self.owner_id,
            "lesson_fee": self.lesson_fee,
            "payment_type": self.payment_type.value,
            "payment_cycle": self.payment_cycle,
            "status": self.status.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class GroupMember(Base):
    """
    GroupMembers table - 그룹 멤버

    Related:
    - F-002: 과외 그룹 생성 및 매칭
    """

    __tablename__ = "group_members"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Foreign Keys
    group_id = Column(String(36), ForeignKey("groups.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)  # FK to users table

    # Role
    role = Column(
        SQLEnum(GroupMemberRole, name="group_member_role", native_enum=False),
        nullable=False,
        index=True,
    )

    # Invite Status
    invite_status = Column(
        SQLEnum(GroupMemberInviteStatus, name="group_member_invite_status", native_enum=False),
        nullable=False,
        default=GroupMemberInviteStatus.ACCEPTED,
    )

    # Timestamps
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    group = relationship("Group", back_populates="members")

    def __repr__(self):
        return f"<GroupMember {self.id} - Group:{self.group_id} User:{self.user_id} ({self.role})>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        """
        return {
            "member_id": self.id,
            "group_id": self.group_id,
            "user_id": self.user_id,
            "role": self.role.value,
            "invite_status": self.invite_status.value,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }


class InviteCode(Base):
    """
    InviteCodes table - 초대 코드

    Related:
    - F-002: 과외 그룹 생성 및 매칭 (초대 코드)
    - 데이터베이스_설계서.md 3.7
    """

    __tablename__ = "invite_codes"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Invite Code
    code = Column(String(6), unique=True, nullable=False, index=True)  # 6자리 코드

    # Foreign Keys
    group_id = Column(String(36), ForeignKey("groups.id"), nullable=False, index=True)
    created_by = Column(String(36), nullable=False)  # FK to users (선생님)

    # Target role
    target_role = Column(String(20), nullable=False)  # 'student', 'parent'

    # Usage tracking
    max_uses = Column(Integer, nullable=False, default=1)  # 최대 사용 횟수
    used_count = Column(Integer, nullable=False, default=0)  # 현재 사용 횟수

    # Expiration
    expires_at = Column(DateTime, nullable=False)  # 만료 시각 (생성 후 7일)

    # Status
    is_active = Column(Boolean, nullable=False, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<InviteCode {self.code} group={self.group_id} uses={self.used_count}/{self.max_uses}>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        """
        return {
            "id": self.id,
            "code": self.code,
            "group_id": self.group_id,
            "created_by": self.created_by,
            "target_role": self.target_role,
            "max_uses": self.max_uses,
            "used_count": self.used_count,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def is_valid(self):
        """
        초대 코드가 유효한지 확인
        """
        if not self.is_active:
            return False
        if self.used_count >= self.max_uses:
            return False
        if self.expires_at < datetime.utcnow():
            return False
        return True
