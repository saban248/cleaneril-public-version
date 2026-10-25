import json
import re
import time
from datetime import datetime
from zoneinfo import ZoneInfo

from api.databases.employee import Employee
from api.databases.ptc import StateOrder, cleaneril, ManagerPermissions
from api.routes.cil_struct import Invoice
from api.routes.ptc import PaymentInvoice, InvoiceAboutDeleted, CleanOrderType
from api.databases.ptc import ServerConfig


# jinja functions
@cleaneril.template_filter("to_dict")
def fromjson(value):
    return json.loads(value)

@cleaneril.template_filter("cda")
def client_date_arrive(ts):
    return datetime.fromtimestamp(ts).strftime("%d.%m.%Y")

@cleaneril.template_filter("cdar")
def client_date_arrive(ts):
    if not ts:
        ts = time.time()
    ts = float(ts)
    if ts > 1e12:
        ts /= 1000

    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d")

@cleaneril.template_filter("cdah")
def order_date_arrive_hour(ts):
    ts = float(ts)
    if ts > 1e12:
        ts /= 1000

    return datetime.fromtimestamp(ts, ZoneInfo("Asia/Jerusalem")).strftime("%H:%M")

@cleaneril.template_filter("jrt")
def json_roundtrip(obj):
    return json.loads(obj).items()


@cleaneril.template_filter("ctime")
def get_ctime_from_time(ctime:float):
    return time.ctime(ctime)

@cleaneril.template_filter("cft")
def client_flag_text(flag):
    match flag:
        case StateOrder.WAIT:
            return "לא נסגר"
        case StateOrder.CANCELED:
            return "בוטל"
        case StateOrder.CLOSED:
            return "בהמתנה"
        case StateOrder.DONE:
            return "הושלם"

@cleaneril.template_filter("eper")
def employee_permission(employee:Employee, flag:int):
    return flag & employee.permission

@cleaneril.template_filter("pft")
def permission_flag_text(flag):
    match flag:
        case ManagerPermissions.VIEW:
            return "צפייה"
        case ManagerPermissions.EDIT:
            return "עריכה"
        case ManagerPermissions.ADMIN:
            return "ניהול"

    return "unknown"

@cleaneril.template_filter("pft")
def payment_type_text(flag):
    match flag:
        case PaymentInvoice.CASH:
            return "מזומן"
        case PaymentInvoice.BANK_TRANSFER:
            return "העברה בנקאית"
        case PaymentInvoice.CHECK:
            return "צ'יק"
        case PaymentInvoice.OTHER:
            return "אחר \ לא צוין"

    return payment_type_text(PaymentInvoice.OTHER)

@cleaneril.template_filter("vatop")
def vat_of_price(price):
    return float(f'{price+ price*(ServerConfig.VAT_IL/100):.2f}')

@cleaneril.template_filter("vatoponly")
def vat_of_price_only(price):
    return float(f'{price*(ServerConfig.VAT_IL/100):.2f}')

@cleaneril.template_filter("zfill4")
def zfill_number(number):
    return str(number).zfill(4)


@cleaneril.template_filter("iad")
def invoice_about_deleted(flag):
    match flag:
        case InvoiceAboutDeleted.CANCELED:
            return "עיסקה בוטלה"
        case InvoiceAboutDeleted.REFUND:
            return "החזר כספי"
        case InvoiceAboutDeleted.MISSINFO:
            return "פרטים קבלה שגויים"

    return 'לא צויין'

@cleaneril.template_filter("tcot")
def title_clean_order_type(flag):
    match flag:
        case CleanOrderType.UPHOLSTERY:
            return "הזמנת ניקוי ריפודים"
        case CleanOrderType.AIR_CONDITIONER:
            return "הזמנת ניקוי מזגנים"
        case CleanOrderType.WINDOWS:
            return "הזמנת ניקוי חלונות"
        case CleanOrderType.CARPET:
            return "הזמנת ניקוי שטיחים"
        case CleanOrderType.MATTRESS:
            return "הזמנת ניקוי מזרנים"
        case CleanOrderType.CURTAINS:
            return "הזמנת ניקוי וילונות"
        case CleanOrderType.TILES:
            return "הזמנת ניקוי רצפות"
        case CleanOrderType.POLISH:
            return "הזמנת פוליש"
        case CleanOrderType.PRESSURE_WASH:
            return "הזמנת שטיפה בלחץ"
        case CleanOrderType.SOLAR_PANELS:
            return "הזמנת ניקוי פאנלים סולאריים"
        case CleanOrderType.OFFICE:
            return "הזמנת ניקוי משרדים"
        case CleanOrderType.HOUSE:
            return "הזמנת ניקוי בתים"
        case CleanOrderType.POST_RENOVATION:
            return "הזמנת ניקוי אחרי שיפוץ"
        case CleanOrderType.GENERAL:
            return "הזמנת ניקוי כללי"

    return title_clean_order_type(CleanOrderType.GENERAL)


def clean_phone_just_numbers(phone):
    if not phone:
        return ''

    phone = str(phone)
    phone = re.sub(r'[\u200E\u200F\u202A-\u202E]', '', phone)
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('9720'):
        digits = '0' + digits[4:]
    elif digits.startswith('972'):
        digits = '0' + digits[3:]

    return digits


def match_nums_words(nums, str1, str2):
    words1 = (str1 or '').lower().split()
    words2 = (str2 or '').lower().split()

    count = 0

    for w in words1:
        if w in words2:
            count += 1
            if count >= nums:
                return True

    return False

