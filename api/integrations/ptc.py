from enum import IntFlag, auto, IntEnum

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"


class AppIntegration(IntEnum):
    GOOGLE_ADS = 1
    META_ADS = 2
    WHATSAPP_BUSINESS  = 3
    GOOGLE_CALENDAR = 4


class IntegrationStat(IntFlag):
    EXPIRE = 1<<0
    DISCONNECT = 1<<1
    CONNECT = 1<<2