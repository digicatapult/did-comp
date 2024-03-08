#!/bin/bash

# Take down the Docker Compose services, remove volumes with -v
docker compose -f ./veritable-cloudagent/docker-compose-testnet.yml down -v

# Ensure all resources are properly released
sleep 1

# STOP SMCQL
cd smcql-experiment
./scripts/stop.sh remote
cd ..

# Additional small wait time to ensure the stop commands have fully executed
sleep 0.1

# Cleanup logs and broker directories
rm -rf logs
rm -rf broker

# Kill all node and react related processes that might have been left running
ps aux | grep -E "node|react" | awk '{print ($1 ~ /^[0-9]+$/ ? $1 : $2)}' | xargs kill -9

echo "DONE"
