"""
Groups Router - F-002 과외 그룹 생성 및 매칭
API_명세서.md 6.2 기반 그룹 관련 엔드포인트 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupOut,
    GroupListResponse,
)
from app.services.group_service import GroupService

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=GroupListResponse)
def get_groups(
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기 (1-100)"),
    role: Optional[str] = Query(None, description="역할 필터 (TEACHER/STUDENT/PARENT)"),
    status: Optional[str] = Query(None, description="상태 필터 (ACTIVE/INACTIVE/ARCHIVED)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹 목록 조회 (페이지네이션)

    GET /api/v1/groups

    **기능**:
    - 로그인한 사용자가 속한 그룹 목록 조회
    - 역할별, 상태별 필터링 지원
    - 페이지네이션 지원
    - 최신순 정렬 (created_at DESC)

    **Query Parameters**:
    - page: 페이지 번호 (기본: 1)
    - size: 페이지 크기 (기본: 20, 최대: 100)
    - role: 역할 필터 (TEACHER/STUDENT/PARENT) - optional
    - status: 상태 필터 (ACTIVE/INACTIVE/ARCHIVED) - optional

    **Response**:
    - items: 그룹 목록 (GroupOut[])
    - pagination: 페이지네이션 정보

    Related: F-002, API_명세서.md 6.2.1
    """
    try:
        result = GroupService.get_groups_for_user(
            db=db,
            user=current_user,
            page=page,
            size=size,
            role_filter=role,
            status_filter=status,
        )
        return result

    except Exception as e:
        print(f"🔥 Error fetching groups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "GROUP001",
                "message": "그룹 목록을 가져오는 중 오류가 발생했습니다.",
            },
        )


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
def create_group(
    group_create: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹 생성 (선생님만 가능)

    POST /api/v1/groups

    **기능**:
    - 새로운 과외 그룹 생성
    - 그룹 생성자를 자동으로 TEACHER 역할의 멤버로 추가
    - 현재는 선생님만 그룹 생성 가능 (향후 확장 가능)

    **Request Body**:
    - name: 그룹 이름 (필수)
    - subject: 과목 (필수)
    - description: 그룹 설명 (선택)

    **Response**:
    - GroupOut: 생성된 그룹 정보

    Related: F-002, API_명세서.md 6.2.2
    """
    # TODO(v1): 선생님만 그룹 생성 가능하도록 제한
    # if current_user.role != UserRole.TEACHER:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail={
    #             "code": "GROUP002",
    #             "message": "그룹 생성은 선생님만 가능합니다.",
    #         },
    #     )

    try:
        group = GroupService.create_group(
            db=db,
            owner=current_user,
            group_create=group_create,
        )
        return group

    except Exception as e:
        print(f"🔥 Error creating group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "GROUP003",
                "message": "그룹 생성 중 오류가 발생했습니다.",
            },
        )


@router.get("/{group_id}", response_model=GroupOut)
def get_group_detail(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹 상세 조회

    GET /api/v1/groups/{group_id}

    **기능**:
    - 특정 그룹의 상세 정보 조회
    - 그룹 멤버 목록 포함
    - 사용자가 해당 그룹의 멤버인 경우에만 조회 가능

    **Path Parameters**:
    - group_id: 그룹 ID

    **Response**:
    - GroupOut: 그룹 상세 정보 (멤버 목록 포함)

    **Errors**:
    - 404: 그룹을 찾을 수 없거나 권한 없음

    Related: F-002, API_명세서.md 6.2.3
    """
    group = GroupService.get_group_detail(
        db=db,
        user=current_user,
        group_id=group_id,
    )

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "GROUP004",
                "message": "그룹을 찾을 수 없거나 접근 권한이 없습니다.",
            },
        )

    return group


@router.patch("/{group_id}", response_model=GroupOut)
def update_group(
    group_id: str,
    group_update: GroupUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹 정보 수정 (그룹 소유자만 가능)

    PATCH /api/v1/groups/{group_id}

    **기능**:
    - 그룹 정보 수정 (이름, 과목, 설명, 상태)
    - 그룹 소유자(owner)만 수정 가능

    **Path Parameters**:
    - group_id: 그룹 ID

    **Request Body** (모두 선택):
    - name: 그룹 이름
    - subject: 과목
    - description: 그룹 설명
    - status: 그룹 상태 (ACTIVE/INACTIVE/ARCHIVED)

    **Response**:
    - GroupOut: 수정된 그룹 정보

    **Errors**:
    - 404: 그룹을 찾을 수 없거나 권한 없음

    Related: F-002, API_명세서.md 6.2.4
    """
    group = GroupService.update_group(
        db=db,
        owner=current_user,
        group_id=group_id,
        group_update=group_update,
    )

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "GROUP005",
                "message": "그룹을 찾을 수 없거나 수정 권한이 없습니다.",
            },
        )

    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹 삭제 (그룹 소유자만 가능)

    DELETE /api/v1/groups/{group_id}

    **기능**:
    - 그룹 삭제 (물리적 삭제)
    - 그룹 소유자(owner)만 삭제 가능
    - 그룹 멤버도 함께 삭제됨 (cascade)

    **Path Parameters**:
    - group_id: 그룹 ID

    **Response**:
    - 204 No Content (성공)

    **Errors**:
    - 404: 그룹을 찾을 수 없거나 권한 없음

    Related: F-002, API_명세서.md 6.2.5
    """
    success = GroupService.delete_group(
        db=db,
        owner=current_user,
        group_id=group_id,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "GROUP006",
                "message": "그룹을 찾을 수 없거나 삭제 권한이 없습니다.",
            },
        )

    return None  # 204 No Content


# ==========================
# TODO: Phase 2 - 멤버 관리 & 초대 코드 기능
# ==========================

# @router.post("/{group_id}/members", response_model=GroupMemberOut, status_code=status.HTTP_201_CREATED)
# def add_group_member(...):
#     """그룹 멤버 추가"""
#     pass

# @router.delete("/{group_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
# def remove_group_member(...):
#     """그룹 멤버 제거"""
#     pass

# @router.post("/{group_id}/invite-codes", response_model=InviteCodeOut, status_code=status.HTTP_201_CREATED)
# def create_invite_code(...):
#     """초대 코드 생성"""
#     pass

# @router.get("/{group_id}/invite-codes", response_model=list[InviteCodeOut])
# def get_invite_codes(...):
#     """초대 코드 목록 조회"""
#     pass

# @router.post("/join", response_model=GroupOut, status_code=status.HTTP_200_OK)
# def join_group_with_code(...):
#     """초대 코드로 그룹 가입"""
#     pass
