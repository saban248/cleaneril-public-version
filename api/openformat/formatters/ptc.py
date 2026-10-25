from decimal import Decimal
from datetime import datetime


def alpha(v, l):
    value = str(v or "")
    if len(value) > l:
        value = value[:l]
    return value.ljust(l)


def numeric(v, l):
    v = str(v or "0")
    if len(v) > l:
        v = v[:l]
    return v.rjust(l, "0")



def decimal_field(v, integer_length, decimal_length=2):
    v = Decimal(str(v or 0))
    sign = "+" if v >= 0 else "-"
    v = abs(v)
    scaled = int(v * (10 ** decimal_length))
    total_length = integer_length + decimal_length
    formatted = str(scaled).rjust(total_length, "0")

    return sign + formatted



def format_date(v):
    if isinstance(v, (int, float)):
        v = datetime.fromtimestamp(v)

    return v.strftime("%Y%m%d")


def format_time(v: datetime):
    return v.strftime("%H%M")