import time
from typing import Union

from api.databases import orders, clients
from api.databases.orders import CleanOrder
from api.databases.ptc import StateOrder, cleaneril, cleaneril_db
from api.jfunc import clean_phone_just_numbers
from api.routes import cil_struct
from api.validator import core_msg
from api.validator import general


def validate_share_order_marketplace(manager_id:str, stm:Union[cil_struct.ShareJob, cil_struct.CleanOrder]):
    if isinstance(stm, cil_struct.ShareJob):
        if not general.is_integer(stm.fee):
            return core_msg.ServerCode.General.invalid_int_value

    order:CleanOrder = orders.get_clean_orders(manager_id=manager_id, order_id=stm.oi).first()
    if not order:
        return core_msg.ServerCode.General.something_wrong

    if order.stat != StateOrder.CLOSED:
        return core_msg.ServerCode.Marketplace.share_order_stat_invalid
    if order.items.__len__() == 0:
        return core_msg.ServerCode.Marketplace.share_order_items_invalid
    if not clean_phone_just_numbers(order.phone):
        return core_msg.ServerCode.Marketplace.share_order_noclient
    client = clients.get_clients(manager_id=manager_id, client_id=order.client_id).first()
    if not client:
        return core_msg.ServerCode.Marketplace.share_order_noclient

    if order.price <= 0:
        return core_msg.ServerCode.Marketplace.share_order_nomoney
    if order.marketplace_shared:
        return core_msg.ServerCode.Marketplace.already_order_share
    if order.date <= time.time():
        return core_msg.ServerCode.Marketplace.date_share_job_invalid
    return core_msg.ServerCode.success




