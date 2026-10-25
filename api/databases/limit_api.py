import ipaddress
import time
from datetime import datetime

from api.databases.general import get_columns
from api.databases.ptc import cleaneril_db, get_max_requests_arl, APIRateLimitStat, get_cooldown_arl, APIRateLimitTypes
from api.ptc import generate_hex
from api.validator import core_msg


class APIRateLimit(cleaneril_db.Model):
    __tablename__ = "api_limit"
    key = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, primary_key=True)
    limit_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    ip = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    limit_type = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    requests = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    cooldown = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    create_at = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    stat = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)


def get_arls(source:bool = True, **kwargs) -> APIRateLimit:
    return get_columns(APIRateLimit, source, **kwargs)


def exist_by_ip(ip:str, limit_type:int) -> bool:
    return get_arls(ip=ip, limit_type=limit_type).first()


def create_arl(ip:str, limit_type:int):
    try:
        ipaddress.ip_address(ip)
    except Exception as e:
        return core_msg.ServerCode.General.something_wrong

    if exist_by_ip(ip, limit_type):
        update_arl(ip, limit_type)
    limit = APIRateLimit()
    limit.limit_id = "arl"+generate_hex(14)
    limit.ip = ip
    limit.limit_type = limit_type
    limit.requests = 0
    limit.create_at = time.time()
    limit.cooldown = 0
    limit.stat = APIRateLimitStat.ACCESS
    cleaneril_db.session.add(limit)
    cleaneril_db.session.commit()

    return limit


def update_arl(ip:str, limit_type:int):
    arl:APIRateLimit = get_arls(ip=ip, limit_type=limit_type).first()
    if not arl:
        if not create_arl(ip, limit_type):raise OSError()
        return update_arl(ip, limit_type)
    if arl.stat & APIRateLimitStat.DENIED:
        if arl.cooldown < time.time():
            reset_arl_limit(ip, limit_type)
            return core_msg.ServerCode.success
        else:
            return core_msg.ServerCode.General.access_denied
    elif arl.requests >= get_max_requests_arl(limit_type):
        arl.stat = APIRateLimitStat.DENIED
        arl.cooldown = time.time()+get_cooldown_arl(limit_type)
        cleaneril_db.session.commit()
        return core_msg.ServerCode.General.access_denied

    arl.requests += 1
    arl.stat = APIRateLimitStat.ACCESS
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success


def reset_arl_limit(ip:str, limit_type:int):
    arl:APIRateLimit = get_arls(ip=ip, limit_type=limit_type).first()
    if not arl:
        return core_msg.ServerCode.General.something_wrong

    arl.requests = 0
    arl.stat = APIRateLimitStat.ACCESS

    cleaneril_db.session.commit()
    return core_msg.ServerCode.success



def is_limit_for_otp(ip:str):
    arl:APIRateLimit|None = get_arls(ip=ip, limit_type=APIRateLimitTypes.OTP).first()
    if not arl:return False

    return bool(arl.stat&APIRateLimitStat.DENIED) and arl.cooldown > time.time()


def get_cooldown_time(ip: str, limit_type: int):
    arl: APIRateLimit | None = get_arls(ip=ip, limit_type=limit_type).first()
    if not arl:
        return 0.0

    return max(0.0, arl.cooldown-time.time())


def get_cooldown_min_sec_str(ip: str, limit_type: int):
    remaining = int(get_cooldown_time(ip, limit_type))
    minutes = remaining // 60
    seconds = remaining % 60

    return f"{minutes:02d}:{seconds:02d}"