import time

from sqlalchemy import JSON, inspect

from api.databases.general import get_columns, get_latest_columns, delete_column, get_columns_as_dict
from api.databases.ptc import cleaneril_db, StateOrder
from api.ptc import generate_hex
from api.validator import core_msg


class CleanOrder(cleaneril_db.Model):
    __tablename__ = "cleanOrder"
    key = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, primary_key=True)
    stat = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    client_id = cleaneril_db.Column(cleaneril_db.String(16), nullable=False)
    order_id = cleaneril_db.Column(cleaneril_db.String(16), nullable=False)
    manager_id = cleaneril_db.Column(cleaneril_db.String(16), nullable=False)
    date = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    items   = cleaneril_db.Column(JSON, nullable=False)
    address = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    fullname = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    phone = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    vat = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False)
    price = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    off_price = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    off = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False)
    lead_from = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    notes = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    timestamp_entered = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    expense = cleaneril_db.Column(cleaneril_db.Float, nullable=False, default=0.0)
    workers = cleaneril_db.Column(JSON, nullable=False)
    profit_sharing = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, default=0)
    coordinates = cleaneril_db.Column(JSON, nullable=False)
    area_coordinates = cleaneril_db.Column(cleaneril_db.JSON, nullable=False)
    area_name = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    payment_type = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    payment_notes = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    order_type = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    marketplace_shared = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False)
    date_done = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    deleted = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False, default=False)
    time_deleted = cleaneril_db.Column(cleaneril_db.Float, nullable=False)



def get_clean_orders(source:bool = True, deleted:bool = False, **kwargs):
    kwargs.update({"deleted":deleted})
    return get_columns(CleanOrder, source, **kwargs)


def get_clean_order(*args, **kwargs):
    order = get_clean_orders(*args, **kwargs)
    if order.__len__() != 1:
        return {}
    return order[0]


def get_clean_order_latest(source = True, deleted:bool = False, **kwargs):
    kwargs.update({"deleted": deleted})
    if source:
        return get_latest_columns(CleanOrder, source, lambda o:o.date, **kwargs)

    return get_latest_columns(CleanOrder, source, lambda o:o["date"], **kwargs)


def get_clean_order_by_date(manager_id:str, df:float, dt:float, dti:bool =True,  **kwargs):
    # [!] BYPASS
    """

    :param dti: date to include
    :param manager_id:
    :param df: date from
    :param dt: date to
    :param kwargs:
    :return:
    """
    _orders =  (
        CleanOrder.query
        .filter(
            CleanOrder.manager_id == manager_id if manager_id is not None else True,
            CleanOrder.date >= df,
            CleanOrder.date <= dt if dti else CleanOrder.date < dt
        ))
    if kwargs:
        _orders = _orders.filter_by(**kwargs)

    return _orders.all()


def get_clean_order_by_date_done(df:float, dt:float, dti:bool = True, **kwargs):
    _orders =CleanOrder.query.filter(
        CleanOrder.stat.in_([
            StateOrder.DONE,
            StateOrder.CANCELED
        ]),
        cleaneril_db.or_(
            cleaneril_db.and_(
                CleanOrder.stat == StateOrder.DONE,
                CleanOrder.date_done >= df,
                CleanOrder.date_done <= dt if dti else CleanOrder.date_done < dt
            ),
            cleaneril_db.and_(
                CleanOrder.stat == StateOrder.CANCELED,
                CleanOrder.date >= df,
                CleanOrder.date <= dt if dti else CleanOrder.date < dt
                )
            )
        )
    if kwargs:
        _orders = _orders.filter_by(**kwargs)

    return _orders.all()


def get_clean_order_by_stat(manager_id:str, *stat:StateOrder, **kwargs):
    _orders = (
        CleanOrder.query
        .filter(
            CleanOrder.manager_id == manager_id,
            CleanOrder.stat.in_([*stat])
        ))
    if kwargs:
        _orders = _orders.filter_by(**kwargs)

    return _orders.all()


def get_clean_order_done(manager_id:str):return get_clean_order_by_stat(manager_id, StateOrder.DONE)
def get_clean_order_canceled(manager_id:str):return get_clean_order_by_stat(manager_id, StateOrder.CANCELED)
def get_clean_order_wait(manager_id:str):return get_clean_order_by_stat(manager_id, StateOrder.WAIT)
def get_clean_order_closed(manager_id:str):return get_clean_order_by_stat(manager_id, StateOrder.CLOSED)

def get_clean_order_deleted(source:bool = True, mid:str = None, **kwargs):
    _orders = (
        CleanOrder.query
        .filter(
            CleanOrder.manager_id == mid,
            CleanOrder.deleted == True,
            CleanOrder.time_deleted >= (time.time() - (30 * 24 * 60 * 60)),
        ))
    if kwargs:
        _orders = _orders.filter_by(**kwargs)
    if source:
        return _orders
    return get_columns_as_dict(_orders)


def create_clean_order(manager_id:str, client_id:str, response, update:bool = False) -> CleanOrder:
    if update:
        order = get_clean_orders(manager_id=manager_id, order_id=response.oi).first()
        assert order
    else:
        order = CleanOrder()
        order.client_id = client_id
        order.order_id = generate_hex(10).lower()
        order.manager_id = manager_id

    order.stat = response.s
    order.date = response.date
    order.items = response.i
    order.address = response.address
    order.fullname = response.fn#TODO
    order.phone = response.phone#TODO
    order.vat = response.vat
    order.price = response.price
    order.off_price = response.op
    order.off = bool(response.op)
    order.lead_from = response.lf
    order.notes = response.notes
    order.timestamp_entered = time.time()
    order.expense = response.ex
    order.workers = response.workers
    order.profit_sharing = response.ps
    order.coordinates = response.coordinate
    order.area_coordinates = response.a_coordinate
    order.area_name = response.area_name
    order.payment_type = response.pt
    order.payment_notes = response.pn
    order.order_type = response.ot
    order.marketplace_shared = order.marketplace_shared if update else False
    order.date_done = time.time() if response.s == StateOrder.DONE else 0
    order.deleted = False
    order.time_deleted = 0

    cleaneril_db.session.add(order)
    cleaneril_db.session.commit()
    return order


def duplicate_clean_order(manager_id:str, client_id:str, order_id:str):
    original = get_clean_orders(manager_id=manager_id, client_id=client_id, order_id=order_id).first()
    if not original:
        return None


    copy = CleanOrder(**{ c.name: getattr(original, c.name) for c in CleanOrder.__table__.columns if c.name != "key"
                          and  c.name != 'order_id'})
    copy.order_id = generate_hex(10)
    copy.date = time.time()
    copy.marketplace_shared = False
    cleaneril_db.session.add(copy)
    cleaneril_db.session.commit()
    return copy



def update_clean_order(manager_id:str, client_id:str, response):

    return create_clean_order(manager_id, client_id, response, True)


def delete_clean_order(mid:str, order_id:str):
    order:CleanOrder = get_clean_orders(manager_id=mid, order_id=order_id).first()
    if not order:return core_msg.ServerCode.General.something_wrong
    order.deleted = True
    order.time_deleted = time.time()
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success

def restore_clean_order(mid:str, order_id:str):
    order:CleanOrder = get_clean_orders(manager_id=mid, order_id=order_id, deleted=True).first()
    if not order:return core_msg.ServerCode.General.something_wrong
    order.deleted = False
    order.time_deleted = 0
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success


class CountOfOrderByStat:
    DEFAULT_DF = 0
    DEFAULT_DT = None
    def __init__(self, date_from:float = DEFAULT_DF, date_to:float = DEFAULT_DT):
        self.__orders = get_clean_order_latest()
        self.__df = date_from
        self.__dt = date_to or time.time()

    def __sort(self, stat:int):
        return sorted(self.__orders, key=lambda order:order.stat&stat and self.__df<order.date<=self.__dt).__len__()

    @property
    def wait(self):return self.__sort(StateOrder.WAIT)
    @property
    def done(self):return self.__sort(StateOrder.DONE)
    @property
    def canceled(self):return self.__sort(StateOrder.CANCELED)
    @property
    def closed(self):return self.__sort(StateOrder.CLOSED)

