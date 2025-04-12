#!/bin/sh

# Check if MNEMONIC is set
if [ -z "$MNEMONIC" ]; then
  echo "MNEMONIC env var is not set. Cannot start Ganache."
  sleep 3
  exit 1
fi

# Ensure folders exist
mkdir -p /ganache
mkdir -p /ganache_db

MNEMONIC_FILE="/ganache/.mnemonic_used"

if [ -f "$MNEMONIC_FILE" ]; then
  PREV_MNEMONIC=$(cat "$MNEMONIC_FILE")
  if [ "$PREV_MNEMONIC" != "$MNEMONIC" ]; then
    echo "⚠️ MNEMONIC has changed. Resetting Ganache data..."
    rm -rf /ganache_db/*
    rm -f /ganache/*.json
  fi
fi

echo "$MNEMONIC" > "$MNEMONIC_FILE"

# Start Ganache
ganache --host 0.0.0.0 --port 7545 --mnemonic "$MNEMONIC" --db /ganache_db
