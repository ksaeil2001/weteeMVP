"""
Rate Limiter Configuration
API_명세서.md 3.2: Rate Limiting 정책

slowapi를 사용한 Rate Limiting 설정
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate Limiter 인스턴스 생성
# key_func: 클라이언트를 구분하는 기준 (IP 주소 기반)
limiter = Limiter(key_func=get_remote_address)
