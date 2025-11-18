"""
Attendance Models - F-004 출결 관리
데이터베이스_설계서.md의 attendances 테이블 정의를 기반으로 구현

Related:
- F-004_출결_관리.md
- F-003 (Schedule 모델과 1:N 관계)
- F-006 (Payment - 정산에 활용)
"""

from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class AttendanceStatus(str, enum.Enum):
    """
    출결 상태
    F-004: 출결 관리 - 비즈니스 규칙에서 정의된 4가지 상태
    """
    PRESENT = "PRESENT"          # 출석 - 정상 참여
    LATE = "LATE"                # 지각 - 늦게 도착
    EARLY_LEAVE = "EARLY_LEAVE"  # 조퇴 - 일찍 퇴실
    ABSENT = "ABSENT"            # 결석 - 불참


class Attendance(Base):
    """
    Attendances table - 출결 기록

    Related:
    - F-004: 출결 관리
    - F-003: Schedule에 속함 (N:1)
    - F-006: Payment 정산 시 출결 데이터 활용

    Notes:
    - 한 일정(schedule)에 한 학생당 하나의 출결 기록
    - UNIQUE(schedule_id, student_id) 제약
    - 결석(ABSENT)은 정산 시 수업 횟수에서 제외
    - 출석/지각/조퇴는 정산 시 수업 횟수에 포함
    """

    __tablename__ = "attendances"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Foreign Keys
    schedule_id = Column(String(36), ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    # Attendance Status
    status = Column(
        SQLEnum(AttendanceStatus, name="attendance_status", native_enum=False),
        nullable=False,
        index=True,
    )

    # Additional Info
    late_minutes = Column(Integer, nullable=True, default=0)  # 지각 시 몇 분 늦었는지 (선택)
    memo = Column(Text, nullable=True)  # 메모 (지각/조퇴/결석 사유 등)

    # Timestamps
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)  # 출결 기록 시각
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    # Schedule과의 관계 (N:1)
    schedule = relationship("Schedule", back_populates="attendances")

    # User(Student)와의 관계 (N:1)
    # TODO(F-004): User 모델에 attendances = relationship("Attendance", ...) 추가 (선택사항)

    def __repr__(self):
        return f"<Attendance {self.id} - Student {self.student_id} - {self.status} at Schedule {self.schedule_id}>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        프론트엔드 Attendance 타입과 일치하도록 구조화
        """
        return {
            "attendance_id": self.id,
            "schedule_id": self.schedule_id,
            "student_id": self.student_id,
            "status": self.status.value,
            "late_minutes": self.late_minutes,
            "memo": self.memo,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# TODO(Phase 2): Attendance History 테이블 추가
# 출결 수정 이력 추적용 (누가, 언제, 무엇을, 왜 수정했는지)
# class AttendanceHistory(Base):
#     __tablename__ = "attendance_history"
#     id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
#     attendance_id = Column(String(36), ForeignKey("attendances.id"), nullable=False)
#     changed_by = Column(String(36), ForeignKey("users.id"), nullable=False)
#     old_status = Column(String(20), nullable=False)
#     new_status = Column(String(20), nullable=False)
#     reason = Column(Text, nullable=True)
#     changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
