"""
WeTee - 과외 관리 통합 플랫폼
FastAPI Application Main Entry Point

Based on:
- 기술스택_설계서.md: 프로젝트 구조
- API_명세서.md: API 엔드포인트 구조
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from datetime import datetime
from uuid import uuid4
import traceback

from app.config import settings
from app.database import init_db
from app.routers import (
    auth_router,
    notifications_router,
    groups_router,
    schedules_router,
    attendances_router,
    lessons_router,
    textbooks_router,
    settlements_router,
    invoices_router,
    payments_router,
)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="과외 관리 통합 플랫폼 - MVP 1단계",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================
# 공통 응답 유틸리티
# API_명세서.md 4.1, 4.2 기반
# ==========================


def success_response(data, status_code: int = 200):
    """
    성공 응답 포맷

    Related: API_명세서.md 4.1
    """
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
    """
    에러 응답 포맷

    Related: API_명세서.md 4.2, 5.2
    """
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
# Health Check
# ==========================


@app.get("/api/v1/health")
def health_check():
    """
    Health check endpoint
    """
    return success_response({"status": "ok"})


# ==========================
# Router Registration
# API 엔드포인트 라우터 등록
# ==========================

# F-001: 회원가입 및 로그인
app.include_router(auth_router, prefix="/api/v1")

# F-002: 과외 그룹 생성 및 매칭
app.include_router(groups_router, prefix="/api/v1")

# F-003: 수업 일정 관리
app.include_router(schedules_router, prefix="/api/v1")

# F-004: 출결 관리
app.include_router(attendances_router, prefix="/api/v1")

# F-005: 수업 기록 및 진도 관리
app.include_router(lessons_router, prefix="/api/v1")
app.include_router(textbooks_router, prefix="/api/v1")

# F-008: 필수 알림 시스템
app.include_router(notifications_router, prefix="/api/v1")

# F-006: 수업료 정산
app.include_router(settlements_router, prefix="/api/v1")
app.include_router(invoices_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")

# TODO: 다른 기능 라우터 추가
# app.include_router(profiles_router, prefix="/api/v1")  # F-007


# ==========================
# Startup Event
# ==========================


@app.on_event("startup")
def on_startup():
    """
    Application startup event
    데이터베이스 테이블 생성 (개발 환경용)
    """
    print("🚀 Starting WeTee API Server...")
    print(f"📦 Database: {settings.DATABASE_URL}")

    # Initialize database tables
    # 운영 환경에서는 Alembic 마이그레이션 사용
    init_db()
    print("✅ Database tables created/verified")


@app.on_event("shutdown")
def on_shutdown():
    """
    Application shutdown event
    """
    print("👋 Shutting down WeTee API Server...")


# ==========================
# Global Exception Handler
# ==========================


@app.exception_handler(RequestValidationError)
def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Pydantic Validation 에러 처리

    400 Bad Request를 JSON 형식으로 반환
    """
    return error_response(
        status_code=400,
        code="VALIDATION_ERROR",
        message="입력값이 올바르지 않습니다.",
        details=exc.errors(),
    )


@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    """
    전역 예외 핸들러

    모든 예상하지 못한 에러를 500 JSON 응답으로 변환
    개발 환경에서는 traceback을 포함
    """
    # 로깅 (운영 환경에서는 Sentry 등으로 전송)
    print(f"🔥 Unhandled Exception: {exc}")
    if settings.DEBUG:
        traceback.print_exc()

    # 개발 환경에서는 상세 에러 메시지 포함
    details = None
    if settings.DEBUG:
        details = {
            "type": type(exc).__name__,
            "message": str(exc),
            "traceback": traceback.format_exc(),
        }

    return error_response(
        status_code=500,
        code="INTERNAL_ERROR",
        message="서버 내부 오류가 발생했습니다.",
        details=details,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 개발 환경에서만 사용
    )
