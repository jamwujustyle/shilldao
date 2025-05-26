from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


DEBUG = os.environ.get("DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost").split(",")


SECRET_KEY = os.environ.get("SECRET_KEY", "secret")

INSTALLED_APPS = [
    # CORE CONFS
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "django_filters",
    "django_cleanup.apps.CleanupConfig",
    "django_celery_beat",
    # APPS
    "core",
    "user",
    "eth_auth",
    "campaign",
    "task",
    "submission",
    "reward",
    "dao",
    "metrics",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "app.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "app.wsgi.application"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "no name"),
        "USER": os.environ.get("DB_USER", "no user"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "no password"),
        "HOST": os.environ.get("DB_HOST", "no host"),
        "PORT": os.environ.get("DB_PORT", "no port"),
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
}
AUTH_USER_MODEL = "core.User"

SPECTACULAR_SETTINGS = {
    "TITLE": "Shillers",
    "DESCRIPTION": "for devs",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api/v1",
    "COMPONENT_SPLIT_REQUEST": True,
    # Security scheme configuration
    "SECURITY": [{"Bearer": []}],
    "SECURITY_DEFINITIONS": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Enter 'Bearer <JWT>' where <JWT> is your access token",
        }
    },
}

SIMPLE_JWT = {
    # CHANGE IN PRODUCTION
    "ACCESS_TOKEN_LIFETIME": timedelta(days=7),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": os.environ.get("SECRET_KEY", None),
    "AUTH_HEADER_TYPES": ("Bearer",),
}
# Use CORS_ALLOWED_ORIGINS instead of the deprecated CORS_ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
# Optional: Allow credentials (cookies, authorization headers) if needed
# CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS += ["http://localhost"]
STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Media files (uploads)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")


if os.environ.get("CI") == "true":
    # In CI, services are typically available on localhost
    ACTUAL_REDIS_HOST = "localhost"
else:
    # For local development (e.g., Docker Compose), use env var or default
    ACTUAL_REDIS_HOST = os.environ.get("REDIS_HOST", "redis")

ACTUAL_REDIS_PORT = os.environ.get("REDIS_PORT", "6379")

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": f"redis://{ACTUAL_REDIS_HOST}:{ACTUAL_REDIS_PORT}/1",
    },
}

# Production Security Settings (activated when DEBUG is False)
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True  # Ensure your proxy is configured for this (X-Forwarded-Proto is already set)
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_BROWSER_XSS_FILTER = (
        True  # Enables XSS filtering in browsers that support it.
    )
    SECURE_CONTENT_TYPE_NOSNIFF = (
        True  # Prevents the browser from guessing content types.
    )
    # Consider setting a stricter Referrer-Policy if needed for your application
    # SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin" # or "same-origin"

    # It's also good practice to ensure your SECRET_KEY is strong and kept secret,
    # and that database credentials are secure and not hardcoded (which you are doing via env vars).

    # Regarding SIMPLE_JWT settings:
    # ACCESS_TOKEN_LIFETIME is currently timedelta(days=7).
    # For enhanced security in production, consider reducing this (e.g., timedelta(minutes=15) or timedelta(hours=1))
    # and relying on the REFRESH_TOKEN_LIFETIME (currently timedelta(days=30)) for longer sessions.
    # This is a security policy decision based on your application's needs.
    # Example for shorter access tokens:
    # SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'] = timedelta(minutes=15)
    # SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] = timedelta(days=7) # Or keep as is
    # SIMPLE_JWT['ROTATE_REFRESH_TOKENS'] = True
    # SIMPLE_JWT['BLACKLIST_AFTER_ROTATION'] = True


SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True


LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Celery Configuration
CELERY_IMPORTS = ["celery_tasks.tasks"]
CELERY_BROKER_URL = f"redis://{ACTUAL_REDIS_HOST}:{ACTUAL_REDIS_PORT}/0"
CELERY_RESULT_BACKEND = f"redis://{ACTUAL_REDIS_HOST}:{ACTUAL_REDIS_PORT}/0"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

# Celery Beat Settings
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# Web3 Configuration
INFURA_PROJECT_ID = os.environ.get("INFURA_PROJECT_ID", None)
WEB3_PROVIDER_URL = f"https://sepolia.infura.io/v3/{INFURA_PROJECT_ID}"
