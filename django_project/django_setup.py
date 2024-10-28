# django_setup.py
import os
import django
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_project.settings")
django.setup()
