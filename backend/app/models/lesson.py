"""
Lesson Record and Progress Models - F-005 수업 기록 및 진도 관리
데이터베이스_설계서.md의 lesson_records, progress_records 테이블 정의를 기반으로 구현

Related:
- F-005_수업_기록_및_진도_관리.md
- F-003 (Schedule 모델과 1:1 관계)
- F-002 (Group 모델과 N:1 관계)
- Textbook (진도 기록과 N:1 관계)
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class LessonRecord(Base):
    """
    Lesson_records table - 수업 기록

    Related:
    - F-005: 수업 기록 및 진도 관리
    - F-003: Schedule에 속함 (1:1, schedule_id UNIQUE)
    - F-002: Group에 속함 (N:1)
    - ProgressRecord와 연결 (1:N)

    Notes:
    - 한 일정(schedule)당 하나의 수업 기록만 가능
    - content는 필수 (최소 10자, F-005 규칙)
    - 학부모/학생에게 공유 가능
    - 읽음 상태 추적 (parent_viewed_at, student_viewed_at)
    - 작성 후 30일 이내만 수정 가능 (비즈니스 규칙)
    - 작성 후 24시간 이내만 삭제 가능 (비즈니스 규칙)
    """

    __tablename__ = "lesson_records"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Foreign Keys
    schedule_id = Column(
        String(36),
        ForeignKey("schedules.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # 한 일정당 하나의 수업 기록만
        index=True,
    )
    group_id = Column(String(36), ForeignKey("groups.id"), nullable=False, index=True)

    # Lesson Content
    content = Column(Text, nullable=False)  # 오늘 배운 내용 (필수, 최소 10자 - API 레벨에서 검증)
    student_feedback = Column(Text, nullable=True)  # 학생 상태/피드백 (선택, 최대 500자 - API 레벨에서 검증)
    homework = Column(Text, nullable=True)  # 숙제 (선택, 최대 1000자 - API 레벨에서 검증)

    # Created By
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)  # 작성한 선생님

    # Sharing Status
    is_shared = Column(Boolean, default=False, nullable=False)  # 학부모에게 공유 여부
    shared_at = Column(DateTime, nullable=True)  # 공유 시각

    # View Tracking
    parent_viewed_at = Column(DateTime, nullable=True)  # 학부모가 읽은 시각
    student_viewed_at = Column(DateTime, nullable=True)  # 학생이 읽은 시각

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Table Arguments: 복합 인덱스
    __table_args__ = (
        Index('idx_lesson_record_group_created', 'group_id', 'created_at'),
    )

    # Relationships
    # Schedule과의 관계 (1:1)
    # TODO(F-005): Schedule 모델에 lesson_record = relationship("LessonRecord", ...) 추가

    # Group과의 관계 (N:1)
    # TODO(F-005): Group 모델에 lesson_records = relationship("LessonRecord", ...) 추가

    # User(Teacher)와의 관계 (N:1)
    # TODO(F-005): User 모델에 lesson_records = relationship("LessonRecord", ...) 추가 (선택사항)

    # ProgressRecord와의 관계 (1:N)
    # 한 수업 기록에 여러 진도 기록이 있을 수 있음 (여러 교재 사용)
    progress_records = relationship("ProgressRecord", back_populates="lesson_record", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LessonRecord {self.id} - Schedule {self.schedule_id} - Group {self.group_id}>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        프론트엔드 LessonRecord 타입과 일치하도록 구조화
        """
        return {
            "lesson_record_id": self.id,
            "schedule_id": self.schedule_id,
            "group_id": self.group_id,
            "content": self.content,
            "student_feedback": self.student_feedback,
            "homework": self.homework,
            "created_by": self.created_by,
            "is_shared": self.is_shared,
            "shared_at": self.shared_at.isoformat() if self.shared_at else None,
            "parent_viewed_at": self.parent_viewed_at.isoformat() if self.parent_viewed_at else None,
            "student_viewed_at": self.student_viewed_at.isoformat() if self.student_viewed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ProgressRecord(Base):
    """
    Progress_records table - 진도 기록

    Related:
    - F-005: 수업 기록 및 진도 관리
    - LessonRecord에 속함 (N:1)
    - Textbook과 연결 (N:1)

    Notes:
    - 한 수업에서 여러 교재의 진도를 기록할 수 있음
    - start_page <= end_page (CHECK 제약)
    - pages_covered는 자동 계산 (end - start + 1)
    - 교재별로 진도가 독립적으로 누적됨
    """

    __tablename__ = "progress_records"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Foreign Keys
    lesson_record_id = Column(
        String(36),
        ForeignKey("lesson_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    textbook_id = Column(
        String(36),
        ForeignKey("textbooks.id"),
        nullable=False,
        index=True,
    )

    # Progress Pages
    start_page = Column(Integer, nullable=False)  # 시작 페이지 (1 이상)
    end_page = Column(Integer, nullable=False)  # 끝 페이지 (start_page 이상)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Check Constraints
    __table_args__ = (
        CheckConstraint('start_page > 0', name='check_start_page_positive'),
        CheckConstraint('end_page >= start_page', name='check_end_page_gte_start_page'),
    )

    # Relationships
    # LessonRecord와의 관계 (N:1)
    lesson_record = relationship("LessonRecord", back_populates="progress_records")

    # Textbook과의 관계 (N:1)
    textbook = relationship("Textbook", back_populates="progress_records")

    @property
    def pages_covered(self):
        """
        진도량 자동 계산 (end_page - start_page + 1)
        PostgreSQL GENERATED 컬럼 대신 Python property 사용 (SQLite 호환)
        """
        if self.start_page and self.end_page:
            return self.end_page - self.start_page + 1
        return 0

    def __repr__(self):
        return f"<ProgressRecord {self.id} - Lesson {self.lesson_record_id} - Textbook {self.textbook_id} - Pages {self.start_page}-{self.end_page}>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        프론트엔드 ProgressRecord 타입과 일치하도록 구조화
        """
        return {
            "progress_record_id": self.id,
            "lesson_record_id": self.lesson_record_id,
            "textbook_id": self.textbook_id,
            "start_page": self.start_page,
            "end_page": self.end_page,
            "pages_covered": self.pages_covered,  # 자동 계산
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# TODO(Phase 2): LessonRecordHistory 테이블 추가
# 수업 기록 수정 이력 추적용 (누가, 언제, 무엇을 수정했는지)
# class LessonRecordHistory(Base):
#     __tablename__ = "lesson_record_history"
#     id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
#     lesson_record_id = Column(String(36), ForeignKey("lesson_records.id"), nullable=False)
#     changed_by = Column(String(36), ForeignKey("users.id"), nullable=False)
#     field_name = Column(String(50), nullable=False)  # 'content', 'student_feedback', 'homework'
#     old_value = Column(Text, nullable=True)
#     new_value = Column(Text, nullable=True)
#     changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
