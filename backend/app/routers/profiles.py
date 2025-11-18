"""
Profiles Router - F-007 기본 프로필 및 설정
API_명세서.md 6.7 기반 프로필 및 설정 엔드포인트 구현
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, IntegrityError

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.profile import (
    UserProfileOut,
    UserProfileUpdate,
    ProfileImageUploadResponse,
    NotificationSettingsOut,
    NotificationSettingsUpdate,
    PasswordChangeRequest,
    PasswordChangeResponse,
)
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/users", tags=["profiles"])


@router.get("/me", response_model=UserProfileOut)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    사용자 프로필 조회

    GET /api/v1/users/me

    **기능**:
    - 현재 로그인한 사용자의 프로필 정보 조회
    - 이름, 전화번호, 이메일, 역할, 프로필 사진 등 반환

    **권한**: 본인만 조회 가능

    Related: F-007, API_명세서.md 6.7.1
    """
    try:
        return ProfileService.get_user_profile(db, current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로필 조회에 실패했습니다",
        )


@router.patch("/me", response_model=UserProfileOut)
def update_my_profile(
    update_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    사용자 프로필 수정

    PATCH /api/v1/users/me

    **기능**:
    - 현재 로그인한 사용자의 프로필 정보 수정
    - 이름, 전화번호 변경 가능
    - 이메일은 변경 불가 (F-007 규칙)

    **권한**: 본인만 수정 가능

    **비즈니스 규칙**:
    - 이메일 주소는 수정 불가 (계정의 고유 식별자)
    - 이름: 1-50자
    - 전화번호: 010-XXXX-XXXX 형식 (자동 포맷팅)

    Related: F-007, API_명세서.md 6.7.2
    """
    try:
        return ProfileService.update_user_profile(db, current_user, update_data)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로필 수정에 실패했습니다",
        )


@router.post("/me/profile-image", response_model=ProfileImageUploadResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    프로필 사진 업로드

    POST /api/v1/users/me/profile-image

    **기능**:
    - 프로필 사진 업로드
    - 이미지 파일 검증 (JPG, PNG)
    - 파일 크기 제한 (최대 10MB)

    **권한**: 본인만 업로드 가능

    **비즈니스 규칙** (F-007):
    - 허용 형식: JPG, PNG, HEIC
    - 최대 파일 크기: 10MB
    - 권장 해상도: 500x500px 이상

    **MVP 구현**:
    - 실제 파일 업로드는 로컬 저장 또는 TODO로 표시
    - S3 업로드는 2단계에서 구현

    Related: F-007, API_명세서.md 6.7.3
    """
    # 파일 형식 검증
    allowed_types = ["image/jpeg", "image/png", "image/heic"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원하지 않는 형식입니다. JPG, PNG, HEIC 파일을 선택해주세요",
        )

    # 파일 크기 검증 (10MB = 10 * 1024 * 1024)
    max_size = 10 * 1024 * 1024
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요",
        )

    # TODO(v2): S3 업로드 구현
    # - S3 버킷에 파일 업로드
    # - 파일명: {user_id}_{timestamp}.{ext}
    # - 자동 리사이즈: 300x300px
    # - CDN URL 반환

    # MVP: 임시로 로컬 경로 반환 (실제 업로드는 하지 않음)
    # 프론트엔드에서는 이 URL을 사용하여 이미지 표시
    image_url = f"https://s3.amazonaws.com/wetee-profile-images/{current_user.id}/profile.jpg"

    try:
        ProfileService.update_profile_image(db, current_user, image_url)
        return ProfileImageUploadResponse(
            profile_image_url=image_url,
            uploaded_at=datetime.utcnow(),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="이미지 업로드에 실패했습니다",
        )


@router.get("/me/settings", response_model=NotificationSettingsOut)
def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    알림 설정 조회

    GET /api/v1/users/me/settings

    **기능**:
    - 현재 로그인한 사용자의 알림 및 앱 설정 조회
    - 푸시 알림, 이메일 알림, 카테고리별 알림 설정
    - 야간 알림 제한, 테마, 기본 화면 설정

    **권한**: 본인만 조회 가능

    Related: F-007, F-008, API_명세서.md 6.7.4
    """
    try:
        return ProfileService.get_notification_settings(db, current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="설정 조회에 실패했습니다",
        )


@router.patch("/me/settings", response_model=NotificationSettingsOut)
def update_notification_settings(
    update_data: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    알림 설정 변경

    PATCH /api/v1/users/me/settings

    **기능**:
    - 알림 및 앱 설정 변경
    - 푸시 알림, 이메일 알림 on/off
    - 카테고리별 알림 설정 (수업, 출결, 정산, 그룹)
    - 야간 알림 제한 시간 설정
    - 테마 변경 (light, dark, auto)

    **권한**: 본인만 변경 가능

    **비즈니스 규칙** (F-007):
    - 정산 알림은 끌 수 없음 (중요 알림)
    - 야간 알림 제한 시간: HH:MM 형식
    - 변경 사항은 즉시 저장 (자동 저장)

    Related: F-007, F-008, API_명세서.md 6.7.5
    """
    try:
        return ProfileService.update_notification_settings(db, current_user, update_data)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="설정 변경에 실패했습니다",
        )


@router.post("/me/change-password", response_model=PasswordChangeResponse)
def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    비밀번호 변경

    POST /api/v1/users/me/change-password

    **기능**:
    - 현재 비밀번호 확인 후 새 비밀번호로 변경
    - 비밀번호 강도 검증 (F-001 규칙)
    - 변경 후 자동 로그아웃 필요 (클라이언트 처리)

    **권한**: 본인만 변경 가능

    **비즈니스 규칙** (F-007):
    - 현재 비밀번호 확인 필수
    - 새 비밀번호: 8자 이상, 대문자/숫자/특수문자 포함
    - 현재 비밀번호와 동일한 비밀번호 사용 불가
    - 최근 3개월 내 사용한 비밀번호 재사용 불가 (TODO: v2)
    - 변경 완료 시 이메일 알림 발송 (TODO: v2)

    **주의**:
    - 비밀번호 변경 후 클라이언트에서 자동 로그아웃 처리 필요
    - 다른 기기에서 로그인된 세션도 무효화 (TODO: v2)

    Related: F-007, API_명세서.md 6.7.6
    """
    try:
        success = ProfileService.change_password(
            db,
            current_user,
            password_data.current_password,
            password_data.new_password,
        )

        if success:
            # TODO(v2): 이메일 알림 발송
            # - 비밀번호 변경 알림 이메일 발송
            # - 다른 기기에서 로그인된 세션 무효화

            return PasswordChangeResponse(
                message="비밀번호가 성공적으로 변경되었습니다",
                changed_at=datetime.utcnow(),
            )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="비밀번호 변경에 실패했습니다",
        )


# TODO(v2): 로그인 기록 조회
# GET /api/v1/users/me/login-history
# - 최근 10개 로그인 기록 표시
# - 날짜/시간, 기기 종류, 위치, IP 주소
# - "이 기기가 아닙니다" 신고 기능
# - login_history 테이블 필요

# TODO(v2): 특정 기기 로그아웃
# DELETE /api/v1/users/me/sessions/{session_id}
# - 다른 기기에서 강제 로그아웃
# - sessions 테이블 필요

# TODO(v2): 계정 탈퇴
# DELETE /api/v1/users/me
# - 미결제 수업료 확인
# - 활성 그룹 확인
# - 비밀번호 재확인
# - 데이터 삭제 (일부 법적 보관)
