#!/bin/bash
set -e

# Check if required environment variables are set
if [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || \
   [ -z "$MNEMONIC" ] || [ -z "$FORTY_TWO_CLIENT_ID" ] || [ -z "$FORTY_TWO_CLIENT_SECRET" ]; then
    echo "❌ Missing one or more required environment variables:"
    echo "  - POSTGRES_DB"
    echo "  - POSTGRES_USER"
    echo "  - POSTGRES_PASSWORD"
    echo "  - MNEMONIC"
    echo "  - FORTY_TWO_CLIENT_ID"
    echo "  - FORTY_TWO_CLIENT_SECRET"
    sleep 5
    exit 1
fi

# Check if Django project is already created
if [ ! -f "/app/manage.py" ]; then
    echo "Django project not found. Creating a new Django project..."
    django-admin startproject pong_project /app
fi
mkdir -p /app/media/profile_photos

# Wait for database
echo "Connecting to database..."
i=1
while [ $i -le 10 ]; do
    if pg_isready -h postgresql -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; then
        echo "✅ Connected to database"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Could not connect to database after 10 attempts"
        exit 1
    fi
    echo "⏳ Attempt $i: Retrying in 3 seconds..."
    sleep 3
    i=$((i + 1))
done
echo "Connected to database"

# Apply database migrations
echo "Applying database migrations..."
python manage.py makemigrations
python manage.py makemigrations pong_project
python manage.py migrate

# Connect to Ganache
i=1
while [ $i -le 11 ]; do
    if curl -s http://ganache:7545 > /dev/null; then
        echo "✅ Ganache is ready!"
        break
    fi
    if [ $i -eq 11 ]; then
        echo "❌ Ganache not responding after 10 tries. Aborting."
        exit 1
    fi
    echo "⏳ Attempt $i: Ganache not ready, retrying in 5s..."
    sleep 5
    i=$((i + 1))
done
echo "Ganache is ready!"

# Deploy contracts
echo "Deploying contracts..."
python /ganache/deploy.py

# Start Django with uvicorn
echo "Starting Django with Uvicorn..."
uvicorn pong_project.asgi:application --host 0.0.0.0 --port 8000 --reload
