#!/bin/bash

# Check if required environment variables are set
if [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ]; then
	echo "Missing required environment variables"
	sleep 5
	exit 1
fi

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
python manage.py migrate

# TODO Collect static files (for production)
# python manage.py collectstatic --noinput

# Start server
python manage.py runserver "0.0.0.0:8000"