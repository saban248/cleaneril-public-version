import random, re
from dataclasses import asdict

import requests

from api.sms_019.ptc import SMS019Config, API019_HEADERS
import api.sms_019.struct019 as s019


def generate_otp():
    # 6 digit
    return random.randint(100000, 999999)



def is_valid_otp(code: str) -> bool:
    return bool(re.fullmatch(r"\d{6}", str(code)))


class OTP019:


    def __init__(self, phone:str):
        self.phone = phone

    def create_otp(self) -> s019.OTPSendResponse:
        # return s019.OTPSendResponse(0, 565656, "ok")
        data = s019.OTPSendRequest(s019.SendOTP(s019.User(SMS019Config.username), self.phone, SMS019Config.SOURCE_PHONE))
        request = requests.post(SMS019Config.URL_API, json=data.asdict(), headers=API019_HEADERS)
        try:
            response = s019.OTPSendResponse(**request.json())
        except Exception as error:
            return s019.OTPSendResponse(-1, 0, str(error))

        return response

    def validate_opt(self, code:int):
        data = s019.OTPValidateRequest(s019.SendOTP(s019.User(SMS019Config.username), self.phone, SMS019Config.SOURCE_PHONE,
                                                    4, code))
        request = requests.post(SMS019Config.URL_API, json=asdict(data), headers=API019_HEADERS)
        try:
            response = s019.OTPValidateResponse(**request.json())
        except Exception as error:
            return s019.OTPValidateResponse(-1, str(error))

        return response



