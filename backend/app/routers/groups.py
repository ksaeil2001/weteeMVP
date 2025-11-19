"""
Groups Router - F-002 과외 그룹 생성 및 매칭
API_명세서.md 6.2 기반 그룹 관련 엔드포인트 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupOut,
    GroupListResponse,
    InviteCodeCreate,
    InviteCodeOut,
    JoinGroupRequest,
    JoinGroupResponse,  # 추가
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
        db.rollback()
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
        db.rollback()
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
# Invite Code Management - F-002
# ==========================

@router.post("/{group_id}/invite-codes", response_model=InviteCodeOut, status_code=status.HTTP_201_CREATED)
def create_invite_code(
    group_id: str,
    invite_code_create: InviteCodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    초대 코드 생성 (선생님만 가능)

    POST /api/v1/groups/{group_id}/invite-codes

    **기능**:
    - 새로운 초대 코드 생성
    - 코드는 6자리 알파벳 대문자 + 숫자로 생성됨
    - 기본값: 7일 유효, 1회 사용 가능
    - 그룹 소유자(선생님)만 생성 가능

    **Request Body**:
    - role: 초대할 역할 (STUDENT | PARENT) - 필수
    - expires_in_days: 유효 기간 (일 단위, 1-30, 기본값 7) - 선택
    - max_uses: 최대 사용 횟수 (1-100, 기본값 1) - 선택

    **Response**:
    - InviteCodeOut: 생성된 초대 코드 정보 (코드, 만료시각 등)

    **Errors**:
    - 403: 선생님이 아니거나 그룹 소유자가 아님
    - 404: 그룹을 찾을 수 없음
    - 429: 대기 중인 초대가 너무 많음 (그룹당 최대 10개)

    Related: F-002, API_명세서.md 6.2.2
    """
    try:
        result = GroupService.create_invite_code(
            db=db,
            creator=current_user,
            group_id=group_id,
            invite_code_create=invite_code_create,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "INVITE001",
                    "message": "초대 코드를 생성할 권한이 없거나 그룹을 찾을 수 없습니다.",
                },
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"🔥 Error creating invite code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVITE002",
                "message": "초대 코드 생성 중 오류가 발생했습니다.",
            },
        )


@router.get("/{group_id}/invite-codes", response_model=List[InviteCodeOut])
def get_invite_codes(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹의 초대 코드 목록 조회 (그룹 소유자만 가능)

    GET /api/v1/groups/{group_id}/invite-codes

    **기능**:
    - 그룹의 모든 초대 코드 목록 조회 (생성순)
    - 활성/비활성 코드 모두 포함
    - 그룹 소유자(선생님)만 조회 가능

    **Path Parameters**:
    - group_id: 그룹 ID

    **Response**:
    - List[InviteCodeOut]: 초대 코드 목록 (최신순 정렬)

    **Errors**:
    - 403: 선생님이 아니거나 그룹 소유자가 아님
    - 404: 그룹을 찾을 수 없음

    Related: F-002, API_명세서.md 6.2.2
    """
    try:
        result = GroupService.get_invite_codes_for_group(
            db=db,
            requester=current_user,
            group_id=group_id,
        )

        if result is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "INVITE003",
                    "message": "초대 코드를 조회할 권한이 없거나 그룹을 찾을 수 없습니다.",
                },
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"🔥 Error fetching invite codes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVITE004",
                "message": "초대 코드 목록을 가져오는 중 오류가 발생했습니다.",
            },
        )


@router.post("/join", response_model=JoinGroupResponse, status_code=status.HTTP_200_OK)
def join_group_with_code(
    request: JoinGroupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    초대 코드로 그룹에 가입

    POST /api/v1/groups/join

    **기능**:
    - 초대 코드를 사용하여 그룹에 가입
    - 코드의 유효성 검증 (존재, 미만료, 사용 가능)
    - 사용자 역할과 코드 역할 일치 확인
    - 그룹 멤버로 자동 추가
    - 초대 코드 사용 횟수 증가

    **Request Body**:
    - code: 초대 코드 (6자리, 필수)

    **Response**:
    - JoinGroupResponse: 가입한 그룹 및 멤버 정보

    **Errors**:
    - 400: 코드가 존재하지 않음, 만료됨, 이미 사용됨
    - 409: 역할 불일치, 이미 그룹 멤버임

    Related: F-002, API_명세서.md 6.2.3
    """
    try:
        group, member, error = GroupService.join_group_with_code(
            db=db,
            user=current_user,
            code=request.code,  # invite_code → code (스키마 변경 반영)
        )

        if error:
            # 에러 유형에 따라 적절한 HTTP 상태 코드 반환
            if "역할" in error or "전용" in error:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "INVITE005",
                        "message": error,
                    },
                )
            elif "이미" in error:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "INVITE006",
                        "message": error,
                    },
                )
            else:  # 코드 관련 에러
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "INVITE007",
                        "message": error,
                    },
                )

        # JoinGroupResponse 생성
        group_out = GroupService._to_group_out(group)
        member_out = GroupService._to_group_member_out(member)

        return JoinGroupResponse(
            group=group_out,
            member=member_out,
            message="그룹에 성공적으로 참여했습니다",
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"🔥 Error joining group with code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVITE008",
                "message": "그룹 가입 중 오류가 발생했습니다.",
            },
        )
