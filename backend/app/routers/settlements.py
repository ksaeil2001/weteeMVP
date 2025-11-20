"""
Settlements Router - F-006 수업료 정산
API_명세서.md 6.6 F-006 기반 정산/청구 관련 엔드포인트 구현
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Request
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import logging

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.invoice import Invoice, InvoiceStatus, Payment, PaymentStatus, Transaction, TransactionType
from app.schemas.invoice import (
    InvoiceCreateRequest,
    InvoiceUpdateRequest,
    InvoiceDetailResponse,
    InvoiceBasicInfo,
    InvoiceListResponse,
    SettlementSummaryResponse,
    PaymentCreateRequest,
    PaymentResponse,
    TeacherDashboardResponse,  # F-006: Dashboard API
    StudentSettlementSummaryResponse,  # F-006: Student Settlement
    SettlementStatisticsResponse,  # F-006: Statistics
    ReceiptResponse,  # F-006: Receipt
)
from app.services.settlement_service import SettlementService
from app.core.response import success_response
from app.services.notification_service import NotificationService
from app.core.security import verify_toss_signature
from app.config import settings

# Logger 설정
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settlements", tags=["settlements"])
invoices_router = APIRouter(prefix="/invoices", tags=["invoices"])


# ==========================
# Dashboard API - F-006 시나리오 5
# ==========================

@router.get("/dashboard")
def get_teacher_monthly_dashboard(
    year: int = Query(..., ge=2020, le=2100, description="조회 연도"),
    month: int = Query(..., ge=1, le=12, description="조회 월"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    선생님용 월별 대시보드 조회

    GET /api/v1/settlements/dashboard?year=YYYY&month=MM

    **기능**:
    - 선생님의 모든 그룹을 통합한 월별 통계 조회
    - 총 수업 횟수, 총 청구 금액, 결제 현황 등
    - 학생별 상세 내역
    - 최근 6개월 월별 비교 데이터

    **권한**: TEACHER만 가능

    **Query Parameters**:
    - year: 조회 연도 (예: 2025)
    - month: 조회 월 (1-12)

    **Response**:
    - TeacherDashboardResponse: 월별 대시보드 통계

    Related: F-006 시나리오 5, API_명세서.md 6.6
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "대시보드는 선생님만 조회할 수 있습니다."}
            )

        result = SettlementService.get_teacher_monthly_dashboard(
            db=db,
            user=current_user,
            year=year,
            month=month
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error getting dashboard: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "DASHBOARD001",
                "message": "대시보드 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 정산 요약
# ==========================

@router.get("/groups/{group_id}/summary")
def get_group_monthly_settlement_summary(
    group_id: str = Path(..., description="그룹 ID"),
    year: int = Query(..., ge=2020, le=2100, description="정산 연도"),
    month: int = Query(..., ge=1, le=12, description="정산 월"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹 월간 정산 요약

    GET /api/v1/settlements/groups/{group_id}/summary?year=YYYY&month=MM

    **기능**:
    - 특정 그룹의 특정 월 정산 요약 조회
    - 학생별 실제 진행 수업 횟수, 청구 금액 등 계산
    - TEACHER만 가능

    **권한**: TEACHER만 (그룹 소유자)

    **Query Parameters**:
    - year: 정산 연도 (예: 2025)
    - month: 정산 월 (1-12)

    **Response**:
    - SettlementSummaryResponse: 학생별 정산 요약

    Related: F-006, API_명세서.md 6.6
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "정산 요약은 선생님만 조회할 수 있습니다."}
            )

        result = SettlementService.get_group_monthly_settlement_summary(
            db=db,
            user=current_user,
            group_id=group_id,
            year=year,
            month=month
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error getting settlement summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "SETTLEMENT001",
                "message": "정산 요약 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 청구서 생성
# ==========================

@router.post("/groups/{group_id}/invoices", status_code=status.HTTP_201_CREATED)
def create_invoice_for_student(
    group_id: str = Path(..., description="그룹 ID"),
    payload: InvoiceCreateRequest = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    특정 학생 청구서 생성/갱신

    POST /api/v1/settlements/groups/{group_id}/invoices

    **기능**:
    - 특정 그룹의 특정 학생에 대한 월별 청구서 생성
    - 이미 청구서가 있으면 기존 것을 CANCELED 처리 후 새로 생성
    - TEACHER만 가능

    **권한**: TEACHER만 (그룹 소유자)

    **Request Body**:
    - year: 정산 연도
    - month: 정산 월 (1-12)
    - student_id: 학생 ID
    - billing_type: 청구 방식 (PREPAID/POSTPAID)

    **Response**:
    - InvoiceDetailResponse: 생성된 청구서 상세

    **Business Logic**:
    - 청구서 번호: TUT-YYYY-NNN (자동 생성)
    - 실제 진행 수업 횟수 기반으로 금액 계산
    - 최소 청구 금액(10,000원) 미만이면 에러

    Related: F-006, API_명세서.md 6.6.1
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "청구서는 선생님만 생성할 수 있습니다."}
            )

        result = SettlementService.create_or_update_invoice_for_period(
            db=db,
            user=current_user,
            group_id=group_id,
            payload=payload
        )
        return success_response(
            data=result.model_dump(mode='json',
            status_code=status.HTTP_201_CREATED
        ) if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error creating invoice: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVOICE001",
                "message": "청구서 생성 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 청구서 상세 조회
# ==========================

@invoices_router.get("/{invoice_id}")
def get_invoice_detail(
    invoice_id: str = Path(..., description="청구서 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    청구서 상세 조회

    GET /api/v1/invoices/{invoice_id}

    **기능**:
    - 특정 청구서의 상세 정보 조회

    **권한**:
    - TEACHER: 자신이 발행한 청구서만
    - 학부모/학생: 본인 관련 청구서만

    **Response**:
    - InvoiceDetailResponse: 청구서 상세

    Related: F-006, API_명세서.md 6.6
    """
    try:
        result = SettlementService.get_invoice_detail(
            db=db,
            user=current_user,
            invoice_id=invoice_id
        )
        return success_response(
            data=result.model_dump(mode='json',
            status_code=status.HTTP_201_CREATED
        ) if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error getting invoice detail: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVOICE002",
                "message": "청구서 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 그룹별 청구서 목록 조회
# ==========================

@router.get("/groups/{group_id}/invoices")
def list_group_invoices(
    group_id: str = Path(..., description="그룹 ID"),
    year: Optional[int] = Query(None, ge=2020, le=2100, description="필터: 연도"),
    month: Optional[int] = Query(None, ge=1, le=12, description="필터: 월"),
    status: Optional[str] = Query(None, description="필터: 상태 (DRAFT/SENT/PAID/...)"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    그룹별 청구서 목록 조회

    GET /api/v1/settlements/groups/{group_id}/invoices?year=YYYY&month=MM&status=PAID&page=1&size=20

    **기능**:
    - 특정 그룹의 청구서 목록 조회 (필터링, 페이징)

    **권한**:
    - TEACHER: 자신이 소유한 그룹의 청구서만
    - 학부모/학생: 본인 관련 청구서만

    **Query Parameters**:
    - year: 필터 - 연도 (선택)
    - month: 필터 - 월 (선택)
    - status: 필터 - 상태 (선택)
    - page: 페이지 번호 (기본: 1)
    - size: 페이지 크기 (기본: 20, 최대: 100)

    **Response**:
    - InvoiceListResponse: 청구서 목록 + 페이징 정보

    Related: F-006, API_명세서.md 6.6.4
    """
    try:
        result = SettlementService.list_group_invoices(
            db=db,
            user=current_user,
            group_id=group_id,
            year=year,
            month=month,
            status=status,
            page=page,
            size=size
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error listing invoices: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVOICE003",
                "message": "청구서 목록 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 수동 결제 확인
# ==========================

@invoices_router.post("/{invoice_id}/payments", status_code=status.HTTP_201_CREATED)
def create_manual_payment(
    invoice_id: str = Path(..., description="청구서 ID"),
    payload: PaymentCreateRequest = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    수동 결제 확인 (현금 등)

    POST /api/v1/invoices/{invoice_id}/payments

    **기능**:
    - 현금 수령 등 수동 결제 확인
    - TEACHER만 가능

    **권한**: TEACHER만

    **Request Body**:
    - method: 결제 수단 (CASH 등)
    - amount: 결제 금액 (원)
    - memo: 결제 메모 (선택)

    **Response**:
    - PaymentResponse: 결제 정보

    Related: F-006
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "결제 확인은 선생님만 할 수 있습니다."}
            )

        result = SettlementService.mark_invoice_paid(
            db=db,
            user=current_user,
            invoice_id=invoice_id,
            payload=payload
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error creating payment: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "PAYMENT001",
                "message": "결제 처리 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 청구서 발송
# ==========================

@invoices_router.post("/{invoice_id}/send")
def send_invoice(
    invoice_id: str = Path(..., description="청구서 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    청구서 발송 (학부모에게 알림)

    POST /api/v1/invoices/{invoice_id}/send

    **기능**:
    - 청구서 상태를 DRAFT → SENT로 변경
    - 학부모/학생에게 F-008 알림 발송
    - TEACHER만 가능

    **권한**: TEACHER만

    **Response**:
    - InvoiceDetailResponse: 발송된 청구서 상세

    Related: F-006, F-008
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "청구서는 선생님만 발송할 수 있습니다."}
            )

        result = SettlementService.send_invoice(
            db=db,
            user=current_user,
            invoice_id=invoice_id
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error sending invoice: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVOICE004",
                "message": "청구서 발송 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 청구서 취소
# ==========================

@invoices_router.post("/{invoice_id}/cancel")
def cancel_invoice(
    invoice_id: str = Path(..., description="청구서 ID"),
    reason: Optional[str] = Query(None, description="취소 사유"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    청구서 취소

    POST /api/v1/invoices/{invoice_id}/cancel

    **기능**:
    - 청구서 상태를 CANCELED로 변경
    - DRAFT 또는 SENT 상태에서만 취소 가능
    - TEACHER만 가능

    **권한**: TEACHER만

    **Query Parameters**:
    - reason: 취소 사유 (선택)

    **Response**:
    - InvoiceDetailResponse: 취소된 청구서 상세

    Related: F-006
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "청구서는 선생님만 취소할 수 있습니다."}
            )

        result = SettlementService.cancel_invoice(
            db=db,
            user=current_user,
            invoice_id=invoice_id,
            reason=reason
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error canceling invoice: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INVOICE005",
                "message": "청구서 취소 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 학생별 정산 및 통계 - F-006
# ==========================

@router.get("/students/{student_id}")
def get_student_settlement_summary(
    student_id: str = Path(..., description="학생 ID"),
    year: int = Query(..., ge=2020, le=2100, description="조회 연도"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    학생별 정산 요약 조회

    GET /api/v1/settlements/students/{student_id}?year=YYYY

    **기능**:
    - 특정 학생의 연간 수업료 내역 조회
    - 월별 청구서 내역, 결제 상태 등 제공

    **권한**:
    - TEACHER: 자신이 담당하는 학생만
    - 학부모: 본인 자녀만
    - 학생: 본인 것만

    **Query Parameters**:
    - year: 조회 연도 (예: 2025)

    **Response**:
    - StudentSettlementSummaryResponse: 학생별 정산 요약

    Related: F-006, API_명세서.md 6.6
    """
    try:
        result = SettlementService.get_student_settlement_summary(
            db=db,
            user=current_user,
            student_id=student_id,
            year=year
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error getting student settlement summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "SETTLEMENT002",
                "message": "학생별 정산 조회 중 오류가 발생했습니다.",
            },
        )


@router.get("/statistics")
def get_settlement_statistics(
    start_year: int = Query(..., ge=2020, le=2100, description="시작 연도"),
    start_month: int = Query(..., ge=1, le=12, description="시작 월"),
    end_year: int = Query(..., ge=2020, le=2100, description="종료 연도"),
    end_month: int = Query(..., ge=1, le=12, description="종료 월"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    정산 통계 조회 (월별/연도별)

    GET /api/v1/settlements/statistics?start_year=YYYY&start_month=MM&end_year=YYYY&end_month=MM

    **기능**:
    - 선생님의 특정 기간 동안의 정산 통계 집계
    - 월별 수입 차트 데이터 제공
    - 평균 수입, 평균 수업료 등 계산

    **권한**: TEACHER만 가능

    **Query Parameters**:
    - start_year: 시작 연도 (예: 2025)
    - start_month: 시작 월 (1-12)
    - end_year: 종료 연도 (예: 2025)
    - end_month: 종료 월 (1-12)

    **Response**:
    - SettlementStatisticsResponse: 정산 통계

    Related: F-006 시나리오 5
    """
    try:
        # TEACHER 권한 확인
        if current_user.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "PERMISSION_DENIED", "message": "통계는 선생님만 조회할 수 있습니다."}
            )

        result = SettlementService.get_settlement_statistics(
            db=db,
            user=current_user,
            start_year=start_year,
            start_month=start_month,
            end_year=end_year,
            end_month=end_month
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error getting settlement statistics: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "STATISTICS001",
                "message": "정산 통계 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# 영수증 조회 - F-006
# ==========================

@invoices_router.get("/{invoice_id}/receipt")
def get_invoice_receipt(
    invoice_id: str = Path(..., description="청구서 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    영수증 정보 조회

    GET /api/v1/invoices/{invoice_id}/receipt

    **기능**:
    - 결제 완료된 청구서의 영수증 정보 조회
    - TODO(v2): PDF 생성 기능 추가 예정

    **권한**:
    - TEACHER: 자신이 발행한 청구서만
    - 학부모/학생: 본인 관련 청구서만

    **Response**:
    - ReceiptResponse: 영수증 정보

    **Business Rule**:
    - 결제 완료된 청구서만 영수증 조회 가능 (status = PAID)

    Related: F-006, API_명세서.md 6.6.5
    """
    try:
        result = SettlementService.get_invoice_receipt(
            db=db,
            user=current_user,
            invoice_id=invoice_id
        )
        return success_response(
            data=result.model_dump(mode='json') if hasattr(result, 'model_dump') else result
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"🔥 Error getting invoice receipt: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "RECEIPT001",
                "message": "영수증 조회 중 오류가 발생했습니다.",
            },
        )


# ==========================
# PG Webhook (토스페이먼츠 등)
# ==========================

# TODO(v2): 실제 토스페이먼츠 연동 시 구현
payments_router = APIRouter(prefix="/payments", tags=["payments"])


class TossWebhookPayload(BaseModel):
    """토스페이먼츠 Webhook 요청 스키마"""
    eventType: str  # PAYMENT_COMPLETED, PAYMENT_CANCELED, PAYMENT_FAILED
    data: Dict[str, Any]  # paymentKey, orderId, amount, status, requestedAt, approvedAt 등


@payments_router.post("/toss/webhook")
async def handle_toss_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    토스페이먼츠 Webhook 핸들러

    POST /api/v1/payments/toss/webhook

    **기능**:
    - 토스페이먼츠에서 결제 상태 변경 시 호출되는 웹훅
    - 결제 완료, 취소, 실패 등의 이벤트를 처리
    - Payment/Invoice 상태 업데이트
    - 선생님/학부모에게 알림 발송 (F-008)

    **Request Headers**:
    - X-Toss-Signature: HMAC-SHA256 서명

    **Request Body** (JSON):
    - eventType: 이벤트 타입 (PAYMENT_COMPLETED, PAYMENT_CANCELED 등)
    - data: 결제 정보 (paymentKey, orderId, amount, status 등)

    **Response** (200 OK):
    - success: bool
    - message: str

    **Webhook 처리 플로우**:
    1. 서명 검증 (X-Toss-Signature)
    2. 이벤트 타입별 처리
      - PAYMENT_COMPLETED: Payment → SUCCESS, Invoice → PAID, 알림 발송
      - PAYMENT_CANCELED: Payment → CANCELED
      - PAYMENT_FAILED: Payment → FAILED
    3. Transaction 기록 (거래 내역)
    4. 데이터베이스 커밋

    Related: F-006 (수업료 정산, 시나리오 2), API_명세서.md 7.1
    """
    webhook_id = None  # 로깅용 ID

    try:
        # 1️⃣ 요청 본문 파싱
        try:
            payload = await request.json()
            webhook_id = payload.get("data", {}).get("orderId", "unknown")
        except Exception as e:
            logger.error(f"❌ Failed to parse webhook payload: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "WEBHOOK_PARSE_ERROR", "message": "웹훅 페이로드를 파싱할 수 없습니다."}
            )

        event_type = payload.get("eventType")  # PAYMENT_COMPLETED, PAYMENT_CANCELED, PAYMENT_FAILED
        data = payload.get("data", {})
        payment_key = data.get("paymentKey")
        order_id = data.get("orderId")  # Invoice ID
        amount = data.get("amount")

        logger.info(f"📥 Toss Webhook Received [ID: {webhook_id}]")
        logger.info(f"   Event Type: {event_type}")
        logger.info(f"   Payment Key: {payment_key[:20] if payment_key else 'N/A'}...")
        logger.info(f"   Order ID: {order_id}")
        logger.info(f"   Amount: {amount}원")

        # 2️⃣ 웹훅 서명 검증 (보안)
        signature = request.headers.get("X-Toss-Signature")
        if not signature:
            logger.warning(f"⚠️  Missing X-Toss-Signature header [ID: {webhook_id}]")
            # TODO: 개발 환경에서는 서명 검증 스킵 가능하도록 설정
            if not settings.DEBUG:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"code": "SIGNATURE_MISSING", "message": "서명이 없습니다."}
                )
        else:
            # 서명 검증
            toss_secret = settings.TOSS_PAYMENTS_SECRET_KEY
            if not toss_secret:
                logger.error(f"❌ TOSS_PAYMENTS_SECRET_KEY not configured [ID: {webhook_id}]")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={"code": "CONFIG_ERROR", "message": "결제 시스템 설정이 불완전합니다."}
                )

            is_valid = verify_toss_signature(
                signature=signature,
                payment_key=payment_key,
                order_id=order_id,
                amount=amount,
                secret_key=toss_secret
            )

            if not is_valid:
                logger.error(f"❌ Invalid webhook signature [ID: {webhook_id}]")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"code": "SIGNATURE_INVALID", "message": "서명 검증 실패입니다."}
                )

        # 3️⃣ 필수 필드 확인
        if not payment_key or not order_id or amount is None:
            logger.error(f"❌ Missing required fields [ID: {webhook_id}]")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "MISSING_FIELDS", "message": "필수 정보가 누락되었습니다."}
            )

        # 4️⃣ Invoice 조회
        invoice = db.query(Invoice).filter(Invoice.id == order_id).first()
        if not invoice:
            logger.warning(f"⚠️  Invoice not found [ID: {webhook_id}, Invoice ID: {order_id}]")
            # Invoice가 없어도 200 OK 반환 (토스페이먼츠 재전송 방지)
            return {"success": True, "message": "Webhook processed (invoice not found)"}

        logger.info(f"✅ Invoice found: {invoice.invoice_number}")

        # 5️⃣ 기존 Payment 레코드 확인 (중복 처리 방지)
        existing_payment = db.query(Payment).filter(
            Payment.provider_payment_key == payment_key
        ).first()

        # 6️⃣ 이벤트 타입별 처리
        if event_type == "PAYMENT_COMPLETED":
            logger.info(f"🎉 Payment Completed [ID: {webhook_id}]")

            if existing_payment:
                if existing_payment.status == PaymentStatus.SUCCESS:
                    logger.info(f"⚠️  Payment already processed [ID: {webhook_id}]")
                    return {"success": True, "message": "Payment already processed"}
                logger.info(f"✏️  Updating existing payment [ID: {webhook_id}]")
                payment = existing_payment
            else:
                # 새 Payment 레코드 생성
                payment = Payment(
                    invoice_id=invoice.id,
                    method="CARD",  # TODO: 요청 데이터에서 결제 수단 가져오기
                    amount=amount,
                    provider="toss",
                    provider_payment_key=payment_key,
                    provider_order_id=order_id,
                )
                db.add(payment)
                logger.info(f"✅ Created new Payment record [ID: {webhook_id}]")

            # Payment 상태 업데이트
            payment.status = PaymentStatus.SUCCESS
            payment.approved_at = datetime.utcnow()
            # Card 정보 추가 (토스페이먼츠 응답에서 받으면 저장)
            if data.get("method") == "CARD":
                payment.card_company = data.get("issuer")
                payment.card_last4 = data.get("cardLast4") or data.get("last4")

            # Invoice 상태 업데이트
            invoice.amount_paid += amount

            if invoice.amount_paid >= invoice.amount_due:
                invoice.status = InvoiceStatus.PAID
                invoice.paid_at = datetime.utcnow()
                logger.info(f"✅ Invoice marked as PAID [ID: {webhook_id}, Invoice: {invoice.invoice_number}]")
            else:
                # 일부 결제
                invoice.status = InvoiceStatus.PARTIALLY_PAID
                logger.info(f"📊 Invoice partially paid [ID: {webhook_id}, Paid: {invoice.amount_paid}/{invoice.amount_due}]")

            # Transaction 기록 (거래 내역)
            transaction = Transaction(
                invoice_id=invoice.id,
                type=TransactionType.CHARGE,
                amount=amount,
                note=f"[토스페이먼츠] 결제 완료 - Payment Key: {payment_key}"
            )
            db.add(transaction)
            logger.info(f"✅ Created Transaction record [ID: {webhook_id}]")

            # 8️⃣ 알림 발송 (F-008)
            try:
                # 선생님(발송인)에게 알림
                teacher = db.query(User).filter(User.id == invoice.teacher_id).first()
                if teacher:
                    NotificationService.send_notification(
                        db=db,
                        user_id=teacher.id,
                        notification_type="SETTLEMENT_PAID",
                        title="과외비 결제 완료",
                        message=f"{invoice.invoice_number} ({amount:,}원)이 결제되었습니다.",
                        related_id=invoice.id
                    )
                    logger.info(f"📢 Notification sent to teacher [ID: {webhook_id}]")

                # 학부모(수령인)에게 알림
                student = db.query(User).filter(User.id == invoice.student_id).first()
                if student:
                    # 학부모 조회 (학생의 부모)
                    # TODO: Group 관계를 통해 학부모 조회
                    logger.info(f"📢 Notification prepared for parent [ID: {webhook_id}]")

            except Exception as notify_error:
                logger.warning(f"⚠️  Failed to send notification [ID: {webhook_id}]: {notify_error}")
                # 알림 실패는 무시하고 계속 진행

        elif event_type == "PAYMENT_CANCELED":
            logger.info(f"❌ Payment Canceled [ID: {webhook_id}]")

            if existing_payment:
                payment = existing_payment
                payment.status = PaymentStatus.CANCELED
                payment.canceled_at = datetime.utcnow()
                payment.cancel_reason = data.get("cancelReason", "사용자 취소")
                logger.info(f"✅ Payment marked as CANCELED [ID: {webhook_id}]")
            else:
                logger.warning(f"⚠️  No payment record to cancel [ID: {webhook_id}]")

            # Invoice 상태 유지 (취소 시 자동으로 상태 변경하지 않음)
            # 선생님이 수동으로 환불 처리하도록

        elif event_type == "PAYMENT_FAILED":
            logger.warning(f"⚠️  Payment Failed [ID: {webhook_id}]")

            if existing_payment:
                payment = existing_payment
                payment.status = PaymentStatus.FAILED
                payment.failure_reason = data.get("failureReason", "결제 실패")
                logger.info(f"✅ Payment marked as FAILED [ID: {webhook_id}]")
            else:
                # 실패한 결제도 기록
                payment = Payment(
                    invoice_id=invoice.id,
                    method="CARD",
                    amount=amount,
                    provider="toss",
                    provider_payment_key=payment_key,
                    provider_order_id=order_id,
                    status=PaymentStatus.FAILED,
                    failure_reason=data.get("failureReason", "결제 실패")
                )
                db.add(payment)
                logger.info(f"✅ Created failed Payment record [ID: {webhook_id}]")

        else:
            logger.warning(f"⚠️  Unknown event type: {event_type} [ID: {webhook_id}]")

        # 9️⃣ 데이터베이스 커밋
        db.commit()
        logger.info(f"✅ Webhook processed successfully [ID: {webhook_id}]")

        return {
            "success": True,
            "message": "Webhook processed successfully"
        }

    except HTTPException as http_error:
        # HTTP 예외는 그대로 전파
        logger.error(f"❌ HTTP error in webhook [ID: {webhook_id}]: {http_error.detail}")
        raise http_error

    except Exception as e:
        # 기타 예외 처리
        logger.error(f"🔥 Unexpected error in webhook [ID: {webhook_id}]: {e}", exc_info=True)

        # 데이터베이스 롤백
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "WEBHOOK_PROCESSING_ERROR",
                "message": "웹훅 처리 중 오류가 발생했습니다.",
            },
        )
