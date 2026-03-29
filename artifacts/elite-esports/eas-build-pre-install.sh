#!/usr/bin/env bash
set -euo pipefail

echo ">>> EAS pre-install: npm monorepo setup"
echo ">>> Node: $(node --version)"
echo ">>> npm:  $(npm --version)"
echo ">>> Working dir: $(pwd)"

# Resolve monorepo root — eas.json lives in artifacts/elite-esports,
# so the workspace root is two levels up.
MONO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo ">>> Monorepo root: $MONO_ROOT"

# Install ALL workspace dependencies from the root using npm
cd "$MONO_ROOT"
npm install --legacy-peer-deps

echo ">>> Dependencies installed successfully"
