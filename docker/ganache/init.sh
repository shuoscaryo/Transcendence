#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Start Ganache with the fixed mnemonic in the background
ganache --host 0.0.0.0 --port 7545 --mnemonic "cube same payment father quiz ethics detect click fox final art thumb" --db /ganache_ref &

# Wait for Ganache to be ready
echo "⏳ Waiting for Ganache to start..."
until curl -s http://192.168.1.53:7545 > /dev/null; do
  sleep 1
done
echo "✅ Ganache is running with the predefined mnemonic!"

# Run the Python deployment script
python3 /app/scripts/deploy.py

# Copy the artifacts to blockchain_data
cp -r /app/artifacts/contracts/Tournaments.sol/Tournaments.json /app/blockchain_data/

# Keep the container running
tail -f /dev/null
