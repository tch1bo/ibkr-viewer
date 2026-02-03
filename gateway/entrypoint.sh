#!/bin/bash
set -e

GATEWAY_DIR="/root/clientportal"

if [ ! -f "$GATEWAY_DIR/bin/run.sh" ]; then
    echo "ERROR: IBKR Client Portal Gateway not found at $GATEWAY_DIR/bin/run.sh"
    exit 1
fi

echo "Starting IBKR Client Portal Gateway..."
cd "$GATEWAY_DIR"

# Run the gateway
exec bin/run.sh root/conf.yaml
