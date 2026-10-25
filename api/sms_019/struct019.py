from dataclasses import dataclass, asdict

from api.sms_019.ptc import OTP_MESSAGE


@dataclass(slots=True)
class User:
    username: str


@dataclass(slots=True)
class SendOTP:
    user: User
    phone: str
    source: str
    max_tries: int = 4
    code:int = 0
    text:str = OTP_MESSAGE


@dataclass(slots=True)
class OTPSendRequest:
    send_otp: SendOTP

    def asdict(self):
        return asdict(self)


@dataclass(slots=True)
class OTPSendResponse:
    status:int
    code:int
    message:str


@dataclass(slots=True)
class OTPValidateRequest:
    validate_otp:SendOTP = None

@dataclass(slots=True)
class OTPValidateResponse:
    status:int
    message:str



