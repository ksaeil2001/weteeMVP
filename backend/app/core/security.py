"""
Security utilities - JWT, Password Hashing
F-001 인증 및 보안 관련 유틸리티

Based on:
- 기술스택_설계서.md: Access Token 15분, Refresh Token 7일
- F-001: bcrypt 비밀번호 해싱
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
import hmac
import hashlib
import base64

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt

    bcrypt는 최대 72바이트까지만 처리 가능하므로,
    UTF-8 인코딩 기준 72바이트를 초과하면 자동으로 잘라냅니다.

    Args:
        password: Plain text password

    Returns:
        Hashed password string
    """
    # bcrypt는 72바이트 제한이 있으므로 항상 잘라내기
    password_bytes = password.encode('utf-8')
    # 최대 72바이트로 제한하되, UTF-8 문자가 깨지지 않도록 처리
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    # bytes로 전달하여 bcrypt의 자동 인코딩 문제 방지
    return pwd_context.hash(password_bytes)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash

    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored hashed password

    Returns:
        True if password matches, False otherwise
    """
    # 비밀번호를 동일한 방식으로 처리 (bytes로 변환, 72바이트 제한)
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    return pwd_context.verify(password_bytes, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token

    Args:
        data: Payload data (e.g., {"sub": user_id})
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string

    Related: F-001, API_명세서.md 3.1 JWT 인증
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "type": "access"})

    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token

    Args:
        data: Payload data (e.g., {"sub": user_id})
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT refresh token string

    Related: F-001, API_명세서.md 3.1 JWT 인증
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode.update({"exp": expire, "type": "refresh"})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_REFRESH_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify an access token

    Args:
        token: JWT access token string

    Returns:
        Decoded payload dict, or None if invalid

    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )

        # Verify token type
        if payload.get("type") != "access":
            raise JWTError("Invalid token type")

        return payload
    except JWTError:
        raise


def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a refresh token

    Args:
        token: JWT refresh token string

    Returns:
        Decoded payload dict, or None if invalid

    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_REFRESH_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        # Verify token type
        if payload.get("type") != "refresh":
            raise JWTError("Invalid token type")

        return payload
    except JWTError:
        raise


def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user_id from an access token

    Args:
        token: JWT access token string

    Returns:
        user_id (subject) from token, or None if invalid
    """
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None


# ==============================================================================
# Password Reset Token (F-001)
# ==============================================================================


def create_password_reset_token(user_id: str, email: str) -> str:
    """
    Create a JWT token for password reset

    Args:
        user_id: User's ID
        email: User's email address

    Returns:
        Encoded JWT token string (valid for 1 hour)

    Related: F-001 비밀번호 재설정
    """
    expire = datetime.utcnow() + timedelta(hours=1)

    to_encode = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "type": "password_reset"
    }

    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_password_reset_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a password reset token

    Args:
        token: JWT password reset token string

    Returns:
        Decoded payload dict with user_id and email

    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )

        # Verify token type
        if payload.get("type") != "password_reset":
            raise JWTError("Invalid token type")

        return payload
    except JWTError:
        raise


# ==============================================================================
# Toss Payments Webhook Signature Verification (F-006)
# ==============================================================================

def verify_toss_signature(
    signature: str,
    payment_key: str,
    order_id: str,
    amount: int,
    secret_key: str
) -> bool:
    """
    토스페이먼츠 Webhook 서명 검증 (HMAC-SHA256)

    토스페이먼츠는 요청 헤더에 X-Toss-Signature를 포함하여 전송합니다.
    서명은 다음과 같이 생성됩니다:

    HMAC-SHA256("{paymentKey},{orderId},{amount}", secret)를 Base64 인코딩

    Args:
        signature: 요청 헤더의 X-Toss-Signature 값
        payment_key: 결제 키
        order_id: 주문 ID
        amount: 결제 금액 (정수, 원 단위)
        secret_key: 토스페이먼츠 시크릿 키 (환경변수에서 가져옴)

    Returns:
        bool: 서명이 유효하면 True, 아니면 False

    Related: F-006 (수업료 정산), API_명세서.md 7.1
    """
    try:
        # 서명을 생성할 메시지 구성
        message = f"{payment_key},{order_id},{amount}"

        # HMAC-SHA256 생성 (secret_key는 bytes로 인코딩)
        generated_signature = hmac.new(
            secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()

        # Base64 인코딩
        generated_signature_b64 = base64.b64encode(generated_signature).decode('utf-8')

        # 서명 비교 (timing attack 방지를 위해 hmac.compare_digest 사용)
        return hmac.compare_digest(signature, generated_signature_b64)

    except Exception as e:
        # 서명 검증 중 오류 발생 시 False 반환
        print(f"❌ Error verifying Toss signature: {e}")
        return False
