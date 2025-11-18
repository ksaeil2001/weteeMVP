"""
Lesson Record and Progress Schemas - F-005 수업 기록 및 진도 관리
API_명세서.md 6.5 F-005 기반 요청/응답 스키마
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


# ==========================
# Progress Record Schemas
# ==========================


class ProgressRecordBase(BaseModel):
    """
    진도 기록 기본 스키마
    """
    textbook_id: str = Field(..., description="교재 ID")
    start_page: int = Field(..., ge=1, description="시작 페이지")
    end_page: int = Field(..., ge=1, description="끝 페이지")

    @field_validator('end_page')
    @classmethod
    def validate_end_page(cls, v, info):
        """
        끝 페이지가 시작 페이지보다 크거나 같은지 검증
        """
        if 'start_page' in info.data and v < info.data['start_page']:
            raise ValueError('end_page must be greater than or equal to start_page')
        return v


class ProgressRecordCreate(ProgressRecordBase):
    """
    진도 기록 생성 스키마 (LessonRecord 생성 시 포함)
    """
    pass

    class Config:
        json_schema_extra = {
            "example": {
                "textbook_id": "textbook-123",
                "start_page": 53,
                "end_page": 67,
            }
        }


class ProgressRecordOut(ProgressRecordBase):
    """
    진도 기록 응답 스키마
    """
    progress_record_id: str
    lesson_record_id: str
    pages_covered: int  # 자동 계산된 진도량
    created_at: str

    # 교재 정보 (선택, 조인 결과)
    textbook_title: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "progress_record_id": "progress-123",
                "lesson_record_id": "lesson-456",
                "textbook_id": "textbook-789",
                "textbook_title": "수학의 정석 (상)",
                "start_page": 53,
                "end_page": 67,
                "pages_covered": 15,
                "created_at": "2025-11-18T16:30:00Z",
            }
        }


# ==========================
# Lesson Record Schemas
# ==========================


class LessonRecordBase(BaseModel):
    """
    수업 기록 기본 스키마 (공통 필드)
    """
    content: str = Field(..., min_length=10, max_length=2000, description="오늘 배운 내용 (필수, 10-2000자)")
    student_feedback: Optional[str] = Field(None, max_length=500, description="학생 상태/피드백 (선택, 최대 500자)")
    homework: Optional[str] = Field(None, max_length=1000, description="숙제 (선택, 최대 1000자)")


class CreateLessonRecordPayload(LessonRecordBase):
    """
    수업 기록 작성 요청 스키마

    POST /api/v1/schedules/{schedule_id}/lesson-record
    """
    progress_records: Optional[List[ProgressRecordCreate]] = Field(
        None,
        max_length=5,
        description="진도 기록 목록 (최대 5개, 여러 교재 사용 가능)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "content": "이차방정식의 판별식(b²-4ac) 개념 이해. 근의 개수 판별 연습. 응용 문제 5개 풀이",
                "student_feedback": "판별식 개념을 빠르게 이해했어요. 어려운 문제도 포기하지 않고 끝까지 풀려고 했습니다.",
                "homework": "교과서 67~70페이지 문제 풀어오기. 틀린 문제는 다시 풀어보세요.",
                "progress_records": [
                    {
                        "textbook_id": "textbook-123",
                        "start_page": 53,
                        "end_page": 67,
                    }
                ],
            }
        }


class UpdateLessonRecordPayload(BaseModel):
    """
    수업 기록 수정 요청 스키마

    PATCH /api/v1/lesson-records/{lesson_record_id}

    Notes:
    - 작성 후 30일 이내만 수정 가능 (비즈니스 규칙, 서비스 레이어에서 검증)
    - 진도 기록은 수정 불가 (새로 추가만 가능)
    """
    content: Optional[str] = Field(None, min_length=10, max_length=2000, description="오늘 배운 내용")
    student_feedback: Optional[str] = Field(None, max_length=500, description="학생 상태/피드백")
    homework: Optional[str] = Field(None, max_length=1000, description="숙제")

    class Config:
        json_schema_extra = {
            "example": {
                "student_feedback": "오늘 집중력이 좋았어요. (오타 수정)",
            }
        }


class LessonRecordOut(BaseModel):
    """
    수업 기록 응답 스키마
    """
    lesson_record_id: str
    schedule_id: str
    group_id: str

    content: str
    student_feedback: Optional[str] = None
    homework: Optional[str] = None

    created_by: str  # 작성한 선생님 ID
    teacher_name: Optional[str] = None  # 작성한 선생님 이름 (조인 결과)

    is_shared: bool
    shared_at: Optional[str] = None

    parent_viewed_at: Optional[str] = None
    student_viewed_at: Optional[str] = None

    created_at: str
    updated_at: Optional[str] = None

    # 진도 기록 목록 (선택, 상세 조회 시 포함)
    progress_records: Optional[List[ProgressRecordOut]] = None

    # 일정 정보 (선택, 조인 결과)
    schedule_title: Optional[str] = None
    schedule_date: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "lesson_record_id": "lesson-123",
                "schedule_id": "schedule-456",
                "group_id": "group-789",
                "content": "이차방정식의 판별식(b²-4ac) 개념 이해. 근의 개수 판별 연습. 응용 문제 5개 풀이",
                "student_feedback": "판별식 개념을 빠르게 이해했어요. 어려운 문제도 포기하지 않고 끝까지 풀려고 했습니다.",
                "homework": "교과서 67~70페이지 문제 풀어오기. 틀린 문제는 다시 풀어보세요.",
                "created_by": "user-001",
                "teacher_name": "김선생",
                "is_shared": True,
                "shared_at": "2025-11-18T16:30:00Z",
                "parent_viewed_at": "2025-11-18T18:00:00Z",
                "student_viewed_at": "2025-11-18T20:00:00Z",
                "created_at": "2025-11-18T16:30:00Z",
                "updated_at": "2025-11-18T16:30:00Z",
                "progress_records": [
                    {
                        "progress_record_id": "progress-123",
                        "lesson_record_id": "lesson-123",
                        "textbook_id": "textbook-789",
                        "textbook_title": "수학의 정석 (상)",
                        "start_page": 53,
                        "end_page": 67,
                        "pages_covered": 15,
                        "created_at": "2025-11-18T16:30:00Z",
                    }
                ],
                "schedule_title": "수학 정규 수업",
                "schedule_date": "2025-11-18",
            }
        }


# ==========================
# Pagination & List Response
# ==========================


class PaginationInfo(BaseModel):
    """
    페이지네이션 정보
    """
    total: int
    page: int
    size: int
    total_pages: int
    has_next: bool = False
    has_prev: bool = False


class LessonRecordListResponse(BaseModel):
    """
    수업 기록 목록 응답 (페이지네이션 포함)

    GET /api/v1/groups/{group_id}/lesson-records
    """
    items: List[LessonRecordOut]
    pagination: PaginationInfo

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "lesson_record_id": "lesson-123",
                        "schedule_id": "schedule-456",
                        "group_id": "group-789",
                        "content": "이차방정식의 판별식...",
                        "homework": "교과서 67~70페이지",
                        "created_by": "user-001",
                        "teacher_name": "김선생",
                        "is_shared": True,
                        "shared_at": "2025-11-18T16:30:00Z",
                        "created_at": "2025-11-18T16:30:00Z",
                        "schedule_title": "수학 정규 수업",
                        "schedule_date": "2025-11-18",
                    }
                ],
                "pagination": {
                    "total": 25,
                    "page": 1,
                    "size": 20,
                    "total_pages": 2,
                    "has_next": True,
                    "has_prev": False,
                },
            }
        }


# ==========================
# Progress Summary (진도 요약)
# ==========================


class ProgressSummary(BaseModel):
    """
    교재별 진도 요약 정보

    GET /api/v1/groups/{group_id}/progress/{textbook_id}
    """
    textbook_id: str
    textbook_title: str
    publisher: Optional[str] = None
    total_pages: Optional[int] = None
    start_page: int

    current_page: int  # 현재 진도 (마지막 end_page)
    progress_percentage: float  # 진도율 (%)

    total_lessons: int  # 총 수업 횟수
    average_pages_per_lesson: float  # 평균 진도 (페이지/회)

    first_lesson_date: Optional[str] = None  # 첫 수업 날짜
    last_lesson_date: Optional[str] = None  # 마지막 수업 날짜

    class Config:
        json_schema_extra = {
            "example": {
                "textbook_id": "textbook-123",
                "textbook_title": "수학의 정석 (상)",
                "publisher": "홍성대",
                "total_pages": 500,
                "start_page": 1,
                "current_page": 67,
                "progress_percentage": 13.4,
                "total_lessons": 8,
                "average_pages_per_lesson": 8.4,
                "first_lesson_date": "2025-10-01",
                "last_lesson_date": "2025-11-18",
            }
        }


class ProgressHistoryItem(BaseModel):
    """
    진도 히스토리 항목
    """
    progress_record_id: str
    lesson_record_id: str
    lesson_date: str
    start_page: int
    end_page: int
    pages_covered: int
    content_preview: Optional[str] = None  # 수업 내용 미리보기 (첫 50자)


class ProgressHistoryResponse(BaseModel):
    """
    교재별 진도 히스토리 응답

    GET /api/v1/groups/{group_id}/progress/{textbook_id}
    """
    summary: ProgressSummary
    history: List[ProgressHistoryItem]

    # 차트 데이터 (선택)
    chart_labels: Optional[List[str]] = None  # 날짜 레이블
    chart_values: Optional[List[int]] = None  # 누적 페이지 값

    class Config:
        json_schema_extra = {
            "example": {
                "summary": {
                    "textbook_id": "textbook-123",
                    "textbook_title": "수학의 정석 (상)",
                    "total_pages": 500,
                    "current_page": 67,
                    "progress_percentage": 13.4,
                    "total_lessons": 8,
                    "average_pages_per_lesson": 8.4,
                },
                "history": [
                    {
                        "progress_record_id": "progress-123",
                        "lesson_record_id": "lesson-456",
                        "lesson_date": "2025-11-18",
                        "start_page": 53,
                        "end_page": 67,
                        "pages_covered": 15,
                        "content_preview": "이차방정식의 판별식...",
                    }
                ],
                "chart_labels": ["10/01", "10/15", "11/01", "11/18"],
                "chart_values": [20, 35, 52, 67],
            }
        }
