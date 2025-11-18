"""
Textbook Models - F-005 수업 기록 및 진도 관리
데이터베이스_설계서.md의 textbooks 테이블 정의를 기반으로 구현

Related:
- F-005_수업_기록_및_진도_관리.md
- F-002 (Group 모델과 N:1 관계)
- ProgressRecord (1:N 관계)
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Textbook(Base):
    """
    Textbooks table - 교재 정보

    Related:
    - F-005: 수업 기록 및 진도 관리
    - F-002: Group에 속함 (N:1)
    - ProgressRecord와 연결 (1:N)

    Notes:
    - 한 그룹에서 여러 교재를 사용할 수 있음
    - 교재별로 진도가 독립적으로 누적됨
    - 진도 기록이 있는 교재는 삭제 불가 (숨기기만 가능)
    """

    __tablename__ = "textbooks"

    # Primary Key
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # Foreign Keys
    group_id = Column(String(36), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)

    # Textbook Information
    title = Column(String(200), nullable=False)  # 교재명 (예: "자이스토리 수학 II")
    publisher = Column(String(100), nullable=True)  # 출판사 (선택)
    total_pages = Column(Integer, nullable=True)  # 전체 페이지 수 (진도율 계산용, 선택)

    # Start Page (교재 중간부터 시작하는 경우)
    start_page = Column(Integer, default=1, nullable=False)  # 시작 페이지 (기본 1)

    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)  # 활성 상태 (숨기기용)

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
    # TODO(F-005): Group 모델에 textbooks = relationship("Textbook", ...) 추가

    # ProgressRecord와의 관계 (1:N)
    # 한 교재에 여러 진도 기록이 있을 수 있음
    progress_records = relationship("ProgressRecord", back_populates="textbook", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Textbook {self.id} - {self.title} (Group {self.group_id})>"

    def to_dict(self):
        """
        Convert model to dictionary (API 응답용)
        프론트엔드 Textbook 타입과 일치하도록 구조화
        """
        return {
            "textbook_id": self.id,
            "group_id": self.group_id,
            "title": self.title,
            "publisher": self.publisher,
            "total_pages": self.total_pages,
            "start_page": self.start_page,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# TODO(Phase 2): Textbook Units/Chapters
# 교재의 단원/챕터 정보를 별도 테이블로 관리
# class TextbookUnit(Base):
#     __tablename__ = "textbook_units"
#     id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
#     textbook_id = Column(String(36), ForeignKey("textbooks.id"), nullable=False)
#     unit_number = Column(Integer, nullable=False)
#     unit_title = Column(String(200), nullable=False)
#     start_page = Column(Integer, nullable=False)
#     end_page = Column(Integer, nullable=False)
