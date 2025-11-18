"""
Rate Limiter Configuration
API_명세서.md 3.2: Rate Limiting 정책

slowapi를 사용한 Rate Limiting 설정
보안 강화: 인증된 사용자는 user_id 기반, 미인증 사용자는 IP 기반
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request
from typing import Optional


def get_identifier(request: Request) -> str:
    """
    Rate Limiting을 위한 클라이언트 식별자 반환

    - 인증된 사용자: user_id 기반 (더 정확한 제한)
    - 미인증 사용자: IP 주소 기반 (익명 사용자 제한)

    Args:
        request: FastAPI Request 객체

    Returns:
        str: 클라이언트 식별자 (user_id 또는 IP 주소)
    """
    # 1. 먼저 request.state에 user 정보가 있는지 확인 (인증 미들웨어에서 설정)
    user = getattr(request.state, "user", None)
    if user and hasattr(user, "user_id"):
        # 인증된 사용자: user_id 사용
        return f"user:{user.user_id}"

    # 2. Authorization 헤더에서 토큰 디코딩 시도 (선택적)
    # 현재는 단순하게 state.user만 확인하고, 없으면 IP 사용

    # 3. 미인증 사용자: IP 주소 사용
    return f"ip:{get_remote_address(request)}"


# Rate Limiter 인스턴스 생성
# key_func: 클라이언트를 구분하는 기준
#   - 인증된 사용자: user_id
#   - 미인증 사용자: IP 주소
limiter = Limiter(key_func=get_identifier)
