import binascii
import ipaddress
import os
from datetime import timedelta
from enum import IntFlag, IntEnum

from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

FILE_NAME_DB = "cleaneril"
cleaneril = Flask(FILE_NAME_DB, template_folder=os.path.join("client", "pages"),
                  static_folder=os.path.join("client", "static"))

class ServerConfig:
    DEV_MODE = os.getenv("DEV_MODE", "false").strip().lower() == "true"
    OTPCODE_MAX_REQUEST = 5
    DOMAIN = os.getenv("APP_DOMAIN", "localhost").strip()
    URL = "https://"+DOMAIN
    DEFAULT_GPSE = 50
    DEF_wNAME    = FILE_NAME_DB
    DEF_wPWD     = "?"+DEF_wNAME
    APPLICATION_NAME = 'CleanerIL'
    API_PATH = os.path.join(os.path.curdir, 'api')
    API_VALIDATOR_PATH = os.path.join(API_PATH, 'validator')
    DB_FOLDER = os.path.join(os.getcwd(), "instance")
    DB_PATH = os.path.join(DB_FOLDER, FILE_NAME_DB)+'.db'
    SERVER_MSG_PATH = os.path.join(API_VALIDATOR_PATH, 'messages.xml')
    PAGES_FOLDER = os.path.join(os.path.dirname(cleaneril.static_folder), "pages")
    FOLDER_IMAGE_PATH   = os.path.join(os.path.basename(cleaneril.static_folder), "images")
    FOLDER_IMAGE_BA   = os.path.join(FOLDER_IMAGE_PATH, "ba")
    DEFAULT_IMAGE_CARD  = os.path.join(FOLDER_IMAGE_BA,'example.jpg')
    FOLDER_LOGOS_PATH = os.path.join(FOLDER_IMAGE_PATH, "logo")
    DEFAULT_COMPANY_LOGO = "default_logo.png"
    DEFAULT_WHATSAPP_MSG = "אשמח להזמין ניקוי ספה"
    DEFAULT_PHONE = os.getenv("DEFAULT_PHONE", "").strip()
    WHATSAPP_LINK = 'https://api.whatsapp.com/send/?phone=972{phone}&text={text}&type=phone_number&app_absent=0'
    DEFAULT_WHATSAPP_LINK = WHATSAPP_LINK.format(phone=DEFAULT_PHONE, text=DEFAULT_WHATSAPP_MSG)
    DEFAULT_COMPANY_EMAIL = os.getenv("DEFAULT_COMPANY_EMAIL", "support@example.com").strip()
    VAT_IL = 18
    APP_VERSION = 1.0
    ICONS_FOLDER = os.path.join(os.path.join("client", "pages"), "icon")
    TWAS = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWAT = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWVSS = os.getenv("TWILIO_VERIFY_SERVICE_SID", "")
    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_ads_developer_token = os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN", "")
    google_permission_scopes = [
        "https://www.googleapis.com/auth/adwords"
    ]
    integration_redirect_uri = os.getenv("INTEGRATION_REDIRECT_URI", "http://localhost/integrations/{flag}/callback" if DEV_MODE else f"https://{DOMAIN}/integrations/{{flag}}/callback")

    google_calendar_scopes = [
        "https://www.googleapis.com/auth/calendar"
    ]


cleaneril.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", f"sqlite:///{FILE_NAME_DB}.db")
cleaneril.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False  # // default
cleaneril.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
cleaneril.config["TEMPLATES_AUTO_RELOAD"] = True
cleaneril.jinja_env.auto_reload = True
cleaneril.secret_key = os.getenv("FLASK_SECRET_KEY") or binascii.hexlify(os.urandom(32)).decode()
cleaneril_db = SQLAlchemy(cleaneril)
migrate = Migrate(cleaneril, cleaneril_db)





class StateDocument(IntFlag):
    DRAFT           = 1<<0
    SAVED           = 1<<1


class StateOrder(IntFlag):
    WAIT            = 1<<0
    CLOSED          = 1<<1
    CANCELED        = 1<<2
    DONE            = 1<<3

    #mask
    ALL = WAIT|CLOSED|CANCELED|DONE

# hierarchy PTC
class ManagerPermissions(IntFlag):
    VIEW            = 1<<0
    EDIT            = 1<<1
    ADMIN           = VIEW|EDIT
    ROOT            = ADMIN|(1<<2)


class ManagerAccountStat(IntFlag):
    ACTIVE = 1<<0
    PENDING = 1<<1
    PAUSE  = 1<<2
    BANNED = 1<<3
    DELETED = 1<<4


class CompanyTaxType(IntFlag):
    PATOOR:int = 0
    MOORSHE:int = 1



class APIRateLimitTypes(IntFlag):
    OTP         = 1<<0
    REGISTER    = 1<<1


class APIRateLimitStat(IntFlag):
    DENIED      = 1<<0
    ACCESS      = 1<<1



def get_max_requests_arl(flag:int):
    match flag:
        case APIRateLimitTypes.OTP:
            return 4
        case APIRateLimitTypes.REGISTER:
            return 3

    return 0


def get_cooldown_arl(flag:int):
    match flag:
        case APIRateLimitTypes.OTP:
            return 5#30min
        case APIRateLimitTypes.REGISTER:
            return 60*5#5min


    return 0#sec


class ClientHistory:
    class Entity(IntEnum):
        ORDER = 1
        INVOICE = 2

    class Action(IntEnum):
        CHANGED = 1
        DELETED = 2
        CREATED = 3



