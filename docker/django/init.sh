#!/bin/bash

# Check if required environment variables are set
if [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    echo "Missing required environment variables"
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
while ! pg_isready -h postgresql -p 5432 -U $POSTGRES_USER -d $POSTGRES_DB; do
    echo "Retrying in 3 seconds..."
    sleep 3
done
echo "Connected to database"

# Apply database migrations
echo "Applying database migrations..."
python manage.py makemigrations
python manage.py makemigrations pong_project
python manage.py migrate

# TODO Collect static files (for production)
# python manage.py collectstatic --noinput

# ✅ Start Django with Daphne
#echo "Starting Django with Daphne..."
#daphne -b 0.0.0.0 -p 8000 pong_project.asgi:application

# ✅ Start Django with uvicorn
echo "Starting Django with Uvicorn..."
uvicorn pong_project.asgi:application --host 0.0.0.0 --port 8000 --reload
