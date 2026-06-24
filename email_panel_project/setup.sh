#!/bin/bash

# Email Panel Deployment Script
echo "🚀 Email Panel Deployment Started"
echo "=================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment file
if [ ! -f backend/.env ]; then
    echo "📝 Creating environment file..."
    cat > backend/.env << EOF
DJANGO_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,api.yourdomain.com
DB_NAME=email_panel
DB_USER=postgres
DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/1
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EOF
    echo "✅ Environment file created"
fi

# Create required directories
echo "📁 Creating directories..."
mkdir -p backend/logs backend/media backend/staticfiles

# Build and run containers
echo "🐳 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec backend python manage.py migrate

# Create superuser
echo "👤 Creating superuser..."
docker-compose exec backend python manage.py createsuperuser

# Collect static files
echo "📦 Collecting static files..."
docker-compose exec backend python manage.py collectstatic --noinput

# Create admin user
echo "👑 Creating admin user..."
docker-compose exec backend python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
"

echo ""
echo "✅ Deployment complete!"
echo "=================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000/api/"
echo "👑 Admin Panel: http://localhost:8000/admin/"
echo ""
echo "📊 For logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo "=================================="