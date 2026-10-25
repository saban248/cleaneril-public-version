import json
import os
import sqlite3
from dataclasses import dataclass

from api.databases import orders, clients, company
from api.databases.clients import ClientProfile
from api.databases.employee import ApiEmployee, unknown
from api.databases.manager import ApiManager
from api.databases.marketplace import jobs
from api.databases.orders import CleanOrder
from api.databases.ptc import cleaneril_db, ServerConfig, ManagerPermissions
from api.jfunc import clean_phone_just_numbers, match_nums_words
from api.marketplace.ptc import JobMarketplaceState
from api.routes import cil_struct
from api.routes.ptc import CleanOrderType, PaymentInvoice, RegisterApi
from api.validator import core_msg


def set_employee_to_client(wid:str, mid:str):
    employee = ApiEmployee.get_employees(employee_id=wid).first()
    if not employee:
        return mid

    return wid


def get_order_date_arrive(cid):
    order = orders.get_clean_orders(client_id=cid).first()
    if not order:
        return 0

    return order.date


def get_order_items(cid):
    order:CleanOrder = orders.get_clean_orders(client_id=cid).first()
    if not order:
        return str()

    return order.items


def get_client_total_price(cid):
    order: CleanOrder = orders.get_clean_orders(client_id=cid).first()
    if not order:
        return 0

    return order.price


def get_client_off_price(cid):
    order: CleanOrder = orders.get_clean_orders(client_id=cid).first()
    if not order:
        return 0

    return order.off_price


def on_create_order_create_client(order:CleanOrder):
    if not order:return
    client:ClientProfile = None
    for c in clients.get_clients().all():
        phone = clean_phone_just_numbers(c.phone) == clean_phone_just_numbers(order.phone)
        if phone:
            client = c
            break
    if not client:
        new_client = clients.create_client_profile(order.manager_id, order.fullname,order.address,order.phone,unknown, order.coordinates)
        order.client_id = new_client.client_id
    else:
        order.client_id = client.client_id
    cleaneril_db.session.commit()

    return client


def fix_order_to_client():
    ...


@dataclass
class PovDetails:
    company_name: str = str()
    company_phone:str = str()
    stat:int          = -1
    date:float          = 0.0



def get_pov_details_response(order:CleanOrder) -> PovDetails:
    pov_details = PovDetails()
    _company = company.get_companies(manager_id=order.manager_id).first()
    if not _company:return pov_details
    _manager = ApiManager.get_managers(manager_id=order.manager_id).first()
    if not _manager:return pov_details
    pov_details.company_name = _company.company_name
    pov_details.company_phone = _company.company_phone
    pov_details.stat = order.stat
    pov_details.date = order.date

    return pov_details


def do_delete_clean_order(mid:str, order_id:str):
    order:orders.CleanOrder = orders.get_clean_orders(manager_id=mid, order_id=order_id).first()
    if not order or order.deleted:return core_msg.ServerCode.General.something_wrong
    if order.marketplace_shared:
        job = jobs.get_jobs(from_manager=order.manager_id, order_id=order.order_id).first()
        if job:
            if job.state & (JobMarketplaceState.DONE|JobMarketplaceState.ESTABLISHED):
                return core_msg.ServerCode.Marketplace.order_share_done
            stat = jobs.delete_job_forever(job.order_id)
            if stat:return stat
    stat = orders.delete_clean_order(mid, order_id)
    return stat


def delete_job_marketplace_forever(order_id:str):
    order = orders.get_clean_orders(order_id=order_id).first()
    if not order:return core_msg.ServerCode.General.something_wrong
    job:jobs.Job = jobs.get_jobs(from_manager=order.manager_id, order_id=order_id).first()
    if not job: return core_msg.ServerCode.General.something_wrong
    if job.state & (JobMarketplaceState.DONE|JobMarketplaceState.ESTABLISHED):
        return core_msg.ServerCode.Marketplace.order_share_done

    stat = jobs.delete_job_forever(order.order_id)
    if stat:return stat

    order.marketplace_shared = False
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success



def allow_edit_clean_order(manager_id:str, order_id:str):
    order = orders.get_clean_orders(manager_id=manager_id, order_id=order_id).first()
    if not order:return core_msg.ServerCode.General.something_wrong
    if order.marketplace_shared:
        return core_msg.ServerCode.Marketplace.cant_edit_order

    return core_msg.ServerCode.success


def get_clean_orders(manager_id: str):
    _orders = CleanOrder.query.filter(
        CleanOrder.manager_id == manager_id,
        CleanOrder.deleted.isnot(True)
    ).all()

    _jobs = jobs.Job.query.filter(
        jobs.Job.to_manager == manager_id,
        jobs.Job.state.in_([
            JobMarketplaceState.ESTABLISHED,
            JobMarketplaceState.DONE
        ])
    ).all()

    for job in _jobs:
        o = orders.get_clean_orders(
            order_id=job.order_id, manager_id=job.from_manager,marketplace_shared=True,
        )
        if o:
            _orders+= o

    return sorted(
        _orders,
        key=lambda order: order.date,
        reverse=True
    )


def get_clean_order(manager_id:str, order_id:str):
    order = orders.CleanOrder.query.filter(orders.CleanOrder.manager_id == manager_id,
                                           orders.CleanOrder.order_id == order_id,
                                           orders.CleanOrder.deleted.isnot(True)).first()
    if not order:
        job = jobs.Job.query.filter(jobs.Job.to_manager == manager_id,
                                      jobs.Job.state.in_([JobMarketplaceState.DONE, JobMarketplaceState.ESTABLISHED]),
                                      jobs.Job.order_id == order_id).first()
        return orders.get_clean_orders(manager_id=jobs.Job.from_manager, order_id=job.order_id).first()
    return order