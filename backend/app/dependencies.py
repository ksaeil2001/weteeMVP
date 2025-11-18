"""
FastAPI Dependencies
인증, 데이터베이스 세션 등 공통 의존성
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# Cookie key for access token (same as in auth.py)
COOKIE_ACCESS_TOKEN_KEY = "wetee_access_token"


def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """
    현재 로그인한 사용자를 반환하는 의존성

    토큰 읽기 우선순위 (보안 강화):
    1. httpOnly 쿠키에서 Access Token 읽기 (프론트엔드용, XSS 방지)
    2. Authorization 헤더에서 Bearer 토큰 읽기 (API 클라이언트용, 하위 호환성)

    Args:
        request: FastAPI Request 객체 (쿠키 읽기용)
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

    token = None

    # 1. 먼저 쿠키에서 토큰 읽기 (보안 강화)
    token = request.cookies.get(COOKIE_ACCESS_TOKEN_KEY)

    # 2. 쿠키에 없으면 Authorization 헤더에서 읽기 (하위 호환성)
    if not token and authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1].strip()

    # 3. 토큰이 없으면 인증 실패
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH001",
                "message": "인증이 필요합니다.",
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
