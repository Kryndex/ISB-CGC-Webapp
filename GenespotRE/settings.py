"""
Copyright 2017, Institute for Systems Biology

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

# Django settings for GAE_Django17 project.
import os
from os.path import join, dirname
import sys

import dotenv

dotenv.read_dotenv(join(dirname(__file__), '../.env'))

APP_ENGINE_FLEX = 'aef-'

BASE_DIR                = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir)) + os.sep

SHARED_SOURCE_DIRECTORIES = [
    'ISB-CGC-Common',
    'ISB-CGC-API',
]

# Add the shared Django application subdirectory to the Python module search path
for directory_name in SHARED_SOURCE_DIRECTORIES:
    sys.path.append(os.path.join(BASE_DIR, directory_name))

DEBUG                   = bool(os.environ.get('DEBUG', False))

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOST', 'localhost').split(',')

SSL_DIR = os.path.abspath(os.path.dirname(__file__))+os.sep

ADMINS                  = ()
MANAGERS                = ADMINS

PROJECT_ID              = os.environ.get('GCLOUD_PROJECT_ID', '')
BQ_PROJECT_ID           = os.environ.get('BIGQUERY_PROJECT_ID', PROJECT_ID) # Replace with PROJECT_ID

# Deployment module
CRON_MODULE             = os.environ.get('CRON_MODULE')

# Log Names
SERVICE_ACCOUNT_LOG_NAME = os.environ.get('SERVICE_ACCOUNT_LOG_NAME', 'local_dev_logging')

BASE_URL                = os.environ.get('BASE_URL', 'https://isb-cgc.appspot.com')
BASE_API_URL            = os.environ.get('BASE_API_URL', 'https://api-dot-isb-cgc.appspot.com')

# Compute services - Should not be necessary in webapp
PAIRWISE_SERVICE_URL    = os.environ.get('PAIRWISE_SERVICE_URL', None)

# Data Buckets
OPEN_DATA_BUCKET        = os.environ.get('OPEN_DATA_BUCKET', '')
DCC_CONTROLLED_DATA_BUCKET = os.environ.get('DCC_CONTROLLED_DATA_BUCKET', '')
CGHUB_CONTROLLED_DATA_BUCKET = os.environ.get('CGHUB_CONTROLLED_DATA_BUCKET', '')
GCLOUD_BUCKET           = os.environ.get('GOOGLE_STORAGE_BUCKET')

# BigQuery cohort storage settings
COHORT_DATASET_ID           = os.environ.get('COHORT_DATASET_ID', 'cohort_dataset')
BIGQUERY_COHORT_TABLE_ID    = os.environ.get('BIGQUERY_COHORT_TABLE_ID', 'developer_cohorts')

NIH_AUTH_ON             = bool(os.environ.get('NIH_AUTH_ON', False))
USER_DATA_ON            = bool(os.environ.get('USER_DATA_ON', False))

DATABASES = {'default': {
    'ENGINE': os.environ.get('DATABASE_ENGINE', 'django.db.backends.mysql'),
    'HOST': os.environ.get('DATABASE_HOST', '127.0.0.1'),
    'NAME': os.environ.get('DATABASE_NAME', ''),
    'USER': os.environ.get('DATABASE_USER'),
    'PASSWORD': os.environ.get('DATABASE_PASSWORD')
}}

DB_SOCKET = DATABASES['default']['HOST'] if 'cloudsql' in DATABASES['default']['HOST'] else None

IS_DEV = bool(os.environ.get('IS_DEV', False))
IS_APP_ENGINE_FLEX = os.getenv('GAE_INSTANCE', '').startswith(APP_ENGINE_FLEX)

# If this is a GAE-Flex deployment, we don't need to specify SSL; the proxy will take
# care of that for us
if os.environ.has_key('DB_SSL_CERT') and not IS_APP_ENGINE_FLEX:
    DATABASES['default']['OPTIONS'] = {
        'ssl': {
            'ca': os.environ.get('DB_SSL_CA'),
            'cert': os.environ.get('DB_SSL_CERT'),
            'key': os.environ.get('DB_SSL_KEY')
        }
    }

# Default to localhost for the site ID
SITE_ID = 3

# Swap to appspot.com site ID if we detect AEF
if IS_APP_ENGINE_FLEX:
    print >> sys.stdout, "[STATUS] AppEngine Flex detected."
    SITE_ID = 4

# Default to no NIH Auth unless we are not on a local dev environment *and* are in AppEngine-Flex
NIH_AUTH_ON = False

if not IS_DEV and IS_APP_ENGINE_FLEX:
    print >> sys.stdout, "[STATUS] NIH_AUTH_ON is TRUE"
    NIH_AUTH_ON = True

def get_project_identifier():
    return BQ_PROJECT_ID

BIGQUERY_DATASET            = os.environ.get('BIGQUERY_DATASET', '')

PROJECT_NAME                = os.environ.get('GCLOUD_PROJECT_NAME')
BIGQUERY_PROJECT_NAME       = os.environ.get('BIGQUERY_PROJECT_NAME', PROJECT_NAME)

# Set cohort table here
if BIGQUERY_COHORT_TABLE_ID is None:
    raise Exception("Developer-specific cohort table ID is not set.")

class BigQueryCohortStorageSettings(object):
    def __init__(self, dataset_id, table_id):
        self.dataset_id = dataset_id
        self.table_id = table_id

def GET_BQ_COHORT_SETTINGS():
    return BigQueryCohortStorageSettings(COHORT_DATASET_ID, BIGQUERY_COHORT_TABLE_ID)

USE_CLOUD_STORAGE           = os.environ.get('USE_CLOUD_STORAGE', False)

PROCESSING_ENABLED          = os.environ.get('PROCESSING_ENABLED', False)
PROCESSING_JENKINS_URL      = os.environ.get('PROCESSING_JENKINS_URL', 'http://localhost/jenkins')
PROCESSING_JENKINS_PROJECT  = os.environ.get('PROCESSING_JENKINS_PROJECT', 'cgc-processing')
PROCESSING_JENKINS_USER     = os.environ.get('PROCESSING_JENKINS_USER', 'user')
PROCESSING_JENKINS_PASSWORD = os.environ.get('PROCESSING_JENKINS_PASSWORD', '')

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

CSRF_COOKIE_SECURE = bool(os.environ.get('CSRF_COOKIE_SECURE', False))
SESSION_COOKIE_SECURE = bool(os.environ.get('SESSION_COOKIE_SECURE', False))
SECURE_SSL_REDIRECT = bool(os.environ.get('SECURE_SSL_REDIRECT', False))

# Due to the behavior of AppEngine Flex and the load balancer, we have to explicitly
# use SSLify to enforce redirect of http to https even though we're on Django 1.8+
# --> DO NOT REMOVE THIS OR ITS REQUIREMENTS ENTRY <--
SSLIFY_DISABLE = True if not SECURE_SSL_REDIRECT else False

if SECURE_SSL_REDIRECT:
    os.environ['HTTPS'] = "on"
    os.environ['wsgi.url_scheme'] = 'https'

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Los_Angeles'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_FOLDER = os.environ.get('MEDIA_FOLDER', 'uploads/')
MEDIA_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', MEDIA_FOLDER)
MEDIA_ROOT = os.path.normpath(MEDIA_ROOT)

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = os.environ.get('STATIC_URL', '/static/')

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(BASE_DIR, 'static'),
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '')

MIDDLEWARE_CLASSES = (
    # Due to the behavior of AppEngine Flex and the load balancer, we have to explicitly
    # use SSLify to enforce redirect of http to https even though we're on Django 1.8+
    # --> DO NOT REMOVE THIS OR ITS REQUIREMENTS ENTRY <--
    'sslify.middleware.SSLifyMiddleware',
    # For using NDB with Django
    # documentation: https://cloud.google.com/appengine/docs/python/ndb/#integration
    # WE DON'T SEEM TO BE USING NDB SO I'M COMMENTING THIS OUT - PL
    # 'google.appengine.ext.ndb.django_middleware.NdbDjangoMiddleware',
    # 'google.appengine.ext.appstats.recording.AppStatsDjangoMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'adminrestrict.middleware.AdminPagesRestrictMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'offline.middleware.OfflineMiddleware',
)

ROOT_URLCONF = 'GenespotRE.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'GenespotRE.wsgi.application'

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'django.contrib.admindocs',
    'GenespotRE',
    'visualizations',
    'seqpeek',
    'sharing',
    'cohorts',
    'projects',
    'genes',
    'variables',
    'workbooks',
    'data_upload',
    'analysis',
    'offline',
    'adminrestrict',
)

#############################
#  django-session-security  #
#############################

# testing "session security works at the moment" commit
INSTALLED_APPS += ('session_security',)
SESSION_SECURITY_WARN_AFTER = 540
SESSION_SECURITY_EXPIRE_AFTER = 600
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
MIDDLEWARE_CLASSES += (
    # for django-session-security -- must go *after* AuthenticationMiddleware
    'session_security.middleware.SessionSecurityMiddleware',
)

###############################
# End django-session-security #
###############################

TEST_RUNNER = 'django.test.runner.DiscoverRunner'

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler'
        },
        'console_all': {
            'level': 'DEBUG',
            'filters': ['require_debug_false'],
            'class': 'logging.StreamHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
        'cohorts': {
            'handlers': ['console_all'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'allauth': {
            'handlers': ['console_all'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'demo': {
            'handlers': ['console_all'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'projects': {
            'handlers': ['console_all'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'workbooks': {
            'handlers': ['console_all'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'accounts': {
            'handlers': ['console_all'],
            'level': 'DEBUG',
            'propagate': True,
        },
    }
}

##########################
#  Start django-allauth  #
##########################

LOGIN_REDIRECT_URL = '/dashboard/'

INSTALLED_APPS += (
    'accounts',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google')

# Template Engine Settings
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # add any necessary template paths here
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
            os.path.join(BASE_DIR, 'templates', 'accounts'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            # add any context processors here
            'context_processors': (
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.tz',
                'finalware.context_processors.contextify',
                'GenespotRE.context_processor.additional_context',
            ),
            # add any loaders here; if using the defaults, we can comment it out
            # 'loaders': (
            #     'django.template.loaders.filesystem.Loader',
            #     'django.template.loaders.app_directories.Loader'
            # ),
            'debug': DEBUG,
        },
    },
]

AUTHENTICATION_BACKENDS = (
    # Needed to login by username in Django admin, regardless of `allauth`
    "django.contrib.auth.backends.ModelBackend",

    # `allauth` specific authentication methods, such as login by e-mail
    "allauth.account.auth_backends.AuthenticationBackend",
)

SOCIALACCOUNT_PROVIDERS = \
    { 'google':
        { 'SCOPE': ['profile', 'email'],
          'AUTH_PARAMS': { 'access_type': 'online' }
        }
    }

# Trying to force allauth to only use https
ACCOUNT_DEFAULT_HTTP_PROTOCOL = 'https'
# ...but not if this is a local dev build
if IS_DEV:
    ACCOUNT_DEFAULT_HTTP_PROTOCOL = 'http'


##########################
#   End django-allauth   #
##########################

GOOGLE_APPLICATION_CREDENTIALS  = os.path.join(os.path.dirname(os.path.dirname(__file__)), os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')) if os.environ.get('GOOGLE_APPLICATION_CREDENTIALS') else '' # Path to privatekey.json
CLIENT_SECRETS                  = os.path.join(os.path.dirname(os.path.dirname(__file__)), os.environ.get('CLIENT_SECRETS')) if os.environ.get('CLIENT_SECRETS') else ''
PEM_FILE                        = os.path.join(os.path.dirname(os.path.dirname(__file__)), os.environ.get('PEM_FILE')) if os.environ.get('PEM_FILE') else ''
CLIENT_EMAIL                    = os.environ.get('CLIENT_EMAIL', '') # Client email from client_secrets.json
WEB_CLIENT_ID                   = os.environ.get('WEB_CLIENT_ID', '') # Client ID from client_secrets.json
IGV_WEB_CLIENT_ID               = os.environ.get('IGV_WEB_CLIENT_ID', WEB_CLIENT_ID)
INSTALLED_APP_CLIENT_ID         = os.environ.get('INSTALLED_APP_CLIENT_ID', '') # Native Client ID

#################################
#   For NIH/eRA Commons login   #
#################################

LOGIN_EXPIRATION_HOURS = 24
DBGAP_AUTHENTICATION_LIST_FILENAME      = os.environ.get('DBGAP_AUTHENTICATION_LIST_FILENAME', '')
DBGAP_AUTHENTICATION_LIST_BUCKET        = os.environ.get('DBGAP_AUTHENTICATION_LIST_BUCKET', '')
ACL_GOOGLE_GROUP                        = os.environ.get('ACL_GOOGLE_GROUP', '')
OPEN_ACL_GOOGLE_GROUP                   = os.environ.get('OPEN_ACL_GOOGLE_GROUP', '')
GOOGLE_GROUP_ADMIN                      = os.environ.get('GOOGLE_GROUP_ADMIN', '')
SUPERADMIN_FOR_REPORTS                  = os.environ.get('SUPERADMIN_FOR_REPORTS', '')
ERA_LOGIN_URL                           = os.environ.get('ERA_LOGIN_URL', '')
SAML_FOLDER                             = os.environ.get('SAML_FOLDER')

# TaskQueue used when users go through the ERA flow
LOGOUT_WORKER_TASKQUEUE                  = os.environ.get('LOGOUT_WORKER_TASKQUEUE')
CHECK_NIH_USER_LOGIN_TASK_URI            = os.environ.get('CHECK_NIH_USER_LOGIN_TASK_URI')

# TaskQueue used by the sweep_nih_user_logins task
LOGOUT_SWEEPER_FALLBACK_TASKQUEUE        = os.environ.get('LOGOUT_SWEEPER_FALLBACK_TASKQUEUE')

# PubSub topic for ERA login notifications
PUBSUB_TOPIC_ERA_LOGIN                   = os.environ.get('PUBSUB_TOPIC_ERA_LOGIN')

# User project access key
USER_GCP_ACCESS_CREDENTIALS              = os.environ.get('USER_GCP_ACCESS_CREDENTIALS')

##############################
#   Start django-finalware   #
##############################

INSTALLED_APPS += (
    'finalware',)

SITE_SUPERUSER_USERNAME = os.environ.get('SUPERUSER_USERNAME', '')
SITE_SUPERUSER_EMAIL = ''
SITE_SUPERUSER_PASSWORD = os.environ.get('SUPERUSER_PASSWORD', '')

############################
#   End django-finalware   #
############################

CONN_MAX_AGE = 60

############################
#   CUSTOM TEMPLATE CONTEXT
############################

SITE_GOOGLE_ANALYTICS   = os.environ.get('SITE_GOOGLE_ANALYTICS_ID', False)
SITE_GOOGLE_TAG_MANAGER_ID = os.environ.get('SITE_GOOGLE_TAG_MANAGER_ID', False)

##############################################################
#   MAXes to prevent size-limited events from causing errors
##############################################################

# Google App Engine has a response size limit of 32M. ~65k entries from the cohort_filelist view will
# equal just under the 32M limit. If each individual listing is ever lengthened or shortened this
# number should be adjusted
MAX_FILE_LIST_REQUEST = 65000

# IGV limit to prevent users from trying ot open dozens of files
MAX_FILES_IGV = 5

##############################################################
#   MailGun Email Settings
##############################################################

EMAIL_SERVICE_API_URL = os.environ.get('EMAIL_SERVICE_API_URL', '')
EMAIL_SERVICE_API_KEY = os.environ.get('EMAIL_SERVICE_API_KEY', '')
NOTIFICATION_EMAIL_FROM_ADDRESS = os.environ.get('NOTIFICATOON_EMAIL_FROM_ADDRESS', '')

WHITELIST_RE = ur'([^\\\_\|\"\+~@:#\$%\^&\*=\-\.,\(\)0-9a-zA-Z\s\xc7\xfc\xe9\xe2\xe4\xe0\xe5\xe7\xea\xeb\xe8\xef\xee\xed\xec\xc4\xc5\xc9\xe6\xc6\xf4\xf6\xf2\xfb\xf9\xd6\xdc\xe1\xf3\xfa\xf1\xd1\xc0\xc1\xc2\xc3\xc8\xca\xcb\xcc\xcd\xce\xcf\xd0\xd2\xd3\xd4\xd5\xd8\xd9\xda\xdb\xdd\xdf\xe3\xf0\xf5\xf8\xfd\xfe\xff])'
