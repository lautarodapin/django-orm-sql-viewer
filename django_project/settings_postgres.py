from os import environ, path
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-=uaefyewo8*az(&_(82uf!k@^k840640&dtejakp^%k2%9@+qv"


DEBUG = environ.get("DJANGO_DEBUG", "false").lower() == "true"

DATABASES = {
    "default": {
        "ENGINE": environ.get("DATABASE_ENGINE", "django.db.backends.postgresql"),
        "NAME": environ.get("DATABASE_NAME", "django"),
        "USER": environ.get("DATABASE_USER", "postgres"),
        "PASSWORD": environ.get("DATABASE_PASSWORD", "example"),
        "HOST": environ.get("POSTGRESQL_SERVICE_HOST", "postgresql"),
        "CONN_MAX_AGE": 600,
    }
}

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]
MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
if not DEBUG:
    TEMPLATE_LOADERS = (("django.template.loaders.cached.Loader"),)
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            (path.join(BASE_DIR, "templates")),
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
            "builtins": [
                "utils.templatetags",
            ],
        },
    },
]

WSGI_APPLICATION = "bolsatech.wsgi.application"


LANGUAGE_CODE = "es-es"
TIME_ZONE = "America/Argentina/Buenos_Aires"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
MEDIA_URL = "/uploads/"
