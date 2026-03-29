#!/usr/bin/env bash
set -euo pipefail

echo ">>> EAS pre-install: activating pnpm 9.15.4 via corepack"
corepack enable pnpm
corepack prepare pnpm@9.15.4 --activate

echo ">>> pnpm version: $(pnpm --version)"
echo ">>> Node version: $(node --version)"
