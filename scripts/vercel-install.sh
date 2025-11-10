#!/usr/bin/env bash
set -e

# 1) Install Stellar CLI
curl -L https://github.com/stellar/stellar-cli/releases/latest/download/stellar-x86_64-unknown-linux-gnu.tar.gz | tar xz
export PATH="$PWD/stellar-x86_64-unknown-linux-gnu:$PATH"

# 2) Generate Soroban bindings
stellar contract bindings typescript \
  --network testnet \
  --id CBHDPEFXULHHF3NO5EYALTUEZOFLKQ6GTCDG6MAFRWWKRVOHQHRVTLYZ \
  --output-dir ./packages/geko_envelopes \
  --overwrite

# 3) Build the generated package
cd packages/geko_envelopes
npm ci
npm run build
cd ../..

# 4) Install main dependencies
npm ci
