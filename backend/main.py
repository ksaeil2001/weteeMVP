from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal, Dict
from datetime import datetime
from uuid import uuid4

app = FastAPI()

# CORS 설정: 프론트(Next.js) 도메인 허용
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# 공통 응답 유틸
# ==========================

def success_response(data, status_code: int = 200):
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "data": data,
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "request_id": str(uuid4()),
            },
        },
    )

def error_response(status_code: int, code: str, message: str, details=None):
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            },
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "request_id": str(uuid4()),
            },
        },
    )

# ==========================
# Pydantic 모델 정의 (프론트 타입과 맞춤)
# ==========================

UserRoleCode = Literal["TEACHER", "STUDENT", "PARENT"]

class Profile(BaseModel):
    subjects: Optional[list[str]] = None
    school: Optional[str] = None

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: UserRoleCode
    profile: Optional[Profile] = None

class LoginDeviceInfo(BaseModel):
    device_type: str
    os: str
    app_version: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_info: Optional[LoginDeviceInfo] = None

class LoginResponseData(BaseModel):
    access_token: str
    refresh_token: str
    user: dict  # { user_id, email, name, role }

class RefreshRequest(BaseModel):
    refresh_token: str

class RefreshResponseData(BaseModel):
    access_token: str
    refresh_token: str

# ==========================
# 인메모리 유저/토큰 저장소 (MVP용, 서버 재시작하면 초기화)
# ==========================

# 이메일 기준 유저 저장
fake_users_by_email: Dict[str, dict] = {}

# 리프레시 토큰 기준 유저 이메일 저장
fake_refresh_tokens: Dict[str, str] = {}

# 🔹 새로 추가: 액세스 토큰 기준 유저 이메일 저장
fake_access_tokens: Dict[str, str] = {}


def generate_tokens(email: str):
    """
    access_token / refresh_token 발급 + 인메모리 매핑 등록
    """
    access_token = f"access-{uuid4()}"
    refresh_token = f"refresh-{uuid4()}"

    # 토큰 → 이메일 매핑 저장
    fake_access_tokens[access_token] = email
    fake_refresh_tokens[refresh_token] = email

    return access_token, refresh_token

# ==========================
# 헬스 체크
# ==========================

@app.get("/api/v1/health")
def health_check():
    return success_response({"status": "ok"})

# ==========================
# 6.1.1 회원가입: POST /api/v1/auth/register
# ==========================

@app.post("/api/v1/auth/register")
def register(payload: RegisterRequest):
    email = payload.email.lower()

    # 이미 존재하는 이메일이면 409
    if email in fake_users_by_email:
        return error_response(
            status_code=409,
            code="AUTH001",
            message="이미 가입된 이메일입니다.",
        )

    user_id = f"user-{uuid4()}"
    user = {
        "user_id": user_id,
        "email": email,
        "name": payload.name,
        "phone": payload.phone,
        "role": payload.role,  # 'TEACHER' | 'STUDENT' | 'PARENT'
        "profile": payload.profile.dict() if payload.profile else None,
        "email_verified": False,
    }
    # 비밀번호는 여기서는 평문으로 저장하지만,
    # 실제 서비스에서는 반드시 해시 저장 필요 (bcrypt 등)
    fake_users_by_email[email] = {
        "user": user,
        "password": payload.password,
    }

    data = {
        "user_id": user_id,
        "email": email,
        "name": payload.name,
        "role": payload.role,
        "email_verified": False,
    }

    return success_response(data, status_code=201)

# ==========================
# 6.1.3 로그인: POST /api/v1/auth/login
# ==========================

@app.post("/api/v1/auth/login")
def login(payload: LoginRequest):
    email = payload.email.lower()
    record = fake_users_by_email.get(email)

    # 유저가 없거나 비밀번호 불일치 → AUTH004
    if not record or record["password"] != payload.password:
        return error_response(
            status_code=401,
            code="AUTH004",
            message="이메일 또는 비밀번호가 올바르지 않습니다.",
        )

    user = record["user"]
    access_token, refresh_token = generate_tokens(email)

    data = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],  # 이미 대문자 코드
        },
    }

    return success_response(data)

# ==========================
# 6.1.x 토큰 갱신: POST /api/v1/auth/refresh
# ==========================

@app.post("/api/v1/auth/refresh")
def refresh_tokens(payload: RefreshRequest):
    email = fake_refresh_tokens.get(payload.refresh_token)

    if not email:
        # 리프레시 토큰이 유효하지 않은 경우 → 세션 만료
        return error_response(
            status_code=401,
            code="AUTH006",
            message="세션이 만료되었습니다. 다시 로그인해 주세요.",
        )

    # 새 토큰 발급
    access_token, refresh_token = generate_tokens(email)

    data = {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }

    return success_response(data)

# ==========================
# 공통 인증 의존성: get_current_user
# ==========================

def _extract_bearer_token(authorization: Optional[str]) -> str:
    """
    'Bearer xxx' 형태의 Authorization 헤더에서 실제 토큰만 추출.
    형식이 잘못되었으면 401 에러를 발생시킨다.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="인증 정보가 없습니다. (Authorization 헤더 없음)")

    # 예: "Bearer access-xxxxx"
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="잘못된 인증 헤더 형식입니다. (예: 'Bearer <token>')")

    token = parts[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="토큰이 비어 있습니다.")

    return token


def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer 액세스 토큰"),
):
    """
    공통 인증 의존성.

    1) Authorization 헤더에서 Bearer 토큰 추출
    2) access_token → email 매핑 조회
    3) email → user 조회
    4) user dict 반환

    실패 시 HTTP 401 발생.
    """
    token = _extract_bearer_token(authorization)

    # access_token → email 매핑 조회
    email = fake_access_tokens.get(token)
    if not email:
        raise HTTPException(status_code=401, detail="유효하지 않거나 만료된 토큰입니다.")

    record = fake_users_by_email.get(email)
    if not record:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")

    return record["user"]  # 이후 엔드포인트에서 current_user로 받게 됨

# ==========================
# 6.1.x 현재 로그인한 사용자: GET /api/v1/auth/me
# ==========================

@app.get("/api/v1/auth/me")
def read_current_user(current_user: dict = Depends(get_current_user)):
    """
    현재 Authorization 헤더에 담긴 access_token 기준으로
    로그인한 사용자 정보를 반환한다.
    """
    data = {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "email_verified": current_user.get("email_verified", False),
    }
    return success_response(data)
