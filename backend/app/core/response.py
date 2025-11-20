"""
Response utilities for standardized API responses
Related: API_명세서.md 4.1, 4.2
"""

from datetime import datetime
from uuid import uuid4
from fastapi.responses import JSONResponse


def success_response(data, status_code: int = 200, response=None):
    """
    성공 응답 포맷

    Related: API_명세서.md 4.1

    Args:
        data: Response data (dict or any JSON-serializable object)
        status_code: HTTP status code (default: 200)
        response: Optional existing Response object to copy cookies from

    Returns:
        JSONResponse with standardized format:
        {
            "success": true,
            "data": {...},
            "meta": {
                "timestamp": "2025-11-19T...",
                "request_id": "uuid"
            }
        }
    """
    json_response = JSONResponse(
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

    # Copy cookies from the original response if provided
    # Use raw_headers to properly handle multiple Set-Cookie headers
    if response is not None:
        for header_name, header_value in response.raw_headers:
            if header_name.lower() == b"set-cookie":
                json_response.raw_headers.append((header_name, header_value))

    return json_response


def error_response(status_code: int, code: str, message: str, details=None):
    """
    에러 응답 포맷

    Related: API_명세서.md 4.2

    Args:
        status_code: HTTP status code
        code: Error code (e.g., "AUTH001")
        message: Error message
        details: Optional additional details

    Returns:
        JSONResponse with standardized error format:
        {
            "success": false,
            "error": {
                "code": "...",
                "message": "...",
                "details": {...}  # optional
            },
            "meta": {
                "timestamp": "2025-11-19T...",
                "request_id": "uuid"
            }
        }
    """
    error_data = {
        "code": code,
        "message": message,
    }

    if details is not None:
        # Convert details to JSON-serializable format
        # Handle Pydantic validation errors which may contain non-serializable objects
        error_data["details"] = _make_json_serializable(details)

    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": error_data,
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "request_id": str(uuid4()),
            },
        },
    )


def _make_json_serializable(obj):
    """
    Convert any object to JSON-serializable format

    Handles:
    - Pydantic validation errors with ValueError in context
    - Lists and dicts recursively
    - Non-serializable objects by converting to string
    """
    if isinstance(obj, dict):
        return {k: _make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_make_json_serializable(item) for item in obj]
    elif isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    else:
        # Convert non-serializable objects (like ValueError) to string
        return str(obj)
