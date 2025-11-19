"""
Group Models - F-002 과외 그룹 생성 및 매칭
데이터베이스_설계서.md의 groups, group_members 테이블 정의를 기반으로 구현
"""

from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
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


class Group(Base):
    """
    Groups table - 과외 그룹

    Related:
    - F-002: 과외 그룹 생성 및 매칭
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
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # F-006: 수업료 정산 관련 필드
    lesson_fee = Column(Integer, nullable=False, default=0)  # 회당 수업료 (원)
    payment_type = Column(
        String(20),
        nullable=False,
        default="postpaid"  # prepaid(선불) / postpaid(후불)
    )
    payment_cycle = Column(
        Integer,
        nullable=False,
        default=4  # 정산 주기 (회) - 기본 4회마다 정산
    )

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
            "payment_type": self.payment_type,
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
    group_id = Column(String(36), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

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
    - F-002: 과외 그룹 생성 및 매칭
    - 데이터베이스_설계서.md: invite_codes 테이블 정의
    """

    __tablename__ = "invite_codes"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Code
    code = Column(String(6), nullable=False, unique=True, index=True)  # 6자리 코드 (예: AB12CD)

    # Foreign Keys
    group_id = Column(String(36), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)  # FK to users table (선생님)

    # Target Role
    target_role = Column(
        SQLEnum(GroupMemberRole, name="invite_code_target_role", native_enum=False),
        nullable=False,
        index=True,
    )

    # Usage Limits
    max_uses = Column(Integer, nullable=False, default=1)  # 최대 사용 횟수
    used_count = Column(Integer, nullable=False, default=0)  # 현재 사용 횟수

    # Expiration
    expires_at = Column(DateTime, nullable=False, index=True)  # 만료 시각

    # Status
    is_active = Column(Boolean, nullable=False, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<InviteCode {self.code} - Group:{self.group_id} Role:{self.target_role}>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        """
        return {
            "invite_code_id": self.id,
            "code": self.code,
            "group_id": self.group_id,
            "target_role": self.target_role.value,
            "created_by": self.created_by,
            "max_uses": self.max_uses,
            "used_count": self.used_count,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def is_expired(self) -> bool:
        """코드가 만료되었는지 확인"""
        return datetime.utcnow() > self.expires_at

    def is_available(self) -> bool:
        """코드를 사용할 수 있는지 확인"""
        return self.is_active and not self.is_expired() and self.used_count < self.max_uses

    def increment_usage(self):
        """사용 횟수 증가"""
        self.used_count += 1
        if self.used_count >= self.max_uses:
            self.is_active = False
