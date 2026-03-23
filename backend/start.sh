#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Applying database migrations..."
python3 manage.py migrate

echo "Creating users..."
python3 manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

# Create superuser
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'adminpass')
    print('✅ Superuser created: admin / adminpass')

# Create normal user
if not User.objects.filter(username='player1').exists():
    User.objects.create_user('player1', 'player1@example.com', 'playerpass')
    print('✅ Normal user created: player1 / playerpass')
"

echo "Seeding superheroes data..."
echo "Note: Make sure SUPERHERO_API_TOKEN is set in your .env file."
python3 manage.py seed_heroes

echo "Starting the Django server..."
exec python3 manage.py runserver 8001
