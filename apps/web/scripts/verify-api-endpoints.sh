#!/bin/bash
# Verify all mobile app API endpoints are working

set -e

BASE_URL="http://localhost:3000/api"
AUTH_HEADER="Authorization: Bearer mock-jwt-token-for-testing"

echo "🧪 Sumaiya Mobile API Verification"
echo "======================================"
echo "Testing all endpoints against: $BASE_URL"
echo ""

# Helper function to make requests
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  echo "Testing: $description"
  echo "  $method $BASE_URL$endpoint"

  if [ -z "$data" ]; then
    curl -s -X "$method" "$BASE_URL$endpoint" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -w "\n  Status: %{http_code}\n\n"
  else
    curl -s -X "$method" "$BASE_URL$endpoint" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -d "$data" \
      -w "\n  Status: %{http_code}\n\n"
  fi
}

echo "📚 LEARNING RESOURCES ENDPOINT"
echo "---"
test_endpoint "POST" "/learning/resources" \
  '{"skills":["Frontend"],"level":"Beginner"}' \
  "Get learning resources (POST /api/learning/resources)"

echo "💬 CHAT ENDPOINT"
echo "---"
test_endpoint "POST" "/chat/sumaiya" \
  '{"message":"What skills should I learn?","conversationId":"conv-123"}' \
  "Send chat message (POST /api/chat/sumaiya)"

echo "📱 DEVICE TOKEN ENDPOINT"
echo "---"
test_endpoint "PUT" "/auth/device-token" \
  '{"pushToken":"token-xyz","platform":"ios","deviceId":"device-123"}' \
  "Register device token (PUT /api/auth/device-token)"

echo "🧠 OCR ENDPOINT"
echo "---"
test_endpoint "POST" "/mobile/ocr" \
  '{"image":"data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}' \
  "Extract CV fields via OCR (POST /api/mobile/ocr)"

echo "📝 CV ENDPOINTS"
echo "---"
test_endpoint "POST" "/cv/create" \
  '{"title":"My CV","templateId":"template-1","data":{}}' \
  "Create CV (POST /api/cv/create)"

test_endpoint "GET" "/cv/list" "" \
  "List CVs (GET /api/cv/list)"

test_endpoint "GET" "/cv/mock-cv-id" "" \
  "Get CV details (GET /api/cv/[id])"

test_endpoint "PUT" "/cv/mock-cv-id" \
  '{"title":"Updated CV","data":{"fullName":"John Doe"}}' \
  "Update CV (PUT /api/cv/[id])"

test_endpoint "DELETE" "/cv/mock-cv-id" "" \
  "Delete CV (DELETE /api/cv/[id])"

echo "💼 JOBS ENDPOINTS"
echo "---"
test_endpoint "POST" "/jobs/feed" \
  '{"page":1,"limit":10}' \
  "Get jobs feed (POST /api/jobs/feed)"

test_endpoint "POST" "/jobs/job-1/apply" \
  '{"cvId":"cv-123"}' \
  "Apply to job (POST /api/jobs/[id]/apply)"

echo "📧 APPLICATIONS ENDPOINT"
echo "---"
test_endpoint "GET" "/applications/list" "" \
  "List applications (GET /api/applications/list)"

echo ""
echo "✅ API Verification Complete!"
echo ""
echo "Summary:"
echo "- All endpoints should return 200 or 201 for successful requests"
echo "- Unauthorized requests (without valid JWT) should return 401"
echo "- Invalid data should return 400"
echo ""
