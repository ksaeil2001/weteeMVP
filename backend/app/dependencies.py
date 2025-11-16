"""
FastAPI Dependencies
인증, 데이터베이스 세션 등 공통 의존성
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """
    현재 로그인한 사용자를 반환하는 의존성

    Authorization 헤더에서 Bearer 토큰을 추출하고,
    해당 토큰으로 사용자를 조회합니다.

    Args:
        authorization: Authorization 헤더 (Bearer <token>)
        db: 데이터베이스 세션

    Returns:
        User: 현재 로그인한 사용자

    Raises:
        HTTPException 401: 토큰이 없거나, 만료되었거나, 유효하지 않은 경우

    Related: F-001, API_명세서.md 3.1 JWT 인증

    Usage:
        @app.get("/api/v1/some-endpoint")
        def protected_route(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.id}
    """

    # 1. Authorization 헤더 검증
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH001",
                "message": "인증이 필요합니다.",
            },
        )

    # 2. Bearer 토큰 추출
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH001",
                "message": "잘못된 인증 헤더 형식입니다. (Bearer <token>)",
            },
        )

    token = parts[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH001",
                "message": "토큰이 비어 있습니다.",
            },
        )

    # 3. 토큰 디코딩 및 검증
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "AUTH003",
                    "message": "토큰이 유효하지 않습니다.",
                },
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH002",
                "message": "토큰이 만료되었거나 유효하지 않습니다.",
            },
        )

    # 4. 데이터베이스에서 사용자 조회
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH003",
                "message": "사용자를 찾을 수 없습니다.",
            },
        )

    # 5. 계정 상태 확인
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "AUTH005",
                "message": "비활성화된 계정입니다.",
            },
        )

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    활성 상태인 현재 사용자를 반환하는 의존성

    Args:
        current_user: get_current_user에서 반환된 사용자

    Returns:
        User: 활성 상태인 현재 사용자

    Raises:
        HTTPException 403: 비활성 계정

    Usage:
        @app.get("/api/v1/some-endpoint")
        def protected_route(user: User = Depends(get_current_active_user)):
            return {"user_id": user.id}
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "AUTH005",
                "message": "비활성화된 계정입니다.",
            },
        )
    return current_user


__all__ = ["get_db", "get_current_user", "get_current_active_user"]
