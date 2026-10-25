import os

from api.databases.ptc import ServerConfig


OTP_MESSAGE = """
cleanerIL OTP
קוד אימות #[code]
"""

def get_sms019_url_api():
    if ServerConfig.DEV_MODE:
        return SMS019Config.URL_API_TEST

    return  SMS019Config.URL_API


class SMS019Config:
    TOKEN = os.getenv("SMS019_TOKEN", "")
    URL_API = "https://019sms.co.il/api"
    URL_API_TEST = "https://019sms.co.il/api/test"
    SOURCE_PHONE = os.getenv("SMS019_SOURCE_PHONE", "")
    username = os.getenv("SMS019_USERNAME", "")
API019_HEADERS = {
    "Authorization": f"Bearer {SMS019Config.TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}
