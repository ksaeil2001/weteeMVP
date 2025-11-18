#!/bin/bash

echo "========================================="
echo "Testing Rate Limiting on Auth Endpoints"
echo "========================================="
echo ""

echo "1. Testing /auth/login (limit: 5/minute)"
echo "-----------------------------------------"
for i in {1..7}; do
  echo -n "Request $i: "
  response=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}')

  if echo "$response" | grep -q "RATE_LIMIT_EXCEEDED"; then
    echo "✅ RATE LIMITED (as expected)"
  elif echo "$response" | grep -q "AUTH004"; then
    echo "✅ Normal auth error (within limit)"
  else
    echo "Response: $response"
  fi
  sleep 0.3
done

echo ""
echo "2. Testing /auth/register (limit: 10/minute)"
echo "---------------------------------------------"
for i in {1..12}; do
  echo -n "Request $i: "
  response=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test${i}@example.com\",\"password\":\"password123\",\"name\":\"Test${i}\",\"role\":\"TEACHER\"}")

  if echo "$response" | grep -q "RATE_LIMIT_EXCEEDED"; then
    echo "✅ RATE LIMITED (as expected)"
  elif echo "$response" | grep -q "user_id"; then
    echo "✅ Normal response (within limit)"
  elif echo "$response" | grep -q "AUTH001"; then
    echo "✅ Duplicate email error (within limit)"
  else
    echo "Response: $response"
  fi
  sleep 0.2
done

echo ""
echo "========================================="
echo "Rate Limiting Test Complete"
echo "========================================="
