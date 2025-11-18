"""
Attendances Router - F-004 출결 관리
API_명세서.md 6.4 F-004 기반 출결 관련 엔드포인트 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.attendance import (
    CreateAttendancePayload,
    BatchCreateAttendancePayload,
    UpdateAttendancePayload,
    AttendanceOut,
    AttendanceListResponse,
    AttendanceStatsResponse,
    BatchAttendanceResponse,
)
from app.services.attendance_service import AttendanceService

router = APIRouter(prefix="/attendances", tags=["attendances"])


# ==========================
# 출결 생성 (단일)
# ==========================

@router.post("", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def create_attendance(
    payload: CreateAttendancePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    출결 생성 (단일 학생)

    POST /api/v1/attendances

    **기능**:
    - 특정 일정에 대한 특정 학생의 출결 기록 생성
    - 선생님만 가능
    - 수업 시작 시간 이후부터 체크 가능
    - 수업 종료 후 7일 이내까지만 체크 가능

    **Request Body**:
    - schedule_id: 일정 ID
    - student_id: 학생 ID
    - status: 출결 상태 (PRESENT/LATE/EARLY_LEAVE/ABSENT)
    - late_minutes: 지각 시간 (분, 선택)
    - notes: 메모 (선택)

    **Response**:
    - AttendanceOut: 생성된 출결 정보

    Related: F-004, API_명세서.md 6.4.1
    """
    try:
        result = AttendanceService.create_attendance(
            db=db,
            user=current_user,
            payload=payload
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error creating attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ATTENDANCE001",
                "message": "출결 기록 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 배치 출결 체크 (여러 학생 동시)
# ==========================

@router.post("/schedules/{schedule_id}/batch", response_model=BatchAttendanceResponse, status_code=status.HTTP_201_CREATED)
def batch_create_attendances(
    schedule_id: str = Path(..., description="일정 ID"),
    payload: BatchCreateAttendancePayload = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    배치 출결 체크 (여러 학생 동시)

    POST /api/v1/attendances/schedules/{schedule_id}/batch

    **기능**:
    - 한 일정에 대해 여러 학생의 출결을 한 번에 기록
    - 선생님만 가능
    - 이미 기록된 출결이 있으면 덮어쓰기 (업데이트)

    **Path Parameters**:
    - schedule_id: 일정 ID

    **Request Body**:
    - attendances: 출결 목록 (학생별 status, late_minutes, notes)
    - checked_at: 출결 체크 시각 (선택)

    **Response**:
    - schedule_id: 일정 ID
    - attendances: 생성된 출결 목록

    Related: F-004, API_명세서.md 6.4.1
    """
    try:
        result = AttendanceService.batch_create_attendances(
            db=db,
            user=current_user,
            schedule_id=schedule_id,
            payload=payload
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error batch creating attendances: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ATTENDANCE002",
                "message": "배치 출결 기록 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 출결 단건 조회
# ==========================

@router.get("/{attendance_id}", response_model=AttendanceOut)
def get_attendance(
    attendance_id: str = Path(..., description="출결 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    출결 단건 조회

    GET /api/v1/attendances/{attendance_id}

    **기능**:
    - 특정 출결 기록 상세 조회
    - 그룹 멤버만 조회 가능

    **Path Parameters**:
    - attendance_id: 출결 ID

    **Response**:
    - AttendanceOut: 출결 정보

    Related: F-004
    """
    try:
        result = AttendanceService.get_attendance(
            db=db,
            user=current_user,
            attendance_id=attendance_id
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error fetching attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ATTENDANCE003",
                "message": "출결 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 출결 수정
# ==========================

@router.patch("/{attendance_id}", response_model=AttendanceOut)
def update_attendance(
    attendance_id: str = Path(..., description="출결 ID"),
    payload: UpdateAttendancePayload = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    출결 수정

    PATCH /api/v1/attendances/{attendance_id}

    **기능**:
    - 기존 출결 기록 수정
    - 선생님만 가능
    - 최초 기록 후 7일 이내까지만 수정 가능
    - 정산 완료 후에는 수정 불가 (TODO)

    **Path Parameters**:
    - attendance_id: 출결 ID

    **Request Body**:
    - status: 출결 상태 (선택)
    - late_minutes: 지각 시간 (선택)
    - notes: 메모 (선택)

    **Response**:
    - AttendanceOut: 수정된 출결 정보

    Related: F-004, API_명세서.md 6.4.2
    """
    try:
        result = AttendanceService.update_attendance(
            db=db,
            user=current_user,
            attendance_id=attendance_id,
            payload=payload
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error updating attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ATTENDANCE004",
                "message": "출결 수정 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 일정별 출결 목록 조회
# ==========================

@router.get("/schedules/{schedule_id}", response_model=AttendanceListResponse)
def get_attendances_by_schedule(
    schedule_id: str = Path(..., description="일정 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    일정별 출결 목록 조회

    GET /api/v1/attendances/schedules/{schedule_id}

    **기능**:
    - 특정 일정에 대한 모든 학생의 출결 목록 조회
    - 그룹 멤버만 조회 가능

    **Path Parameters**:
    - schedule_id: 일정 ID

    **Response**:
    - items: 출결 목록
    - total: 전체 출결 수

    Related: F-004
    """
    try:
        result = AttendanceService.get_attendances_by_schedule(
            db=db,
            user=current_user,
            schedule_id=schedule_id
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error fetching attendances by schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ATTENDANCE005",
                "message": "일정별 출결 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 학생별 출결 목록 조회
# ==========================

@router.get("/students/{student_id}", response_model=AttendanceListResponse)
def get_attendances_by_student(
    student_id: str = Path(..., description="학생 ID"),
    group_id: Optional[str] = Query(None, description="그룹 ID (선택)"),
    start_date: Optional[str] = Query(None, description="시작 날짜 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="종료 날짜 (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    학생별 출결 목록 조회

    GET /api/v1/attendances/students/{student_id}

    **기능**:
    - 특정 학생의 출결 목록 조회
    - 날짜 범위 필터링 지원
    - 그룹 필터링 지원

    **Path Parameters**:
    - student_id: 학생 ID

    **Query Parameters**:
    - group_id: 그룹 ID 필터 (선택)
    - start_date: 시작 날짜 (YYYY-MM-DD, 선택)
    - end_date: 종료 날짜 (YYYY-MM-DD, 선택)

    **Response**:
    - items: 출결 목록
    - total: 전체 출결 수

    Related: F-004
    """
    try:
        result = AttendanceService.get_attendances_by_student(
            db=db,
            user=current_user,
            student_id=student_id,
            group_id=group_id,
            start_date=start_date,
            end_date=end_date,
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error fetching attendances by student: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ATTENDANCE006",
                "message": "학생별 출결 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 출결 통계 조회
# ==========================

@router.get("/groups/{group_id}/stats", response_model=AttendanceStatsResponse)
def get_attendance_stats(
    group_id: str = Path(..., description="그룹 ID"),
    student_id: Optional[str] = Query(None, description="학생 ID (선택, 특정 학생 통계)"),
    start_date: Optional[str] = Query(None, description="시작 날짜 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="종료 날짜 (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    출결 통계 조회

    GET /api/v1/attendances/groups/{group_id}/stats

    **기능**:
    - 그룹 전체 또는 특정 학생의 출결 통계 조회
    - 날짜 범위 필터링 지원 (기본값: 당월)
    - 출석률, 출석/지각/조퇴/결석 횟수 제공
    - 최근 출결 기록 포함

    **Path Parameters**:
    - group_id: 그룹 ID

    **Query Parameters**:
    - student_id: 학생 ID (선택, 특정 학생 통계)
    - start_date: 시작 날짜 (YYYY-MM-DD, 선택)
    - end_date: 종료 날짜 (YYYY-MM-DD, 선택)

    **Response**:
    - student: 학생 정보 (특정 학생 통계일 경우)
    - period: 조회 기간
    - stats: 통계 (total_sessions, present, late, early_leave, absent, attendance_rate)
    - recent_records: 최근 출결 기록 (최대 10개)

    Related: F-004, API_명세서.md 6.4.3
    """
    try:
        result = AttendanceService.get_attendance_stats(
            db=db,
            user=current_user,
            group_id=group_id,
            student_id=student_id,
            start_date=start_date,
            end_date=end_date,
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🔥 Error fetching attendance stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ATTENDANCE007",
                "message": "출결 통계 조회 중 오류가 발생했습니다.",
            },
        )
