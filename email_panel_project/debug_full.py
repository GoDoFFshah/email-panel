#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Email Panel - Full Debug Script
این اسکریپت همه چیز رو چک میکنه و مشکل رو پیدا میکنه
"""

import os
import sys
import socket
import subprocess
import requests
import time
import json
from pathlib import Path

# ==================== تنظیمات رنگ ====================
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.CYAN}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*60}{Colors.RESET}\n")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.BLUE}📌 {text}{Colors.RESET}")

# ==================== تست‌ها ====================

def check_python():
    """بررسی نسخه پایتون"""
    print_info("Checking Python version...")
    version = sys.version
    if sys.version_info >= (3, 8):
        print_success(f"Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
        return True
    else:
        print_error(f"Python version {version} is too old. Need 3.8+")
        return False

def check_django():
    """بررسی Django"""
    print_info("Checking Django...")
    try:
        import django
        print_success(f"Django {django.__version__}")
        return True
    except ImportError:
        print_error("Django is not installed!")
        print_warning("Run: pip install django")
        return False

def check_redis():
    """بررسی Redis"""
    print_info("Checking Redis...")
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        r.ping()
        print_success("Redis is running on localhost:6379")
        return True
    except redis.ConnectionError:
        print_error("Redis is NOT running!")
        print_warning("Run: redis-server")
        return False
    except ImportError:
        print_warning("Redis module not installed. Run: pip install redis")
        return None

def check_celery():
    """بررسی Celery"""
    print_info("Checking Celery...")
    try:
        import celery
        print_success(f"Celery {celery.__version__}")
        return True
    except ImportError:
        print_error("Celery is not installed!")
        print_warning("Run: pip install celery")
        return False

def check_frontend():
    """بررسی فرانت‌اند"""
    print_info("Checking Frontend...")
    try:
        response = requests.get('http://localhost:3000', timeout=3)
        if response.status_code == 200:
            print_success("Frontend is running on http://localhost:3000")
            return True
        else:
            print_warning(f"Frontend returned status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Frontend is NOT running!")
        print_warning("Run: cd frontend && npm run dev")
        return False
    except Exception as e:
        print_error(f"Error checking frontend: {e}")
        return False

def check_backend():
    """بررسی بک‌اند"""
    print_info("Checking Backend...")
    try:
        response = requests.get('http://localhost:8000/admin/', timeout=3)
        if response.status_code in [200, 302, 301]:
            print_success("Backend is running on http://localhost:8000")
            return True
        else:
            print_warning(f"Backend returned status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Backend is NOT running!")
        print_warning("Run: python backend/manage.py runserver 8000")
        return False
    except Exception as e:
        print_error(f"Error checking backend: {e}")
        return False

def check_api():
    """بررسی API"""
    print_info("Checking API...")
    try:
        response = requests.get('http://localhost:8000/api/auth/login/', timeout=3)
        if response.status_code in [200, 405, 401]:
            print_success("API is responding")
            return True
        else:
            print_warning(f"API returned status: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"API error: {e}")
        return False

def check_login():
    """بررسی لاگین"""
    print_info("Checking Login...")
    try:
        response = requests.post(
            'http://localhost:8000/api/auth/login/',
            json={'username': 'admin', 'password': 'admin123'},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            if 'access' in data:
                print_success("Login successful! Access token received")
                return data.get('access')
            else:
                print_error("Login response missing access token")
                return None
        else:
            print_error(f"Login failed with status: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Login error: {e}")
        return None

def check_database():
    """بررسی دیتابیس"""
    print_info("Checking Database...")
    db_path = Path('backend/db.sqlite3')
    if db_path.exists():
        size = db_path.stat().st_size
        print_success(f"Database exists: {size/1024:.1f} KB")
        return True
    else:
        print_error("Database file not found!")
        print_warning("Run: python backend/manage.py migrate")
        return False

def check_env():
    """بررسی فایل .env"""
    print_info("Checking .env file...")
    env_path = Path('backend/.env')
    if env_path.exists():
        print_success(".env file exists")
        return True
    else:
        print_warning(".env file not found. Using default settings.")
        return True

def check_ports():
    """بررسی پورت‌ها"""
    print_info("Checking ports...")
    ports = {
        3000: "Frontend",
        8000: "Backend",
        6379: "Redis",
        5432: "PostgreSQL"
    }
    results = {}
    for port, name in ports.items():
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            if result == 0:
                print_success(f"Port {port} ({name}) is open")
                results[port] = True
            else:
                print_warning(f"Port {port} ({name}) is closed")
                results[port] = False
        except Exception as e:
            print_error(f"Error checking port {port}: {e}")
            results[port] = False
    return results

def check_migrations():
    """بررسی migrations"""
    print_info("Checking migrations...")
    result = subprocess.run(
        ['python', 'backend/manage.py', 'showmigrations'],
        capture_output=True,
        text=True,
        cwd=os.getcwd()
    )
    if '[ ]' in result.stdout:
        print_warning("Some migrations are not applied!")
        print_info("Run: python backend/manage.py migrate")
        return False
    else:
        print_success("All migrations are applied")
        return True

def check_npm():
    """بررسی npm"""
    print_info("Checking npm...")
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_success(f"npm {result.stdout.strip()}")
            return True
        else:
            print_error("npm not found! Install Node.js")
            return False
    except FileNotFoundError:
        print_error("npm not found! Install Node.js")
        return False

def check_node_modules():
    """بررسی node_modules"""
    print_info("Checking node_modules...")
    node_modules = Path('frontend/node_modules')
    if node_modules.exists():
        count = sum(1 for _ in node_modules.rglob('*') if _.is_file())
        print_success(f"node_modules exists ({count} files)")
        return True
    else:
        print_warning("node_modules not found!")
        print_info("Run: cd frontend && npm install")
        return False

# ==================== اجرا ====================

def run_all_tests():
    print_header("🔍 Email Panel - Full Debug Script")
    
    results = {}
    
    # 1. محیط
    print_header("1. Environment Check")
    results['python'] = check_python()
    results['django'] = check_django()
    results['env'] = check_env()
    results['npm'] = check_npm()
    
    # 2. دیتابیس
    print_header("2. Database Check")
    results['database'] = check_database()
    results['migrations'] = check_migrations()
    
    # 3. فرانت‌اند
    print_header("3. Frontend Check")
    results['node_modules'] = check_node_modules()
    
    # 4. پورت‌ها
    print_header("4. Ports Check")
    ports = check_ports()
    results['ports'] = ports
    
    # 5. سرویس‌ها
    print_header("5. Services Check")
    results['frontend'] = check_frontend()
    results['backend'] = check_backend()
    results['api'] = check_api()
    
    # 6. Redis و Celery
    print_header("6. Redis & Celery Check")
    results['redis'] = check_redis()
    results['celery'] = check_celery()
    
    # 7. لاگین
    print_header("7. Login Test")
    results['login'] = check_login()
    
    # ==================== گزارش نهایی ====================
    print_header("📊 Final Report")
    
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    unknown = sum(1 for v in results.values() if v is None)
    
    print(f"   ✅ Passed: {Colors.GREEN}{passed}{Colors.RESET}")
    print(f"   ❌ Failed: {Colors.RED}{failed}{Colors.RESET}")
    print(f"   ⚠️  Unknown: {Colors.YELLOW}{unknown}{Colors.RESET}")
    
    # ==================== راهنمایی ====================
    print_header("💡 Recommendations")
    
    if not results.get('frontend'):
        print_warning("Frontend is not running. Start it:")
        print("   cd frontend && npm run dev")
    
    if not results.get('backend'):
        print_warning("Backend is not running. Start it:")
        print("   venv\\Scripts\\activate && python backend\\manage.py runserver 8000")
    
    if not results.get('redis'):
        print_warning("Redis is not running. Start it:")
        print("   redis-server")
    
    if not results.get('database'):
        print_warning("Database issue. Fix it:")
        print("   python backend\\manage.py migrate")
    
    if not results.get('node_modules'):
        print_warning("Node modules not installed. Install them:")
        print("   cd frontend && npm install")
    
    if not ports.get(3000):
        print_warning("Port 3000 (Frontend) is not open. Start frontend.")
    
    if not ports.get(8000):
        print_warning("Port 8000 (Backend) is not open. Start backend.")
    
    # ==================== خلاصه نهایی ====================
    print_header("📋 Quick Commands")
    
    print(f"{Colors.CYAN}Start Backend:{Colors.RESET}")
    print("   D: && cd D:\\send\\email_panel_project && venv\\Scripts\\activate && python backend\\manage.py runserver 8000")
    print()
    print(f"{Colors.CYAN}Start Frontend:{Colors.RESET}")
    print("   D: && cd D:\\send\\email_panel_project\\frontend && npm run dev")
    print()
    print(f"{Colors.CYAN}Start Redis:{Colors.RESET}")
    print("   redis-server")
    print()
    print(f"{Colors.CYAN}Start Celery:{Colors.RESET}")
    print("   celery -A email_panel worker -l info --pool=solo")
    
    print_header("✅ Debug Complete")
    
    return results

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️  Debug interrupted by user")
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()