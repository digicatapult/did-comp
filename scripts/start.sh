#!/bin/bash

# Create the logs directory if it doesn't exist
mkdir -p logs
mkdir -p broker

# START SMCQL
cd smcql-experiment
./scripts/start.sh remote --wait
cd ../

# START VERITABLE CLOUD AGENT
# Specify only the services you need to start
docker compose -f ./veritable-cloudagent/docker-compose-testnet.yml up --build -d alice bob ipfs0 ipfs1 cluster0 cluster1 opa0 opa1

# Install dependencies
if [ ! -d "node_modules" ]; then
  npm install
fi

# Start your Node.js applications
echo "Starting Node.js applications..."
node api/api.js > logs/api.log 2>&1 &

# START broker.js
echo "Starting broker.js..."
node ./scripts/broker.js > logs/broker.log 2>&1 &
