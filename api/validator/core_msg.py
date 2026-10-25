import os
import xml.etree.ElementTree as ET
from enum import IntFlag

from api.databases.ptc import ServerConfig

unknown = 'unknown'
default_language = 'he'


class BaseServerMsg:
    def __init__(self, language:str = default_language):
        self.__sm = {}
        self.__lang = language

        self.load_xml_server_msg()

    def load_xml_server_msg(self):
        try:
            tree = ET.parse(ServerConfig.SERVER_MSG_PATH)
        except FileNotFoundError as e:
            print(e)
            return
        root = tree.getroot()
        for m in root.findall("msg"):
            code = int(m.get("code"))
            lang = m.get("lang", "he")
            text = m.text or ""

            if code not in self.__sm:
                self.__sm[code] = {}

            self.__sm[code][lang] = text

    def __getitem__(self, code):
        return self.__sm.get(code, {}).get(self.__lang) or unknown

    @property
    def get_msgs(self):
        return self.__sm


class ServerCode:
    # 15
    success = 0
    class Company:
        short_company_name          = 2
        name_company_exist          = 3
        i_company_description       = 5
        i_owner_name                = 8
        i_vat_code                  = 13
    class General:
        invalid_phone               = 4
        invalid_passwd              = 6
        something_wrong             = 10
        access_denied               = 11
        already_suspend             = 27
        invalid_int_value           = 31
    class Register:
        invalid_username            = 1
        e_account_exist             = 7
        register_not_finished       = 14
    class Receipt:
        receipt_exist               = 9
        receipt_create_problem      = 12
    class Orders:
        order_exist = 15
        order_create_problem = 16
        order_duplicate_not_exist = 17

    class Integration:
        already_exist = 18
        otpcode_invalid = 19
        already_verified = 20
        reach_otp_limit = 21

    class Marketplace:
        share_order_stat_invalid = 22
        share_order_items_invalid = 23
        share_order_noclient = 24
        share_order_nomoney = 25
        already_order_share = 26
        date_share_job_invalid = 28
        cant_edit_order = 29
        job_unavailble = 30
        order_share_done = 32
        request_unavailable = 33




ServerMsg = BaseServerMsg()

