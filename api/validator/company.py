import re

from api.validator import core_msg


def username(u: str) -> int:
    __error__ = core_msg.ServerCode.Register.invalid_username
    __success__ = core_msg.ServerCode.success
    if not u or " " in u:
        return __error__
    u = u.strip()

    if not u.isalnum() or u.isdigit():
        return __error__

    if not len(u) >= 3:
        return __error__

    return __success__

def company_name(n):
    n = re.sub(r'\s+', ' ', n)
    if all(ord(c) < 128 for c in n):
        n = " ".join(word.capitalize() for word in n.split(" "))

    names = re.split(r"\s+", n)
    if len(names) > 2:
        return core_msg.ServerCode.Company.short_company_name
    return core_msg.ServerCode.success


def phone(p):
    pr = r"^(05\d{8}|0[2-9]\d{7})$"
    if not re.match(pr, p):
        return core_msg.ServerCode.General.invalid_phone

    return core_msg.ServerCode.success

def normalize_phone(p: str) -> str:
    p = p.replace("+", "").replace(" ", "")

    if p.startswith("972"):
        p = "0" + p[3:]

    return p


def description(desc):
    dw = re.split(r"\s+", desc)
    if len(dw) < 3 or len(dw) > 4:
        return core_msg.ServerCode.Company.i_company_description

    return core_msg.ServerCode.success


def password(pwd:str):
    __error__ = core_msg.ServerCode.General.invalid_passwd
    if not pwd or len(pwd) < 6 or not re.match(r'^[A-Za-z0-9!@#$%^&*()_\-+=\[\]{};:,.<>?]+$', pwd):
        return __error__

    if not re.search(r'[\d!@#$%^&*()_\-+=\[\]{};:,.<>?]', pwd):
        return __error__

    return core_msg.ServerCode.success

def ownername(n):
    __error__ = core_msg.ServerCode.Company.i_owner_name
    if not n:
        return __error__

    if not re.fullmatch(r'[\u0590-\u05FF]+( [\u0590-\u05FF]+)+', n):
        return __error__

    return core_msg.ServerCode.success



def is_valid_israeli_id(id_number:str) -> int:
    __error__ = core_msg.ServerCode.Company.i_vat_code
    if not id_number or (id_number and not id_number.isdigit()):
        return __error__

    id_number = id_number.zfill(9)  # השלמה ל-9 ספרות
    total = 0
    for i, digit in enumerate(id_number):
        num = int(digit) * (1 if i % 2 == 0 else 2)
        if num > 9:
            num -= 9
        total += num

    return __error__ if not total % 10 == 0 else core_msg.ServerCode.success

