"""
Lessons Router - F-005 수업 기록 관리
API_명세서.md 6.5 F-005 기반 수업 기록 관련 엔드포인트 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.lesson import (
    CreateLessonRecordPayload,
    UpdateLessonRecordPayload,
    LessonRecordOut,
    LessonRecordListResponse,
)
from app.services.lesson_service import LessonService

router = APIRouter(prefix="/lesson-records", tags=["lessons"])


# ==========================
# 수업 기록 작성
# ==========================

@router.post("/schedules/{schedule_id}", response_model=LessonRecordOut, status_code=status.HTTP_201_CREATED)
def create_lesson_record(
    schedule_id: str = Path(..., description="일정 ID"),
    payload: CreateLessonRecordPayload = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    수업 기록 작성

    POST /api/v1/lesson-records/schedules/{schedule_id}

    **기능**:
    - 특정 일정에 대한 수업 기록 작성
    - 선생님만 가능
    - 한 일정당 하나의 수업 기록만 작성 가능
    - 여러 교재의 진도를 동시에 기록 가능 (최대 5개)

    **Request Body**:
    - content: 오늘 배운 내용 (필수, 10-2000자)
    - student_feedback: 학생 상태/피드백 (선택, 최대 500자)
    - homework: 숙제 (선택, 최대 1000자)
    - progress_records: 진도 기록 목록 (선택, 최대 5개)

    **Response**:
    - LessonRecordOut: 생성된 수업 기록

    Related: F-005, API_명세서.md 6.5.1
    """
    try:
        result = LessonService.create_lesson_record(
            db=db,
            user=current_user,
            schedule_id=schedule_id,
            payload=payload
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error creating lesson record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "LESSON001",
                "message": "수업 기록 작성 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 수업 기록 상세 조회
# ==========================

@router.get("/{lesson_record_id}", response_model=LessonRecordOut)
def get_lesson_record(
    lesson_record_id: str = Path(..., description="수업 기록 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    수업 기록 상세 조회

    GET /api/v1/lesson-records/{lesson_record_id}

    **기능**:
    - 특정 수업 기록의 상세 정보 조회
    - 그룹 멤버만 조회 가능
    - 학부모/학생이 조회 시 읽음 상태 자동 업데이트

    **Response**:
    - LessonRecordOut: 수업 기록 상세 (진도 기록 포함)

    Related: F-005
    """
    try:
        result = LessonService.get_lesson_record(
            db=db,
            user=current_user,
            lesson_record_id=lesson_record_id
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error getting lesson record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "LESSON002",
                "message": "수업 기록 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 수업 기록 수정
# ==========================

@router.patch("/{lesson_record_id}", response_model=LessonRecordOut)
def update_lesson_record(
    lesson_record_id: str = Path(..., description="수업 기록 ID"),
    payload: UpdateLessonRecordPayload = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    수업 기록 수정

    PATCH /api/v1/lesson-records/{lesson_record_id}

    **기능**:
    - 수업 기록 내용 수정
    - 본인이 작성한 기록만 수정 가능 (선생님)
    - 작성 후 30일 이내만 수정 가능 (F-005 규칙)
    - 진도 기록은 수정 불가 (새로 추가만 가능)

    **Request Body**:
    - content: 오늘 배운 내용 (선택)
    - student_feedback: 학생 상태/피드백 (선택)
    - homework: 숙제 (선택)

    **Response**:
    - LessonRecordOut: 수정된 수업 기록

    Related: F-005
    """
    try:
        result = LessonService.update_lesson_record(
            db=db,
            user=current_user,
            lesson_record_id=lesson_record_id,
            payload=payload
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error updating lesson record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "LESSON003",
                "message": "수업 기록 수정 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 수업 기록 삭제
# ==========================

@router.delete("/{lesson_record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson_record(
    lesson_record_id: str = Path(..., description="수업 기록 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    수업 기록 삭제

    DELETE /api/v1/lesson-records/{lesson_record_id}

    **기능**:
    - 수업 기록 삭제
    - 본인이 작성한 기록만 삭제 가능 (선생님)
    - 작성 후 24시간 이내만 삭제 가능 (F-005 규칙)
    - 학부모가 이미 확인한 기록은 삭제하지 않도록 유도

    **Response**:
    - 204 No Content

    Related: F-005
    """
    try:
        LessonService.delete_lesson_record(
            db=db,
            user=current_user,
            lesson_record_id=lesson_record_id
        )
        return None

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error deleting lesson record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "LESSON004",
                "message": "수업 기록 삭제 중 오류가 발생했습니다.",
            },
        )


# TODO(Phase 2): 수업 기록 목록 조회 (그룹별 페이지네이션)
# GET /api/v1/groups/{group_id}/lesson-records
# TODO(Phase 2): 수업 기록 검색/필터링
# TODO(Phase 2): 진도 리포트 생성
