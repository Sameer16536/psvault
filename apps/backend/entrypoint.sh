#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Simple wait loop (or use wait-for-it)
sleep 5

echo "Running migrations..."
# Execute tern migrations
tern migrate -m ./internal/database/migrations --conn-string "$PSVAULT_DB_DSN"

echo "Starting server..."
exec ./server
