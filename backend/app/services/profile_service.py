"""
Profile Service - F-007 기본 프로필 및 설정 비즈니스 로직
사용자 프로필 및 설정 관리
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.user import User
from app.models.settings import Settings
from app.schemas.profile import (
    UserProfileOut,
    UserProfileUpdate,
    NotificationSettingsOut,
    NotificationSettingsUpdate,
)
from app.core.security import hash_password, verify_password


class ProfileService:
    """
    프로필 및 설정 서비스 레이어
    F-007: 기본 프로필 및 설정
    """

    @staticmethod
    def get_user_profile(db: Session, user: User) -> UserProfileOut:
        """
        사용자 프로필 조회
        GET /api/v1/users/me

        Args:
            db: 데이터베이스 세션
            user: 현재 로그인한 사용자

        Returns:
            UserProfileOut: 사용자 프로필 정보
        """
        return UserProfileOut(
            user_id=user.id,
            email=user.email,
            name=user.name,
            phone=user.phone,
            role=user.role.value,
            profile_image_url=user.profile_image_url,
            language=user.language,
            timezone=user.timezone,
            is_active=user.is_active,
            is_email_verified=user.is_email_verified,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    @staticmethod
    def update_user_profile(
        db: Session, user: User, update_data: UserProfileUpdate
    ) -> UserProfileOut:
        """
        사용자 프로필 수정
        PATCH /api/v1/users/me

        Args:
            db: 데이터베이스 세션
            user: 현재 로그인한 사용자
            update_data: 수정할 프로필 데이터

        Returns:
            UserProfileOut: 수정된 프로필 정보

        Raises:
            HTTPException: 수정 실패 시
        """
        try:
            # 수정할 필드만 업데이트
            if update_data.name is not None:
                user.name = update_data.name.strip()

            if update_data.phone is not None:
                # 전화번호 포맷 정규화 (하이픈 추가)
                phone = update_data.phone.replace("-", "").replace(" ", "")
                if len(phone) == 11:
                    user.phone = f"{phone[:3]}-{phone[3:7]}-{phone[7:]}"
                elif len(phone) == 10:
                    user.phone = f"{phone[:3]}-{phone[3:6]}-{phone[6:]}"
                else:
                    user.phone = update_data.phone

            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)

            return ProfileService.get_user_profile(db, user)

        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="프로필 수정에 실패했습니다",
            )

    @staticmethod
    def update_profile_image(
        db: Session, user: User, image_url: str
    ) -> str:
        """
        프로필 사진 URL 업데이트
        POST /api/v1/users/me/profile-image

        Args:
            db: 데이터베이스 세션
            user: 현재 로그인한 사용자
            image_url: 업로드된 이미지 URL

        Returns:
            str: 프로필 이미지 URL
        """
        user.profile_image_url = image_url
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)

        return user.profile_image_url

    @staticmethod
    def get_or_create_settings(db: Session, user: User) -> Settings:
        """
        사용자 설정 조회 또는 생성
        설정이 없으면 기본값으로 생성

        Args:
            db: 데이터베이스 세션
            user: 현재 로그인한 사용자

        Returns:
            Settings: 사용자 설정
        """
        settings = db.query(Settings).filter(Settings.user_id == user.id).first()

        if not settings:
            # 기본 설정 생성
            settings = Settings(
                user_id=user.id,
                push_enabled=True,
                email_enabled=True,
                notification_categories={
                    "schedule": True,
                    "attendance": True,
                    "payment": True,
                    "group": True,
                },
                night_mode_enabled=False,
                night_mode_start="22:00",
                night_mode_end="08:00",
                theme="auto",
                default_screen="home",
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)

        return settings

    @staticmethod
    def get_notification_settings(db: Session, user: User) -> NotificationSettingsOut:
        """
        알림 설정 조회
        GET /api/v1/users/me/settings

        Args:
            db: 데이터베이스 세션
            user: 현재 로그인한 사용자

        Returns:
            NotificationSettingsOut: 알림 설정 정보
        """
        settings = ProfileService.get_or_create_settings(db, user)

        return NotificationSettingsOut(
            push_enabled=settings.push_enabled,
            email_enabled=settings.email_enabled,
            notification_categories=settings.notification_categories,
            night_mode_enabled=settings.night_mode_enabled,
            night_mode_start=settings.night_mode_start,
            night_mode_end=settings.night_mode_end,
            theme=settings.theme,
            default_screen=settings.default_screen,
            updated_at=settings.updated_at,
        )

    @staticmethod
    def update_notification_settings(
        db: Session, user: User, update_data: NotificationSettingsUpdate
    ) -> NotificationSettingsOut:
        """
        알림 설정 변경
        PATCH /api/v1/users/me/settings

        Args:
            db: 데이터베이스 세션
            user: 현재 로그인한 사용자
            update_data: 변경할 설정 데이터

        Returns:
            NotificationSettingsOut: 변경된 설정 정보

        Raises:
            HTTPException: 설정 변경 실패 시
        """
        settings = ProfileService.get_or_create_settings(db, user)

        try:
            # 수정할 필드만 업데이트
            if update_data.push_enabled is not None:
                settings.push_enabled = update_data.push_enabled

            if update_data.email_enabled is not None:
                settings.email_enabled = update_data.email_enabled

            if update_data.notification_categories is not None:
                # 기존 카테고리와 병합 (부분 업데이트 지원)
                current_categories = settings.notification_categories or {}
                current_categories.update(update_data.notification_categories)
                settings.notification_categories = current_categories

            if update_data.night_mode_enabled is not None:
                settings.night_mode_enabled = update_data.night_mode_enabled

            if update_data.night_mode_start is not None:
                settings.night_mode_start = update_data.night_mode_start

            if update_data.night_mode_end is not None:
                settings.night_mode_end = update_data.night_mode_end

            if update_data.theme is not None:
                settings.theme = update_data.theme

            if update_data.default_screen is not None:
                settings.default_screen = update_data.default_screen

            settings.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(settings)

            return ProfileService.get_notification_settings(db, user)

        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="설정 변경에 실패했습니다",
            )

    @staticmethod
    def change_password(
        db: Session, user: User, current_password: str, new_password: str
    ) -> bool:
        """
        비밀번호 변경
        POST /api/v1/users/me/change-password

        Args:
            db: 데이터베이스 세션
            user: 현재 로그인한 사용자
            current_password: 현재 비밀번호
            new_password: 새 비밀번호

        Returns:
            bool: 변경 성공 여부

        Raises:
            HTTPException: 현재 비밀번호 불일치 또는 동일한 비밀번호 사용 시
        """
        # 현재 비밀번호 확인
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="현재 비밀번호가 일치하지 않습니다",
            )

        # 새 비밀번호가 현재 비밀번호와 동일한지 확인
        if verify_password(new_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="현재 비밀번호와 다른 비밀번호를 입력해주세요",
            )

        # 비밀번호 업데이트
        user.password_hash = hash_password(new_password)
        user.updated_at = datetime.utcnow()
        db.commit()

        return True
