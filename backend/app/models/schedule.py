"""
Schedule Models - F-003 수업 일정 관리
데이터베이스_설계서.md의 schedules 테이블 정의를 기반으로 구현

Related:
- F-003_수업_일정_관리.md
- F-002 (Group 모델과 1:N 관계)
- F-004 (Attendance - 향후 연결)
- F-006 (Payment - 향후 연결)
"""

from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class ScheduleType(str, enum.Enum):
    """
    수업 일정 타입
    F-003: 일정의 종류
    """
    REGULAR = "REGULAR"      # 정규 수업
    MAKEUP = "MAKEUP"        # 보강 수업
    EXAM = "EXAM"            # 시험 일정 (학생 시험 기간)
    HOLIDAY = "HOLIDAY"      # 휴강
    OTHER = "OTHER"          # 기타


class ScheduleStatus(str, enum.Enum):
    """
    일정 상태
    F-003: 일정의 진행 상태
    """
    SCHEDULED = "SCHEDULED"      # 예정
    DONE = "DONE"                # 완료
    CANCELED = "CANCELED"        # 취소됨
    RESCHEDULED = "RESCHEDULED"  # 일정 변경됨


class Schedule(Base):
    """
    Schedules table - 수업 일정

    Related:
    - F-003: 수업 일정 관리
    - F-002: Group에 속함 (1:N)
    - F-004: Attendance와 연결 (향후)
    """

    __tablename__ = "schedules"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Foreign Keys
    group_id = Column(String(36), ForeignKey("groups.id"), nullable=False, index=True)
    # teacher_id와 student_ids는 Group을 통해 조회 가능하므로 비정규화 필드로 추가 (성능)
    # 또는 Group 조인으로 해결 가능 (MVP에서는 비정규화 선택)

    # Schedule Information
    title = Column(String(200), nullable=False)  # 예: "수학 수업", "영어 보강"
    type = Column(
        SQLEnum(ScheduleType, name="schedule_type", native_enum=False),
        nullable=False,
        default=ScheduleType.REGULAR,
        index=True,
    )

    # Date and Time
    # startAt, endAt은 ISO8601 형식의 datetime 저장
    start_at = Column(DateTime, nullable=False, index=True)
    end_at = Column(DateTime, nullable=False)

    # Status
    status = Column(
        SQLEnum(ScheduleStatus, name="schedule_status", native_enum=False),
        nullable=False,
        default=ScheduleStatus.SCHEDULED,
        index=True,
    )

    # Recurrence Rule (반복 규칙) - JSON 형식
    # 정규 수업인 경우 반복 규칙 저장
    # 예: {"frequency": "weekly", "interval": 1, "daysOfWeek": [1, 3, 5], ...}
    # NULL이면 단일 일정
    recurrence_rule = Column(JSON, nullable=True)

    # Location and Memo
    location = Column(String(200), nullable=True)  # 수업 장소
    memo = Column(Text, nullable=True)  # 메모

    # Original Schedule (보강/변경인 경우)
    # 보강 수업이거나 일정 변경된 경우, 원래 일정 ID
    original_schedule_id = Column(String(36), nullable=True, index=True)

    # Cancellation / Rescheduling Reason
    cancel_reason = Column(Text, nullable=True)
    reschedule_reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    # Group과의 관계 (N:1)
    # 참고: Group 모델에 schedules = relationship("Schedule", ...) 추가 필요
    # TODO(F-003): Group 모델에 역관계 추가

    # Attendance와의 관계 (1:N)
    # 한 일정에 여러 학생의 출결이 있을 수 있음
    attendances = relationship("Attendance", back_populates="schedule", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Schedule {self.id} - {self.title} ({self.type}) at {self.start_at}>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        프론트엔드 Schedule 타입과 일치하도록 camelCase 사용
        """
        result = {
            "schedule_id": self.id,
            "group_id": self.group_id,
            "title": self.title,
            "type": self.type.value,
            "start_at": self.start_at.isoformat() if self.start_at else None,
            "end_at": self.end_at.isoformat() if self.end_at else None,
            "status": self.status.value,
            "recurrence_rule": self.recurrence_rule,  # JSON 그대로 반환
            "location": self.location,
            "memo": self.memo,
            "original_schedule_id": self.original_schedule_id,
            "cancel_reason": self.cancel_reason,
            "reschedule_reason": self.reschedule_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        # TODO(F-003): teacher_id, teacherName, studentIds, studentNames 추가
        # Group을 조인해서 가져와야 함

        return result


# TODO(Phase 2): MakeupSlot 모델 추가
# 보강 가능 시간 오픈을 별도 테이블로 관리
# class MakeupSlot(Base):
#     __tablename__ = "makeup_slots"
#     ...
