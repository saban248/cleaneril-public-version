import time
from dataclasses import dataclass, asdict

from sqlalchemy.orm import Query

from api.databases import orders, clients
from api.databases.general import get_columns
from api.databases.orders import CleanOrder
from api.databases.ptc import cleaneril_db
from api.ptc import generate_hex
from api.routes import cil_struct
from api.validator import core_msg


def create_history_id():
    # protocol
    return "CH"+generate_hex(14)



@dataclass
class HistoryChange:
    old:str|int     = None
    new:str|int = None
    database_key:str = None
    description:str = None
    reverse:bool = False

def create_history_order_changed(mid: str, order: cil_struct.CleanOrder):
    hcs: list[dict] = []
    old_order: CleanOrder = orders.get_clean_orders(manager_id=mid, order_id=order.oi).first()
    if not old_order:
        return hcs

    def add_change(database_key, description, old, new):
        if old != new:
            hcs.append(asdict(HistoryChange(old, new, database_key, description, True)))

    add_change("stat", "סטטוס הזמנה", old_order.stat, order.s)
    add_change("price", "מחיר", old_order.price, order.price)
    add_change("address", "כתובת", old_order.address, order.address)
    add_change("items", "פריטי הזמנה", old_order.items, order.i)
    add_change("date", "תאריך", old_order.date, order.date)
    add_change("fullname", "שם לקוח", old_order.fullname, order.fn)
    add_change("off_price", "הנחה", old_order.off_price, order.op)
    add_change("payment_type", "סוג תשלום", old_order.payment_type, order.pt)
    add_change("workers", "שיוך עובד", old_order.workers, order.workers)

    return hcs

def create_history_desc(description:str) -> list:
    return [asdict(HistoryChange(str(),str(),str(),description, False))]

class ClientHistory(cleaneril_db.Model):
    __tablename__ = "client_history"
    key = cleaneril_db.Column(cleaneril_db.Integer, primary_key=True)
    manager_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    client_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    history_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    order_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    entity = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    action = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    data = cleaneril_db.Column(cleaneril_db.JSON, nullable=False)
    created_at = cleaneril_db.Column(cleaneril_db.Float, nullable=False)


def create_history(mid:str, cid:str, oid:str, entity:int = 0, action:int = 0, data:list[HistoryChange] = None):
    history = ClientHistory()
    client = clients.get_clients(manager_id=mid, client_id=cid).first()
    if not client:return core_msg.ServerCode.General.something_wrong
    history.history_id = create_history_id()
    history.manager_id = mid
    history.client_id = cid
    history.order_id = oid
    history.entity = entity
    history.action = action
    history.data = data if data is not None else []
    history.created_at = time.time()
    cleaneril_db.session.add(history)
    cleaneril_db.session.commit()

    return core_msg.ServerCode.success


def get_histories(source:bool = True, **kwargs):
    history = get_columns(ClientHistory, source, **kwargs)
    if isinstance(history, Query):
        if not history:return history
        return history.order_by(ClientHistory.key.desc())
    history.reverse()
    return history


def delete_client_history(mid:str, client_id:str):
    histories = get_histories(manager_id=mid, client_id=client_id).all()
    if not histories:return core_msg.ServerCode.General.something_wrong

    for history in histories:
        cleaneril_db.session.delete(history)
        cleaneril_db.session.commit()

    return core_msg.ServerCode.success


def delete_history(mid:str, history_id:str):
    history:ClientHistory = get_histories(manager_id=mid, history_id=history_id).first()
    if not history:return core_msg.ServerCode.General.something_wrong
    cleaneril_db.session.delete(history)
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success


def restore_history(mid:str, history_id:str):
    history:ClientHistory = get_histories(manager_id=mid, history_id=history_id).first()
    if not history:return core_msg.ServerCode.General.something_wrong
    order:CleanOrder = orders.get_clean_orders(manager_id=mid, order_id=history.order_id, client_id=history.client_id).first()
    for hc in history.data:
        current = HistoryChange(**hc)
        if not current.reverse:continue
        setattr(order, current.database_key, current.old)
        cleaneril_db.session.commit()

    stat = delete_history(mid, history_id)
    return stat or core_msg.ServerCode.success


