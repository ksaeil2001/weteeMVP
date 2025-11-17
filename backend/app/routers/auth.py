"""
Auth Router - F-001 회원가입 및 로그인
API_명세서.md 6.1 기반 인증 엔드포인트 구현
"""

from datetime import datetime
import traceback
from fastapi import APIRouter, Depends, HTTPException, status
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

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    회원가입 (선생님 일반 가입)

    POST /api/v1/auth/register

    **기능**:
    - 선생님(TEACHER) 역할의 일반 회원가입
    - 이메일 중복 검사
    - 비밀번호 해싱 저장
    - 가입 완료 후 사용자 정보 반환

    **제한사항** (MVP 1차):
    - STUDENT/PARENT 초대 코드 가입은 추후 구현
    - 이메일 인증 코드 발송은 추후 구현 (현재는 is_email_verified=False)

    Related: F-001, API_명세서.md 6.1.1
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

        # 6. 응답 생성
        # TODO: 이메일 인증 코드 발송 (F-001 6.1.2)
        return UserResponse(
            user_id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            role=new_user.role.value,
            is_email_verified=new_user.is_email_verified,
            created_at=new_user.created_at,
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


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    로그인

    POST /api/v1/auth/login

    **기능**:
    - 이메일/비밀번호 검증
    - Access Token (15분) + Refresh Token (7일) 발급
    - 마지막 로그인 시각 업데이트

    **보안**:
    - 이메일/비밀번호 오류 시 동일한 에러 메시지 반환 (어느 쪽이 틀렸는지 노출 금지)
    - TODO: 5회 연속 실패 시 계정 잠금 (F-001)

    Related: F-001, API_명세서.md 6.1.3
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

    # 6. 응답 생성
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            user_id=user.id,
            email=user.email,
            name=user.name,
            role=user.role.value,
            is_email_verified=user.is_email_verified,
            created_at=user.created_at,
        ),
    )


@router.get("/account", response_model=UserResponse)
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

    return UserResponse(
        user_id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value,
        is_email_verified=current_user.is_email_verified,
        created_at=current_user.created_at,
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
    return {
        "message": "이메일 인증 기능은 추후 구현 예정입니다. (TODO: F-001 6.1.2)"
    }


@router.post("/refresh", response_model=RefreshResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
def refresh_tokens(payload: RefreshRequest):
    """
    토큰 갱신

    POST /api/v1/auth/refresh

    **TODO**: F-001 3.1에서 구현 예정
    - Refresh Token으로 새 Access Token + Refresh Token 발급
    """
    return {
        "message": "토큰 갱신 기능은 추후 구현 예정입니다. (TODO: F-001 3.1)"
    }


@router.post("/logout", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def logout():
    """
    로그아웃

    POST /api/v1/auth/logout

    **TODO**: F-001에서 구현 예정
    - Refresh Token 무효화 (Redis 블랙리스트 또는 DB 삭제)
    """
    return {
        "message": "로그아웃 기능은 추후 구현 예정입니다. (TODO: F-001)"
    }


@router.post("/password-reset/request", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def request_password_reset():
    """
    비밀번호 재설정 요청

    POST /api/v1/auth/password-reset/request

    **TODO**: F-001 시나리오 5에서 구현 예정
    - 이메일로 재설정 링크 발송
    """
    return {
        "message": "비밀번호 재설정 요청 기능은 추후 구현 예정입니다. (TODO: F-001 시나리오 5)"
    }


@router.post("/password-reset/confirm", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def confirm_password_reset():
    """
    비밀번호 재설정 확인

    POST /api/v1/auth/password-reset/confirm

    **TODO**: F-001 시나리오 5에서 구현 예정
    - 재설정 토큰 검증 및 새 비밀번호 저장
    """
    return {
        "message": "비밀번호 재설정 확인 기능은 추후 구현 예정입니다. (TODO: F-001 시나리오 5)"
    }
