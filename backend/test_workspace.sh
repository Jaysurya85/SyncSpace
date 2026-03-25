#!/bin/bash

# Generate token
TOKEN=$(go test ./internal/auth -v -run TestGenerateAndValidateToken 2>&1 | grep "Generated token:" | awk '{print $NF}')

echo "Using token: $TOKEN"

# Create workspace
curl -X POST "http://localhost:8080/api/workspaces" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My First Workspace"}'