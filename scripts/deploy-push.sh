#!/bin/sh
# Push to origin/main using the long-lived PAT stored at .deploy-token.
# Token has scopes repo + workflow, no expiration. To rotate: generate
# a new classic PAT, overwrite .deploy-token, delete the old token on
# github.com/settings/tokens.

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TOKEN_FILE="$REPO_DIR/.deploy-token"

if [ ! -f "$TOKEN_FILE" ]; then
  echo "Error: $TOKEN_FILE not found." >&2
  echo "Generate a classic PAT at github.com/settings/tokens (repo + workflow scopes," >&2
  echo "no expiration), save the value into $TOKEN_FILE, then retry." >&2
  exit 1
fi

TOKEN=$(tr -d '[:space:]' < "$TOKEN_FILE")

cd "$REPO_DIR"
git push "https://x-access-token:${TOKEN}@github.com/coownershipproperty/cop-next.git" "${1:-main}"
