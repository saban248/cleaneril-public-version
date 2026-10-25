import datetime
import json
import os
import time
from dataclasses import dataclass

from api.data.ptc import get_month_range_by_ym
from api.databases.general import unknown
from api.databases.ptc import StateOrder, ServerConfig
from api.routes.ptc import CalenderClients, ClientLeadFrom, CleanOrderType, PaymentInvoice, InvoiceAboutDeleted


def struct_builder(cls, **data):
    for k, v in data.items():
        if k in cls.__dict__:
            setattr(cls, k, v)

@dataclass
class Auth:
    # phone / ID
    phone:str        = None
    password:str        = None

    def build(self, **data):
        struct_builder(self, **data)
        return self



class Dashboard:
    s:int               = None
    c:int               = None

    def build(self, **data):
        state:str = data.get("s", 0)
        calender:str = data.get("c", 0)

        if not state or not state.isdigit():self.s = StateOrder.ALL
        else:self.s = int(state)
        if not calender or not calender.isdigit():self.c = CalenderClients.FOREVER
        else:self.c = int(calender)
        if not self.s:self.s = StateOrder.ALL
        return self

@dataclass
class CardEditor:
    action:int      = None
    ci:str          = None
    ct:str          = None
    wt:str          = None
    o:bool          = None
    op:int          = None
    imp:str         = None
    desc:str        = None
    wtl:str         = None
    phone:str       = None
    def build(self, **data):
        struct_builder(self, **data)
        self.o = bool(self.o)
        if not self.desc:
            self.desc = "unknown"
        if not self.imp:
            self.imp = ServerConfig.DEFAULT_IMAGE_CARD
        else:
            self.imp = os.path.join(ServerConfig.FOLDER_IMAGE_BA, self.imp)
        if not self.wt:
            self.wt = ServerConfig.DEFAULT_WHATSAPP_MSG
        if not self.phone:
            self.phone = ServerConfig.DEFAULT_PHONE
        if self.o:
            self.wt = f'{self.wt} כולל {self.op}% הנחה '
        self.wtl = ServerConfig.WHATSAPP_LINK.format(phone=self.phone,
                                                             text=self.wt)

        return self

@dataclass
class ListOrders:
    fromY:int           = None
    toY:int             = None

    def build(self, **data):
        struct_builder(self, **data)
        default_year = datetime.datetime.now().year
        if not self.fromY:
            self.fromY = default_year-2
        else:
            self.fromY = int(self.fromY)
        if not self.toY:
            self.toY = default_year+1
        else:
            self.toY = int(self.toY)

        return self


@dataclass
class Client:
    cid:str       = None

    def build(self, **data):
        struct_builder(self, **data)
        return self


@dataclass
class CleanOrder:
    client_id:str           = None
    oi:str              = None
    koi:int             = None

    s:StateOrder       = None
    phone:str               = None
    o:bool              = None
    op:int              = None
    fn:str              = None
    address:str          = None
    i:list               = None
    lf:int              = None
    date:float          = None
    notes:str           = None
    price:int           = None
    vat:bool            = None
    ex:float       = None
    workers:list      = None
    ps:int          = None
    coordinate:list      = None
    a_coordinate:list   = None
    area_name:str = None
    pt:int          = None
    pn:str          = None
    ot:int          = None
    mid:str         = None
    def build(self, **data):
        _none_coordinates = [32.18, 34.87]
        _none_area_name = 'Isreal'
        struct_builder(self, **data)
        self.o = bool(self.o)
        self.vat = bool(self.vat)
        if not self.client_id:
            self.client_id = 0
        if self.s:
            self.s = int(self.s)
        else:
            self.s = StateOrder.WAIT
        if self.op:
            self.op = int(self.op)
        else:
            self.op = 0
        if self.price:
            self.price = int(float(self.price))
        else:
            self.price = 0
        if self.lf:
            self.lf = int(self.lf)
        else:
            self.lf = ClientLeadFrom.WHATSAPP
        if self.date:
            self.date = float(self.date)
        else:
            self.date = time.time()
        if self.i:
            self.i = json.loads(self.i)
        else:
            self.i = {}
        if self.ex:
            self.ex = float(self.ex)
        else:
            self.ex = 0
        if self.ps:
            self.ps = int(self.ps)
        else:
            self.ps = 0
        if not self.coordinate:
            self.coordinate = _none_coordinates
        if not self.a_coordinate:
            self.a_coordinate = _none_coordinates
        if not self.area_name:
            self.area_name = _none_area_name
        if not self.pt:
            self.pt = PaymentInvoice.CASH
        else:
            self.pt = int(self.pt)
        if not self.pn:
            self.pn = str()
        if self.ot:
            self.ot = int(self.ot)
        else:
            self.ot = CleanOrderType.GENERAL
        if not self.address:
            self.address = unknown
        if not self.notes:
            self.notes = unknown
        if not self.fn:
            self.fn = unknown
        if not self.phone:
            self.phone = unknown
        if not self.workers:
            self.workers = []
        self.get_full_price()
        return self

    def get_full_price(self):
        if not self.price or not self.i:return
        price = 0
        for key, value in self.i.items():
            price += int(value['price'])

        self.price = price


@dataclass
class Reports:
    rAction:int = None
    year:int        = None
    df:float        = None
    dt:float        = None

    def build(self, **data):
        struct_builder(self, **data)
        if self.year:
            self.year = int(self.year)
        else:
            self.year = datetime.datetime.now().year


        return self


@dataclass
class AccountAppSettings:
    #company
    c_name:str        = None
    c_desc:str        = None
    c_name_owner:str      = None
    c_email:str     = None
    c_vat:int      = None
    c_vat_code:int      = None
    c_phone:str     = None
    c_owner_phone:str     = None
    c_gpse:int      = None
    # show vat code in order
    c_show_vcio:bool = None

    def build(self, **data):
        struct_builder(self,**data)

        if self.c_vat is not None:
            self.c_vat = self.c_vat
        if self.c_vat_code:
            self.c_vat_code = int(self.c_vat_code)
        if self.c_gpse:
            self.c_gpse = int(self.c_gpse)
        return self


@dataclass
class Employee:
    e_name:str          = None
    e_pwd:str           = None
    e_phone:str         = None
    e_idc:str           = None
    wid:str             = None
    ps:int              = None
    pvat:bool           = None
    permission:int      = None

    def build(self, **data):
        struct_builder(self, **data)
        if self.permission:
            self.permission = int(self.permission)
        if self.ps:
            self.ps = int(self.ps)
        if self.pvat is not None:
            self.pvat = bool(self.pvat)
        return self


@dataclass
class Calendar:
    df:float          = None
    dt:float          = None

    def build(self, **date):
        struct_builder(self, **date)
        now = datetime.datetime.now(datetime.timezone.utc)
        s,e = get_month_range_by_ym(now.year, now.month)
        if not self.df:
            self.df =s
        if not self.dt:
            self.dt = e
        return self


@dataclass
class Register:
    username:str        = None
    password:str        = None
    xCSRF:str           = None
    c_name:str          = None
    c_desc:str          = None
    c_phone:str         = None
    o_phone:str         = None
    o_name:str          = None
    c_email:str         = None
    vat_code:str        = None
    # subscription
    sub_plan:int        = None
    sub_type:int        = None
    otpcode:int         = None
    

    def build(self, **data):
        struct_builder(self, **data)
        if self.otpcode:
            self.otpcode = int(self.otpcode)
        return self


@dataclass
class Invoice:
    iid:str             = None
    cid:str             = None
    oid:str             = None
    stat:int            = None
    force:bool          = None
    is_c:bool           = None
    cf:InvoiceAboutDeleted = None

    def build(self, **data):
        struct_builder(self, **data)
        if not self.cf: self.cf = 0
        if self.is_c is None:self.is_c = False
        return self


@dataclass
class ReportsDataAnalyze:
    # income_ever
    ie:int             = None
    # expense_ever
    ee:int            = None
    # income
    i:int                  = None
    # expense
    e:int                 = None
    # orders_done_count_ever
    odce:int       = None
    # orders_done_count
    odc:int            = None
    # orders_canceled_count_ever
    occe:int   = None
    # orders_canceled_count
    occ:int        = None
    # average_income_orders_ever
    aioe:float   = None
    # average_income_orders
    aio:float        = None
    # average_expense_orders_ever
    aeoe:float  = None
    # average_expense_orders
    aeo:float       = None
    # count_items_clean_orders_ever
    cicoe:int       = None
    # count_items_clean_orders
    cico:int       = None
    # count_orders_done_ever
    code:int        = None
    # count_orders_done
    cod:int         = None
    # count client repeated ever
    ccre:int        = None
    # count client repeated
    ccr:int         = None
    graph_funds:list =  None
    graph_orders:list = None


@dataclass
class Subscription:
    manager_id:str = None
    asset:int       = None

    def build(self, **data):
        struct_builder(self, **data)
        return self


@dataclass
class PublicApi:
    oi:str = None
    key:int = None

    def build(self, **data):
        struct_builder(self, **data)
        if self.key is not None and str(self.key).isdigit():
            self.key = int(self.key)
        return self



@dataclass
class ClientHistory:
    hid:str     = None

    def build(self, **data):
        struct_builder(self, **data)
        return self



@dataclass
class ShareJob:
    expired:float   = None
    oi:str      = None
    fee:float   = None
    feet:int = None
    desc:str    = None
    tax:bool = None
    jid:str = None
    s:int = None
    mid:str = None
    rid:str = None

    def build(self, **data):
        struct_builder(self, **data)
        return self
