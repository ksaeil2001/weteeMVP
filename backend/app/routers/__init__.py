"""
API Routers Package
각 기능별 API 라우터
"""

from app.routers.auth import router as auth_router
from app.routers.profiles import router as profiles_router
from app.routers.notifications import router as notifications_router
from app.routers.groups import router as groups_router
from app.routers.schedules import router as schedules_router
from app.routers.attendances import router as attendances_router
from app.routers.lessons import router as lessons_router
from app.routers.textbooks import router as textbooks_router
from app.routers.settlements import (
    router as settlements_router,
    invoices_router,
    payments_router,
)

__all__ = [
    "auth_router",
    "profiles_router",
    "notifications_router",
    "groups_router",
    "schedules_router",
    "attendances_router",
    "lessons_router",
    "textbooks_router",
    "settlements_router",
    "invoices_router",
    "payments_router",
]
