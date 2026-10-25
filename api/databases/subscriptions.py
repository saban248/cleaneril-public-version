import time

from api.databases.general import get_columns
from api.databases.ptc import cleaneril_db
from api.features.ptc import OrderFeature, WorkerFeature, InvoiceFeature, ReportsFeature
from api.ptc import generate_hex
from api.routes.ptc import SubscriptionType, SubscriptionStat, UserAccountSubscription
from api.validator import core_msg


class ManagerSubscription(cleaneril_db.Model):
    __tablename__ = "manager_subscription"

    key = cleaneril_db.Column(cleaneril_db.Integer, primary_key=True)
    manager_id = cleaneril_db.Column(cleaneril_db.String, nullable=False, index=True)
    company_id = cleaneril_db.Column(cleaneril_db.String, nullable=False, index=True)
    subscription_id = cleaneril_db.Column(cleaneril_db.String, nullable=False, index=True)
    subscription_plan = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, default=0)
    plan_type = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, default=1)
    status = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, default=1)
    time_created = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    time_start = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    time_end = cleaneril_db.Column(cleaneril_db.Float, nullable=True)
    auto_renew = cleaneril_db.Column(cleaneril_db.Boolean, default=False)
    last_payment_time = cleaneril_db.Column(cleaneril_db.Float)
    note = cleaneril_db.Column(cleaneril_db.String(500))
    
    order_features   = cleaneril_db.Column(cleaneril_db.BigInteger, default=0)
    worker_features  = cleaneril_db.Column(cleaneril_db.BigInteger, default=0)
    invoice_features = cleaneril_db.Column(cleaneril_db.BigInteger, default=0)
    reports_features = cleaneril_db.Column(cleaneril_db.BigInteger, default=0)


def get_subscriptions(source:bool = True, **kwargs):
    return get_columns(ManagerSubscription, source, **kwargs)


def create_manager_subscription(manager_id:str, company_id:str, plan_type:int = SubscriptionType.MONTHLY,
                                sub_plan:int = UserAccountSubscription.FREE, status:int = SubscriptionStat.INACTIVE):
    exist = get_subscriptions(manager_id=manager_id, company_id=company_id).first()
    if exist:
        return core_msg.ServerCode.General.something_wrong

    new = ManagerSubscription()
    new.manager_id = manager_id
    new.company_id = company_id
    new.subscription_id = generate_hex(16)
    new.plan_type = plan_type
    new.subscription_plan = sub_plan
    new.status = status
    new.time_created = time.time()
    new.time_start = 0
    new.time_end = 0
    new.auto_renew = False
    new.last_payment_time = 0
    new.note = ""
    # feature as free
    new.order_features = OrderFeature.CREATE
    new.worker_features = WorkerFeature.CREATE
    new.invoice_features = WorkerFeature.CREATE
    new.reports_features = ReportsFeature(0)
    cleaneril_db.session.add(new)
    cleaneril_db.session.commit()
    
    return core_msg.ServerCode.success


def create_default_manager_subscription(manager_id:str, company_id:str):
    code = create_manager_subscription(manager_id, company_id)

    return code

