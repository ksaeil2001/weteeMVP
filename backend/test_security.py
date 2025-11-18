#!/usr/bin/env python3
"""
보안 개선사항 검증 스크립트
"""

import re
import sys

# 비밀번호 검증 함수 (schemas/auth.py와 동일)
def validate_password(password: str) -> tuple[bool, str]:
    """
    비밀번호 강도 검증
    Returns: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "비밀번호는 최소 8자 이상이어야 합니다"

    if not re.search(r"[A-Z]", password):
        return False, "비밀번호는 대문자를 최소 1개 포함해야 합니다"

    if not re.search(r"[a-z]", password):
        return False, "비밀번호는 소문자를 최소 1개 포함해야 합니다"

    if not re.search(r"\d", password):
        return False, "비밀번호는 숫자를 최소 1개 포함해야 합니다"

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "비밀번호는 특수문자(!@#$%^&*(),.?\":{}|<> 등)를 최소 1개 포함해야 합니다"

    return True, "OK"


# 테스트 케이스
test_cases = [
    ("password", False, "약한 비밀번호 (소문자만)"),
    ("Password", False, "대소문자만"),
    ("Password123", False, "특수문자 없음"),
    ("Password123!", True, "올바른 비밀번호"),
    ("SecurePass123!", True, "올바른 비밀번호"),
    ("MyP@ssw0rd", True, "올바른 비밀번호"),
    ("Test1234!", True, "올바른 비밀번호"),
    ("short1!", False, "너무 짧음"),
    ("UPPERCASE123!", False, "소문자 없음"),
    ("lowercase123!", False, "대문자 없음"),
]

print("=" * 60)
print("비밀번호 강도 검증 테스트")
print("=" * 60)

passed = 0
failed = 0

for password, expected_valid, description in test_cases:
    is_valid, error_msg = validate_password(password)

    if is_valid == expected_valid:
        status = "✅ PASS"
        passed += 1
    else:
        status = "❌ FAIL"
        failed += 1

    print(f"\n{status} - {description}")
    print(f"  비밀번호: '{password}'")
    print(f"  예상: {'유효' if expected_valid else '무효'}, 실제: {'유효' if is_valid else '무효'}")
    if not is_valid:
        print(f"  에러: {error_msg}")

print("\n" + "=" * 60)
print(f"결과: {passed}/{len(test_cases)} 통과")
if failed == 0:
    print("✅ 모든 테스트 통과!")
    sys.exit(0)
else:
    print(f"❌ {failed}개 테스트 실패")
    sys.exit(1)
