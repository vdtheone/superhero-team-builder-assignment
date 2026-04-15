#!/bin/bash

set -euo pipefail

# =========================
# CONFIG
# =========================
PROJECT_DIR="/home/ubuntu/vishal/projects/superhero-team-builder-assignment"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOG_FILE="$PROJECT_DIR/deploy.log"

echo "===============================" | tee -a $LOG_FILE
echo "🚀 Deployment started at $(date)" | tee -a $LOG_FILE
echo "===============================" | tee -a $LOG_FILE


# =========================
# 1. Pull latest code
# =========================
echo "📥 Pulling latest code..." | tee -a $LOG_FILE
cd $PROJECT_DIR
git pull origin main | tee -a $LOG_FILE


# =========================
# 2. Backend Setup
# =========================
echo "🐍 Backend setup..." | tee -a $LOG_FILE
cd $BACKEND_DIR

if [ ! -d "venv" ]; then
  echo "❌ Virtual environment not found!" | tee -a $LOG_FILE
  exit 1
fi

source venv/bin/activate

pip install --upgrade pip | tee -a $LOG_FILE
pip install -r requirements.txt | tee -a $LOG_FILE


# =========================
# 3. Django Checks
# =========================
echo "🧪 Running Django checks..." | tee -a $LOG_FILE
python manage.py check | tee -a $LOG_FILE
python manage.py migrate --noinput | tee -a $LOG_FILE
python manage.py collectstatic --noinput | tee -a $LOG_FILE


# =========================
# 4. Restart backend services
# =========================
echo "🔄 Restarting backend services..." | tee -a $LOG_FILE

sudo systemctl restart gunicorn
sudo systemctl restart nginx

sleep 2

sudo systemctl is-active --quiet gunicorn && echo "✅ Gunicorn running" | tee -a $LOG_FILE || {
  echo "❌ Gunicorn failed!" | tee -a $LOG_FILE
  exit 1
}


# =========================
# 5. Frontend build
# =========================
echo "⚛️ Frontend build..." | tee -a $LOG_FILE

cd $FRONTEND_DIR

npm ci | tee -a $LOG_FILE
npm run build | tee -a $LOG_FILE


# =========================
# 6. Deploy frontend
# =========================
echo "📦 Deploying frontend..." | tee -a $LOG_FILE

sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/


# =========================
# 7. Final restart & validation
# =========================
echo "🔄 Final restart..." | tee -a $LOG_FILE

sudo systemctl restart nginx

sleep 2

sudo systemctl is-active --quiet nginx && echo "✅ Nginx running" | tee -a $LOG_FILE || {
  echo "❌ Nginx failed!" | tee -a $LOG_FILE
  exit 1
}


# =========================
# DONE
# =========================
echo "===============================" | tee -a $LOG_FILE
echo "🎉 Deployment SUCCESS at $(date)" | tee -a $LOG_FILE
echo "===============================" | tee -a $LOG_FILE