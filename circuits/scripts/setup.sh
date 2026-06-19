#!/usr/bin/env bash
# Task 5: compile + groth16 trusted setup (Hermez ptau) + prove + off-chain verify.
set -e
export PATH="$HOME/.local/bin:$PATH"
export NODE_OPTIONS=--max-old-space-size=8192
cd "$(dirname "$0")/.."

echo "=== generate sample input ==="
npx tsx scripts/gen-sample.ts

echo "=== compile ==="
npx circomkit compile compliance

echo "=== setup (downloads Hermez ptau if needed) ==="
npx circomkit setup compliance

echo "=== prove ==="
npx circomkit prove compliance default

echo "=== off-chain verify ==="
npx circomkit verify compliance default

echo "=== SETUP_DONE ==="
