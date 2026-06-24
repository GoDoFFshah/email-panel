@echo off
echo ============================================================
echo  🔄 Reset Email Panel Project - Complete Reset
echo ============================================================
echo.

echo 1. Stopping services...
taskkill /f /im "python.exe" 2>nul
taskkill /f /im "node.exe" 2>nul

echo 2. Deleting database...
del /f /q backend\db.sqlite3 2>nul

echo 3. Deleting migration files...
rmdir /s /q backend\apps\accounts\migrations 2>nul
rmdir /s /q backend\apps\senders\migrations 2>nul
rmdir /s /q backend\apps\recipients\migrations 2>nul
rmdir /s /q backend\apps\categories\migrations 2>nul
rmdir /s /q backend\apps\emails\migrations 2>nul
rmdir /s /q backend\apps\admin_panel\migrations 2>nul
rmdir /s /q backend\apps\core\migrations 2>nul
rmdir /s /q backend\apps\notifications\migrations 2>nul

echo 4. Creating migration folders...
mkdir backend\apps\accounts\migrations 2>nul
type nul > backend\apps\accounts\migrations\__init__.py

mkdir backend\apps\senders\migrations 2>nul
type nul > backend\apps\senders\migrations\__init__.py

mkdir backend\apps\recipients\migrations 2>nul
type nul > backend\apps\recipients\migrations\__init__.py

mkdir backend\apps\categories\migrations 2>nul
type nul > backend\apps\categories\migrations\__init__.py

mkdir backend\apps\emails\migrations 2>nul
type nul > backend\apps\emails\migrations\__init__.py

mkdir backend\apps\admin_panel\migrations 2>nul
type nul > backend\apps\admin_panel\migrations\__init__.py

mkdir backend\apps\core\migrations 2>nul
type nul > backend\apps\core\migrations\__init__.py

mkdir backend\apps\notifications\migrations 2>nul
type nul > backend\apps\notifications\migrations\__init__.py

echo 5. Creating new migrations...
python backend\manage.py makemigrations accounts
python backend\manage.py makemigrations

echo 6. Applying migrations...
python backend\manage.py migrate

echo 7. Creating superuser...
python backend\manage.py createsuperuser

echo 8. Collecting static files...
python backend\manage.py collectstatic --noinput

echo.
echo ============================================================
echo  ✅ Reset complete!
echo  🔧 Backend: python backend\manage.py runserver 8000
echo  🌐 Frontend: npm run dev
echo ============================================================
pause