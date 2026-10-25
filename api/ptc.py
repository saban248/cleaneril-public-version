import binascii
import os
import random
from copy import deepcopy

from flask import Request, session

from api.databases.general import get_columns_as_dict
from api.databases.ptc import ManagerPermissions, ManagerAccountStat, ServerConfig
from api.routes.ptc import RegisterApi
from api.validator import core_msg

CONTENT_TYPE_DATA = "multipart/form-data"
CONTENT_TYPE_FORM = "application/x-www-form-urlencoded"
CONTENT_TYPE_JSON = "application/json"
CONTENT_TYPE_ARGS = "a"
LOCALHOST = "127.0.0.1"

LOGO_APP_FILE_ALLOWED = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif"
}

POV_ABOUTS = [
    "כדי לוודא את מקור ההזמנה, חפש בתחתית את מזהה הזמנה והגש אותה להלן",
    "אין אפשרות לקבל את פרטי ההזמנה במלואה, במקרה של צורך משפטי ניתן לפנות אלינו",
    "שתף קישור של אימות זה להראות לאנשים נוספים, אל תצלם מסך"
]


class ShortSession:
    M = 'manager'
    C = 'company'

    @staticmethod
    def is_admin_active():
        account_stat = ShortSession.manager().get('account_stat', -1) == ManagerAccountStat.ACTIVE
        register_done = ShortSession.company().get("register_level") == RegisterApi.DONE
        return ShortSession.is_admin() and register_done and account_stat

    @staticmethod
    def is_admin_unactive():
        account_stat_inactive = ShortSession.manager().get('account_stat', -1) != ManagerAccountStat.ACTIVE
        register_not_finished = ShortSession.company().get("register_level") != RegisterApi.DONE
        return ShortSession.is_admin() and register_not_finished and account_stat_inactive

    @staticmethod
    def is_admin():
        return ShortSession.manager().get('permission', 0) & ManagerPermissions.ADMIN

    @staticmethod
    def is_root():
        return ShortSession.manager().get('permission') == ManagerPermissions.ROOT

    @staticmethod
    def set_nonce() -> str:
        nonce = binascii.b2a_hex(os.urandom(16)).decode()
        session["nonce"] = nonce
        return nonce

    @staticmethod
    def manager() -> dict:
        return session.get(ShortSession.M,{})
    @staticmethod
    def manager_id():
        return session.get(ShortSession.M,{}).get("manager_id")

    @staticmethod
    def company() -> dict:
        return session.get(ShortSession.C,{})

    @staticmethod
    def company_id():
        return session.get(ShortSession.C,{}).get("company_id")

    @staticmethod
    def set_admin_details(manager, company):
        session[ShortSession.M] = get_columns_as_dict(manager)
        session[ShortSession.C] = get_columns_as_dict(company)

    @property
    def permission(self):
        return self.manager().get('permission', 0)

    @staticmethod
    def valid_nonce(breq:dict):
        return session.get("nonce", str(None)) == breq.get("nonce")

    @staticmethod
    def logout():
        session.clear()

    @staticmethod
    def set_otp(code:int):
        session["otpcode"] = code
        session["otpcode_mr"] = 0
    @staticmethod
    def get_otp():
        code = session.get("otpcode")
        if not code:return 0
        if session.get("otpcode_mr", 0) >= ServerConfig.OTPCODE_MAX_REQUEST:
            del session["otpcode"]
            del session["otpcode_mr"]
            return core_msg.ServerCode.General.access_denied
        session['otpcode_mr'] += 1
        return code

class SJson:
    msg_json = {"success":None, "title":None, "notice":None, "code":0}

    @staticmethod
    def error(__code:int = core_msg.ServerCode.General.access_denied, **errors):
        msg = dict(SJson.msg_json, **errors)
        text = core_msg.ServerMsg[__code]
        msg["success"] = False
        msg["title"] =  "שגיאה"
        msg['code'] = __code
        msg["notice"] = text
        return msg | errors

    @staticmethod
    def success(__code:int = core_msg.ServerCode.success, **success):
        msg = dict(SJson.msg_json, **success)
        text = core_msg.ServerMsg[__code]
        msg["success"] = True
        msg["title"] = "הושלם"
        msg['code'] = __code
        msg["notice"] = text
        return msg | success

    @staticmethod
    def auto_code(__code:int, **dany):
        if __code:
            return SJson.error(__code, **dany)
        return SJson.success(__code, **dany)

def get_dictionary_http(req:Request, content_type:str = str()) -> dict:
    _ctype = req.content_type or str()
    if CONTENT_TYPE_FORM in _ctype or CONTENT_TYPE_DATA in _ctype:
        return deepcopy(req.form.to_dict())

    elif CONTENT_TYPE_JSON in _ctype:
        return deepcopy(req.json)

    elif req.method == 'GET':
        return deepcopy(req.args.to_dict())

    # else return empty dictionary
    return dict()


def generate_hex(length:int=5):
    g = binascii.b2a_hex(os.urandom(length)).decode()
    index = (length - ord(g[length])) % length
    return (g[index]+g).upper()


def generate_code6():
    return random.randint(1_000_000, 9_999_999)


