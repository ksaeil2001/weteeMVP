#!/usr/bin/env python3
"""
F-007 Profile API Test Script
프로필 및 설정 API 엔드포인트 테스트
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def print_response(title, response):
    """응답 출력"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")


def test_profile_apis():
    """프로필 API 테스트"""

    # 1. 회원가입
    print("\n\n[TEST 1] 회원가입")
    register_data = {
        "email": "profile_test@example.com",
        "password": "Test1234!",
        "name": "김테스트",
        "phone": "010-1234-5678",
        "role": "TEACHER"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print_response("회원가입 응답", response)

    if response.status_code != 201:
        print("\n⚠️  회원가입 실패. 기존 계정으로 로그인 시도...")

    # 2. 로그인
    print("\n\n[TEST 2] 로그인")
    login_data = {
        "email": "profile_test@example.com",
        "password": "Test1234!"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print_response("로그인 응답", response)

    if response.status_code != 200:
        print("\n❌ 로그인 실패. 테스트 중단")
        return

    access_token = response.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 3. 프로필 조회
    print("\n\n[TEST 3] 프로필 조회 (GET /users/me)")
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    print_response("프로필 조회 응답", response)

    # 4. 프로필 수정
    print("\n\n[TEST 4] 프로필 수정 (PATCH /users/me)")
    update_data = {
        "name": "김업데이트",
        "phone": "010-9876-5432"
    }
    response = requests.patch(f"{BASE_URL}/users/me", json=update_data, headers=headers)
    print_response("프로필 수정 응답", response)

    # 5. 알림 설정 조회
    print("\n\n[TEST 5] 알림 설정 조회 (GET /users/me/settings)")
    response = requests.get(f"{BASE_URL}/users/me/settings", headers=headers)
    print_response("알림 설정 조회 응답", response)

    # 6. 알림 설정 변경
    print("\n\n[TEST 6] 알림 설정 변경 (PATCH /users/me/settings)")
    settings_update = {
        "push_enabled": False,
        "notification_categories": {
            "schedule": False,
            "attendance": True,
            "payment": True,
            "group": False
        },
        "night_mode_enabled": True,
        "night_mode_start": "22:00",
        "night_mode_end": "08:00",
        "theme": "dark"
    }
    response = requests.patch(f"{BASE_URL}/users/me/settings", json=settings_update, headers=headers)
    print_response("알림 설정 변경 응답", response)

    # 7. 비밀번호 변경
    print("\n\n[TEST 7] 비밀번호 변경 (POST /users/me/change-password)")
    password_change = {
        "current_password": "Test1234!",
        "new_password": "NewTest5678@"
    }
    response = requests.post(f"{BASE_URL}/users/me/change-password", json=password_change, headers=headers)
    print_response("비밀번호 변경 응답", response)

    print("\n\n" + "="*60)
    print("✅ 모든 테스트 완료")
    print("="*60)


if __name__ == "__main__":
    test_profile_apis()
