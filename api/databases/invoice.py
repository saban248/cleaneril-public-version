import json
import time
from datetime import datetime

from api.databases import orders
from api.databases.bridge import get_order_items, get_client_total_price, \
    get_client_off_price
from api.databases.general import get_columns, get_column_no_instance
from api.databases.orders import CleanOrder
from api.databases.ptc import cleaneril_db
from api.ptc import generate_hex
from api.routes.ptc import PaymentInvoice, InvoiceStatType, InvoiceAboutDeleted
from api.validator import core_msg


class Receipt(cleaneril_db.Model):
    __tablename__ = "receipts"
    key = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, primary_key=True)
    receipt_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    manager_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    client_id   = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    order_id = cleaneril_db.Column(cleaneril_db.String(16), nullable=False)
    date = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    payment_type = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    is_vat = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False, default=False)
    is_credit = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False, default=False)
    credit_flag = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, default=0)
    stat = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    data = cleaneril_db.Column(cleaneril_db.JSON, nullable=False)


def get_receipts(source:bool = True, **kwargs):
    return get_columns(Receipt, source, **kwargs)

def create_receipt(manager_id:str, client_id:str, order_id:str, stat:int, credit:bool, credit_flag:InvoiceAboutDeleted,
                   force:bool = False):
    # check
    if not client_id or not order_id:
        return core_msg.ServerCode.Receipt.receipt_create_problem
    receipt = get_receipts(manager_id=manager_id, client_id=client_id, order_id=order_id).first()
    if receipt and not force and credit:
        return core_msg.ServerCode.Receipt.receipt_exist
        # cleaneril_db.session.delete(receipt)
        # cleaneril_db.session.commit()

    order:CleanOrder = orders.get_clean_orders(manager_id=manager_id, client_id=client_id, order_id=order_id).first()
    receipt = Receipt()
    receipt.manager_id = manager_id
    receipt.client_id = client_id
    receipt.order_id = order_id
    receipt.receipt_id = generate_hex(15)
    receipt.date = time.time()
    receipt.stat = stat
    receipt.is_vat = order.vat
    receipt.is_credit =  credit
    receipt.credit_flag = credit_flag
    receipt.payment_type = order.payment_type
    receipt.data = get_column_no_instance(order)
    cleaneril_db.session.add(receipt)
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success


def delete_receipt(manager_id:str, receipt_id:str):
    receipt = get_receipts(manager_id=manager_id, receipt_id=receipt_id).first()
    if not receipt:
        return core_msg.ServerCode.General.something_wrong
    cleaneril_db.session.delete(receipt)
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success



def get_receipts_by_date(manager_id:str, df:float, dt:float, dti:bool =True,  **kwargs):
    """

    :param dti: date to include
    :param manager_id:
    :param df: date from
    :param dt: date to
    :param kwargs:
    :return:
    """
    _receipts =  (
        Receipt.query
        .filter(
            Receipt.manager_id == manager_id,
            Receipt.date >= df,
            Receipt.date <= dt if dti else Receipt.date < dt
        ))
    if kwargs:
        _receipts = _receipts.filter_by(**kwargs)

    return _receipts.all()
