#!/usr/bin/env bash
# Hourline — WSL dev setup (run inside Ubuntu: bash scripts/setup-wsl.sh)
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Hourline WSL setup ($PROJECT_ROOT)"

# Node via nvm
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "$HOME/.nvm/nvm.sh"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node not found. Install nvm: https://github.com/nvm-sh/nvm"
  exit 1
fi

echo "Node $(node --version) | npm $(npm --version)"

# Env file
if [[ ! -f .env ]]; then
  cp .env.example .env
  if command -v openssl >/dev/null 2>&1; then
  SECRET="$(openssl rand -base64 32)"
  sed -i "s/^AUTH_SECRET=.*/AUTH_SECRET=${SECRET}/" .env
  fi
  echo "Created .env from .env.example"
fi

# GitHub CLI (for push / private deps)
if ! gh auth status >/dev/null 2>&1; then
  echo ""
  echo "GitHub CLI is not logged in. Run:  gh auth login"
  echo "Then:  gh auth setup-git"
  echo ""
fi

# Docker check
if ! docker info >/dev/null 2>&1; then
  echo ""
  echo "Docker is not available inside WSL."
  echo "1. Start Docker Desktop on Windows"
  echo "2. Settings → Resources → WSL integration → enable Ubuntu"
  echo "3. Restart Ubuntu terminal and re-run this script"
  echo ""
else
  echo "Docker OK: $(docker --version)"
fi

echo "==> npm install"
npm install

echo ""
echo "Done. Next steps:"
echo "  docker compose up --build    # http://localhost:3001"
echo "  docker compose exec app npm run db:seed   # demo user"
echo ""
echo "Open in Cursor: Remote-WSL → ~/projects/hourline"
