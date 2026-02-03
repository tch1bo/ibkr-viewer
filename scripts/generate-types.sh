#!/bin/bash
set -e

echo "Generating TypeScript types from IBKR OpenAPI spec..."

cd "$(dirname "$0")/../backend"

# Generate types from OpenAPI spec
npx openapi-typescript https://api.ibkr.com/gw/api/v3/api-docs -o src/types/ibkr-openapi.ts

echo "Types generated successfully!"
echo "Output: backend/src/types/ibkr-openapi.ts"
