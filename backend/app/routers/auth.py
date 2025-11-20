"""
Auth Router - F-001 회원가입 및 로그인
API_명세서.md 6.1 기반 인증 엔드포인트 구현
"""

from datetime import datetime
import traceback
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, IntegrityError

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    LoginResponse,
    UserResponse,
    RefreshRequest,
    RefreshResponse,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.core.limiter import limiter
from app.core.response import success_response
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


# Cookie configuration
COOKIE_ACCESS_TOKEN_KEY = "wetee_access_token"
COOKIE_REFRESH_TOKEN_KEY = "wetee_refresh_token"
COOKIE_MAX_AGE_ACCESS = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
COOKIE_MAX_AGE_REFRESH = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60  # Convert to seconds


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """
    Set authentication tokens as httpOnly cookies

    Security features:
    - HttpOnly: Prevents JavaScript access (XSS protection)
    - Secure: Only sent over HTTPS (disabled in development)
    - SameSite=Strict: CSRF protection
    - Path=/: Available for all routes

    Args:
        response: FastAPI Response object
        access_token: JWT access token
        refresh_token: JWT refresh token
    """
    # Access Token cookie
    response.set_cookie(
        key=COOKIE_ACCESS_TOKEN_KEY,
        value=access_token,
        max_age=COOKIE_MAX_AGE_ACCESS,
        httponly=True,
        secure=not settings.DEBUG,  # HTTPS only in production
        samesite="strict",
        path="/",
    )

    # Refresh Token cookie
    response.set_cookie(
        key=COOKIE_REFRESH_TOKEN_KEY,
        value=refresh_token,
        max_age=COOKIE_MAX_AGE_REFRESH,
        httponly=True,
        secure=not settings.DEBUG,  # HTTPS only in production
        samesite="strict",
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """
    Clear authentication cookies (for logout)

    Args:
        response: FastAPI Response object
    """
    response.delete_cookie(
        key=COOKIE_ACCESS_TOKEN_KEY,
        path="/",
        httponly=True,
        secure=not settings.DEBUG,
        samesite="strict",
    )

    response.delete_cookie(
        key=COOKIE_REFRESH_TOKEN_KEY,
        path="/",
        httponly=True,
        secure=not settings.DEBUG,
        samesite="strict",
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(
    request: Request,
    response: Response,
    payload: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    회원가입 (선생님 일반 가입)

    POST /api/v1/auth/register

    **기능**:
    - 선생님(TEACHER) 역할의 일반 회원가입
    - 이메일 중복 검사
    - 비밀번호 해싱 저장
    - 가입 완료 후 자동 로그인 (토큰 발급)
    - 가입 완료 후 사용자 정보 반환

    **보안**:
    - Rate Limiting: 10회/분 (자동 가입 방지)
    - HttpOnly Cookies: 토큰을 안전하게 쿠키로 저장 (XSS 방지)
    - 회원가입 후 자동 로그인 지원

    **제한사항** (MVP 1차):
    - STUDENT/PARENT 초대 코드 가입은 추후 구현
    - 이메일 인증 코드 발송은 추후 구현 (현재는 is_email_verified=False)

    Related: F-001, API_명세서.md 6.1.1, 3.2
    """

    try:
        # 1. 이메일 중복 확인
        existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "AUTH001",
                    "message": "이미 가입된 이메일입니다.",
                },
            )

        # 2. 역할 변환 (대문자 -> 소문자)
        role_map = {
            "TEACHER": UserRole.TEACHER,
            "STUDENT": UserRole.STUDENT,
            "PARENT": UserRole.PARENT,
        }
        role = role_map.get(payload.role)

        # 3. MVP 1차에서는 TEACHER만 가입 허용
        # TODO: F-002에서 초대 코드 시스템 구현 후 STUDENT/PARENT 가입 활성화
        if role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail={
                    "code": "COMMON001",
                    "message": "학생/학부모 초대 코드 가입은 아직 구현되지 않았습니다. (TODO: F-002)",
                },
            )

        # 4. 비밀번호 해싱
        password_hash = hash_password(payload.password)

        # 5. User 생성
        new_user = User(
            email=payload.email.lower(),
            password_hash=password_hash,
            name=payload.name,
            phone=payload.phone,
            role=role,
            is_active=True,
            is_email_verified=False,  # TODO: 이메일 인증 구현 후 활성화
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # 6. JWT 토큰 생성 (회원가입 후 자동 로그인)
        access_token = create_access_token(data={"sub": new_user.id})
        refresh_token = create_refresh_token(data={"sub": new_user.id})

        # 7. 토큰을 httpOnly 쿠키로 설정 (보안 강화)
        set_auth_cookies(response, access_token, refresh_token)

        # 8. 응답 생성 (토큰은 쿠키로만 전달, body에는 사용자 정보만 포함)
        # TODO: 이메일 인증 코드 발송 (F-001 6.1.2)
        user_data = UserResponse(
            user_id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            role=new_user.role.value,
            is_email_verified=new_user.is_email_verified,
            created_at=new_user.created_at,
        )

        return success_response(
            data={"user": user_data.model_dump(mode='json')},
            status_code=status.HTTP_201_CREATED
        )

    except HTTPException:
        # HTTPException은 그대로 재전송 (이미 올바른 에러 응답)
        raise

    except OperationalError as e:
        # DB 스키마 오류 (컬럼 불일치 등)
        db.rollback()
        print(f"❌ Database OperationalError: {e}")
        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "DB_SCHEMA_ERROR",
                "message": "데이터베이스 스키마 오류가 발생했습니다. 관리자에게 문의하세요.",
            },
        )

    except IntegrityError as e:
        # DB 무결성 제약 위반 (UNIQUE, NOT NULL 등)
        db.rollback()
        print(f"❌ Database IntegrityError: {e}")

        # UNIQUE 제약 위반 (이메일 중복)
        if "email" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "AUTH001",
                    "message": "이미 가입된 이메일입니다.",
                },
            )

        # 기타 무결성 오류
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "입력값이 올바르지 않습니다.",
            },
        )

    except Exception as e:
        # 예상하지 못한 에러
        db.rollback()
        print(f"❌ Unexpected error during registration: {e}")
        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "회원가입 처리 중 오류가 발생했습니다.",
            },
        )


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    로그인

    POST /api/v1/auth/login

    **기능**:
    - 이메일/비밀번호 검증
    - Access Token (15분) + Refresh Token (7일) 발급
    - 토큰은 httpOnly 쿠키로 설정 (XSS 방지)
    - 마지막 로그인 시각 업데이트

    **보안 강화**:
    - Rate Limiting: 5회/분 (brute-force 공격 방지)
    - HttpOnly Cookies: JavaScript에서 토큰 접근 불가 (XSS 방지)
    - Secure Flag: HTTPS에서만 전송 (운영 환경)
    - SameSite=Strict: CSRF 공격 방지
    - 이메일/비밀번호 오류 시 동일한 에러 메시지 반환 (어느 쪽이 틀렸는지 노출 금지)
    - TODO: 5회 연속 실패 시 계정 잠금 (F-001)

    Related: F-001, API_명세서.md 6.1.3, 3.2
    """

    # 1. 이메일로 사용자 조회
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    # 2. 사용자 없음 또는 비밀번호 불일치 → 동일한 에러 (보안)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH004",
                "message": "이메일 또는 비밀번호가 일치하지 않습니다.",
            },
        )

    # 3. 계정 상태 확인
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "AUTH005",
                "message": "비활성화된 계정입니다.",
            },
        )

    # TODO: F-001 이메일 인증 필수 정책 적용
    # if not user.is_email_verified:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail={
    #             "code": "AUTH005",
    #             "message": "이메일 인증이 필요합니다.",
    #         },
    #     )

    # 4. JWT 토큰 생성
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    # 5. 마지막 로그인 시각 업데이트
    user.last_login_at = datetime.utcnow()
    db.commit()

    # 6. 토큰을 httpOnly 쿠키로 설정 (보안 강화)
    set_auth_cookies(response, access_token, refresh_token)

    # 7. 응답 생성 (토큰은 쿠키로만 전달, body에는 사용자 정보만 포함)
    user_data = UserResponse(
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value,
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
    )

    return success_response(
        data={"user": user_data.model_dump(mode='json')}
    )


@router.get("/account")
def get_account(current_user: User = Depends(get_current_user)):
    """
    현재 로그인한 사용자 정보 조회

    GET /api/v1/auth/account

    **기능**:
    - Authorization 헤더의 Access Token으로 현재 사용자 정보 반환
    - 프론트엔드에서 사용자 정보 hydration용으로 사용

    **인증**:
    - Bearer Token 필수
    - 토큰 없음/만료/유효하지 않음 → 401 에러

    Related: F-001, API_명세서.md 6.1.x
    """

    user_data = UserResponse(
        user_id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value,
        is_email_verified=current_user.is_email_verified,
        created_at=current_user.created_at,
    )

    return success_response(
        data={"user": user_data.model_dump(mode='json')}
    )


# ============================================================================
# TODO: 다음 Step에서 구현할 엔드포인트들 (스켈레톤)
# ============================================================================


@router.post("/verify-email", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def verify_email():
    """
    이메일 인증

    POST /api/v1/auth/verify-email

    **TODO**: F-001 6.1.2에서 구현 예정
    - 이메일로 6자리 인증 코드 발송
    - 코드 검증 및 is_email_verified 업데이트
    """
    return success_response(
        data={"message": "이메일 인증 기능은 추후 구현 예정입니다. (TODO: F-001 6.1.2)"},
        status_code=status.HTTP_501_NOT_IMPLEMENTED
    )


@router.post("/refresh", status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")
def refresh_tokens(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    토큰 갱신

    POST /api/v1/auth/refresh

    **기능**:
    - httpOnly 쿠키에서 Refresh Token 읽기 (보안 강화)
    - Refresh Token 검증
    - 새로운 Access Token + Refresh Token 발급
    - 새 토큰을 httpOnly 쿠키로 설정
    - 사용자 활성 상태 확인

    **보안 강화**:
    - Rate Limiting: 20회/분
    - HttpOnly 쿠키: JavaScript에서 토큰 접근 불가
    - Refresh Token 타입 검증
    - 사용자 존재 및 활성 상태 확인

    Related: F-001 3.1, API_명세서.md 6.1.4, 3.2
    """
    try:
        # 1. 쿠키에서 Refresh Token 읽기
        refresh_token = request.cookies.get(COOKIE_REFRESH_TOKEN_KEY)

        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "AUTH005",
                    "message": "Refresh Token이 없습니다.",
                },
            )

        # 2. Refresh Token 검증
        from jose import JWTError

        try:
            decoded = decode_refresh_token(refresh_token)
        except JWTError as e:
            # 유효하지 않은 토큰인 경우 쿠키 삭제
            clear_auth_cookies(response)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "AUTH005",
                    "message": "유효하지 않거나 만료된 Refresh Token입니다.",
                },
            )

        # 3. 사용자 ID 추출
        user_id = decoded.get("sub")
        if not user_id:
            clear_auth_cookies(response)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "AUTH005",
                    "message": "토큰에서 사용자 정보를 찾을 수 없습니다.",
                },
            )

        # 4. 사용자 존재 및 활성 상태 확인
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            clear_auth_cookies(response)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "AUTH005",
                    "message": "사용자를 찾을 수 없습니다.",
                },
            )

        if not user.is_active:
            clear_auth_cookies(response)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "AUTH006",
                    "message": "비활성화된 계정입니다.",
                },
            )

        # 5. 새 토큰 발급
        new_access_token = create_access_token({"sub": user.id})
        new_refresh_token = create_refresh_token({"sub": user.id})

        # 6. 새 토큰을 httpOnly 쿠키로 설정
        set_auth_cookies(response, new_access_token, new_refresh_token)

        return success_response(
            data={"message": "토큰이 갱신되었습니다."}
        )

    except HTTPException:
        # HTTPException은 그대로 재전송
        raise

    except Exception as e:
        # 예상하지 못한 에러
        db.rollback()
        print(f"❌ Unexpected error during token refresh: {e}")
        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "토큰 갱신 중 오류가 발생했습니다.",
            },
        )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response, current_user: User = Depends(get_current_user)):
    """
    로그아웃

    POST /api/v1/auth/logout

    **기능**:
    - httpOnly 쿠키에서 토큰 삭제 (보안 강화)
    - MVP 단계에서는 stateless JWT 사용 (서버에서 별도 무효화 불필요)

    **보안 강화**:
    - 쿠키 삭제를 서버에서 처리 (Set-Cookie 헤더로 Max-Age=0 설정)
    - 클라이언트는 응답만 확인하면 됨

    **향후 개선** (TODO):
    - Refresh Token을 Redis 블랙리스트나 DB에 저장하여 서버 측 무효화
    - 토큰 만료 전까지의 보안 강화

    Related: F-001, API_명세서.md
    """
    # 쿠키에서 토큰 삭제
    clear_auth_cookies(response)

    return success_response(
        data={"message": "로그아웃되었습니다."}
    )


@router.post("/password-reset/request", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def request_password_reset():
    """
    비밀번호 재설정 요청

    POST /api/v1/auth/password-reset/request

    **TODO**: F-001 시나리오 5에서 구현 예정
    - 이메일로 재설정 링크 발송
    """
    return success_response(
        data={"message": "비밀번호 재설정 요청 기능은 추후 구현 예정입니다. (TODO: F-001 시나리오 5)"},
        status_code=status.HTTP_501_NOT_IMPLEMENTED
    )


@router.post("/password-reset/confirm", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def confirm_password_reset():
    """
    비밀번호 재설정 확인

    POST /api/v1/auth/password-reset/confirm

    **TODO**: F-001 시나리오 5에서 구현 예정
    - 재설정 토큰 검증 및 새 비밀번호 저장
    """
    return success_response(
        data={"message": "비밀번호 재설정 확인 기능은 추후 구현 예정입니다. (TODO: F-001 시나리오 5)"},
        status_code=status.HTTP_501_NOT_IMPLEMENTED
    )
