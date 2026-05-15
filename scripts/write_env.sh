#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

critical_vars=(
  BACKEND
  BACKEND_IDENTITY
  BACKEND_BLOCKCHAIN
  BACKEND_RESULT
  CHAIN
)

env_vars=(
  ENVIRONMENT
  APP_FLOW
  PRIVACY_URL
  TERMS_URL
  CHAIN
  BACKEND
  BACKEND_IDENTITY
  BACKEND_RESULT
  FRONTEND_RESULTS
  BACKEND_BLOCKCHAIN
  FIREBASE_API_KEY
  FIREBASE_AUTH_DOMAIN
  FIREBASE_PROJECT_ID
  FIREBASE_STORAGE_BUCKET
  FIREBASE_MESSAGING_SENDER_ID
  FIREBASE_VAPID_KEY
  FIREBASE_APP_ID
  API_GEMINI
  BUNDLER
  BUNDLER_MAIN
  BUNDLER_ARBITRUM
  BUNDLER_MAIN_ARBITRUM
  SPONSORSHIP_POLICY
  API_GEMINI
  GATEWAY_BASE
  CIRCUITS_URL
  CRED_SCHEMA_URL
  CRED_TYPE
  CRED_EXP_DAYS
  PROVIDER_NAME
  FACTORY
  BACKEND_SECRET
  PINATA_API
  PINATA_API_KEY
  PINATA_API_SECRET
  PINATA_JWT
  VERIFIER_REQUEST_ENDPOINT
  KEYSTORE_PASSWORD
  KEY_ALIAS
  KEY_PASSWORD
  SENTRY_DSN_KEY
  SENTRY_TESTFLIGHT_SMOKE_TEST
)

missing=()
for key in "${critical_vars[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "Missing critical EAS secret(s): ${missing[*]}" >&2
  echo "Create them with eas secret:create before running EAS Build." >&2
  exit 1
fi

{
  for key in "${env_vars[@]}"; do
    printf '%s=%s\n' "$key" "${!key:-}"
  done
} > "$ENV_FILE"

echo ".env generated from EAS secrets"
