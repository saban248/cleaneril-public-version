import io

import magic
from PIL import Image

from api.databases.ptc import ServerConfig
from api.ptc import LOGO_APP_FILE_ALLOWED, LOCALHOST
from api.validator import core_msg
from flask import request


def is_logo_app_valid(buffer:bytes):
    __error__ = core_msg.ServerCode.General.something_wrong
    try:
        with Image.open(io.BytesIO(buffer)) as img:
            img.verify()
    except Exception as error:
        f"{error}"
        return __error__

    mime_types = magic.from_buffer(buffer, mime=True)
    if mime_types not in LOGO_APP_FILE_ALLOWED:
        return __error__

    return core_msg.ServerCode.success




def get_client_ip() -> str:
    ip_address_fwd = request.headers.get("X-Forwarded-For")
    real_ip =  request.headers.get("X-Real-IP")
    if ServerConfig.DEV_MODE:
        return request.remote_addr or LOCALHOST

    return (real_ip or ip_address_fwd) or LOCALHOST