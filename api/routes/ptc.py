import datetime
import json
import os.path
import time
from dataclasses import dataclass
from enum import Enum, IntFlag, IntEnum

from api.databases.general import unknown
from api.databases.ptc import ServerConfig, StateOrder



class ClientLeadFrom(IntFlag):
    TIKTOK          = 1<<0
    INSTEGRAM       = 1<<1
    FACEBOOK        = 1<<2
    GOOGLE          = 1<<3
    WHATSAPP        = 1<<4
    FRIENDS         = 1<<5


class CleanOrderType(IntFlag):
    UPHOLSTERY        = 1 << 0   # ריפודים
    AIR_CONDITIONER   = 1 << 1   # ניקוי מזגנים
    WINDOWS           = 1 << 2   # ניקוי חלונות
    CARPET            = 1 << 3   # ניקוי שטיחים
    MATTRESS          = 1 << 4   # ניקוי מזרנים
    CURTAINS          = 1 << 5   # ניקוי וילונות
    TILES             = 1 << 6   # ניקוי רצפות / קרצוף
    POLISH            = 1 << 7   # פוליש
    PRESSURE_WASH     = 1 << 8   # שטיפה בלחץ
    SOLAR_PANELS      = 1 << 9   # ניקוי פאנלים סולאריים
    OFFICE            = 1 << 10  # ניקיון משרדים
    HOUSE             = 1 << 11  # ניקיון בתים
    POST_RENOVATION   = 1 << 12  # ניקיון אחרי שיפוץ

    # Mask
    GENERAL = (
        UPHOLSTERY
        | AIR_CONDITIONER
        | WINDOWS
        | CARPET
        | MATTRESS
        | CURTAINS
        | TILES
        | POLISH
        | PRESSURE_WASH
        | SOLAR_PANELS
        | OFFICE
        | HOUSE
        | POST_RENOVATION
    )


class CalenderClients(IntFlag):
    TOMORROW        = 1<<0
    DAY             = 1<<1
    WEEK            = 1<<2
    DWEEK           = 1<<3
    MONTH           = 1<<4
    FOREVER         = 1<<5


class SubscriptionType(IntFlag):
    MONTHLY            = 1<<0
    YEARLY             = 1<<1


class UserAccountSubscription(IntFlag):
    FREE                = 1<<0
    PREMIUM             = 1<<1


class SubscriptionStat(IntFlag):
    INACTIVE            = 1<<0
    ACTIVE              = 1<<1
    EXPIRED             = 1<<2

class PaymentInvoice(IntFlag):
    BANK_TRANSFER = 1<<0
    CASH          = 1<<1
    CHECK         = 1<<2
    OTHER         = 1<<3


class InvoiceStatType(IntFlag):
    DRAFT           = 1<<0
    PAID            = 1<<1


class InvoiceAboutDeleted(IntFlag):
    CANCELED        = 1<<0
    REFUND          = 1<<1
    MISSINFO        = 1<<2


def get_calender_client(cc:int):
    __day__ = 3600 * 24
    match cc:
        case CalenderClients.DAY:
            return __day__
        case CalenderClients.WEEK:
            return __day__ * 7
        case CalenderClients.DWEEK:
            return __day__ * 14
        case CalenderClients.MONTH:
            return __day__*31
        case CalenderClients.FOREVER:
            return float("inf")
    return 0


class ApiUploadFile(IntFlag):
    CARD            = 1<<0
    LOGO            = 1<<1


def is_bwt_date(client_date:float, cc:int):
    t = time.time() - client_date
    if CalenderClients.FOREVER&cc:return True
    if CalenderClients.TOMORROW&cc:
        return 0 <= client_date-time.time() < (3600*24)
    if t<0:return False

    return t<=get_calender_client(cc)


class RoutePagesBase(Enum):

    @property
    def code(self):
        return super().value

    @property
    def path(self):
        return f"/{super().name}"


class RoutePages(RoutePagesBase):

    home = 1<<0
    auth = 1<<1
    dashboard = 1<<2
    create_account = 1<<3
    terms = 1<<4
    subscription = 1<<5
    pov = 1<<6
    public = 1<<7

class PublicPage:
    client_order_view = 1

class RouteApi(RoutePagesBase):
    do_auth = 1<<0
    api     = 1<<1
    up_image = 1<<2
    register = 1<<3
    logout   = 1<<4
    subscription = 1<<5
    marketplace = 1<<6
    integrations = 1<<7
    integrations_callback = integrations|(1<<8)
    papi = 1<<9
    orders= 1<<10


class RegisterApi(IntFlag):
    level0 = 1<<5
    level1 = 1<<0
    level2 = 1<<1
    level3 = 1<<2
    level4 = 1<<3
    level5 = 1<<6
    DONE    = 1<<4

class SubscriptionApi:
    m_delete = 1<<0
    m_active = 1<<1
    m_pause  = 1<<2
    m_pending = 1<<3
    m_banned = 1<<4
    manager_template = 1<<5
    manager_workers = 1<<6
    approve_assets = 1<<7
    list_subscriptions = 1<<8
    create_premium  = 1<<9



class Pages(IntFlag):
    home = 1
    auth = 2
    dashboard = 3
    register = 4
    terms =5
    invoice = 6
    manager =7
    subscription = 8
    pov = 9

    def __str__(self):
        return self.__repr__()
    @property
    def __root__(self):
        return self.name+"/"

    @property
    def md(self):
        return self.__root__+self.name+".md"
    @property
    def html(self):
        return self.__root__+self.name+'.html'

    @property
    def html2(self):
        return self.name+'.html'

    @property
    def js(self):
        return self.__root__+self.name+".js"
    @property
    def css(self):
        return self.__root__+self.name+".css"
    @property
    def path(self):
        return self.__root__

    @property
    def ashthml(self):
        return self.path+'.html'

    @property
    def f_dashboard(self):
        return os.path.join(f'{self.dashboard.path}', self.html)


    def __truediv__(self, other):
        first = str()
        second = str()
        if not isinstance(self, str):
            first = self.name
        if not isinstance(other, str):
            second = other.name

        return os.path.join(first, second)

class PublicApiCall(IntFlag):
    clean_order_verify = 1
    view_clean_order = 2


class ApiCall(IntEnum):
    card_editor = 1
    card_draft = 2
    card_delete = 3
    card_save = 4
    order_edit = 5
    order_delete = 6
    order_save = 7
    client_view = 8
    api_reports = 10
    manager_settings = 11
    order_workers = 12
    worker_editor = 13
    worker_view = 14
    worker_save = 15
    worker_delete = 16
    calendar = 17
    orders_list = 18
    invoice_view = 19
    invoice_create = 20
    invoice_list = 21
    order_view = 22
    order_new = 23
    list_clients = 24
    invoice_delete = 25
    permissions = 26
    list_managers = 27
    list_companies = 28
    alive = 29
    my_subscription = 30
    my_company = 31
    my_manager = 32
    duplicate_clean_order = 33
    client_reports = 34
    list_orders_deleted = 35
    order_restore = 36
    history_delete = 37
    history_restore = 38
    share_order_marketplace = 39



class ReportsApi(IntFlag):
    funds = 1<<0
    orders = 1<<1
    graph_funds = 1<<2
    graph_orders = 1<<3








