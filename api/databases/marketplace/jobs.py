import time as ttime
from dataclasses import dataclass

from api.databases import orders, manager
from api.databases.general import get_columns, get_column_no_instance
from api.databases.ptc import cleaneril_db, StateOrder
from api.marketplace.ptc import JobMarketplaceState, JobRequestState
from api.ptc import generate_hex, generate_code6
from api.validator import core_msg
from api.databases import company as companies

success = core_msg.ServerCode.success
error = core_msg.ServerCode.General.something_wrong


class JobRequest(cleaneril_db.Model):
    __tablename__ = "job_request"
    key = cleaneril_db.Column(cleaneril_db.Integer, primary_key=True, autoincrement=True)
    manager_id = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    company_id = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    manager_name = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    company_name = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    stat = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    job_id = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    request_id = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    time_created = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    viewed = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False)
    company_logo = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    established_code = cleaneril_db.Column(cleaneril_db.Integer, nullable=True)


def get_job_requests(source:bool = True, secure:bool = True, **kwargs):
    __d__ =  get_columns(JobRequest, source, **kwargs)
    if secure:
        for d in __d__:
            if isinstance(d, dict):
                d['established_code'] = -1
            else:
                d.established_code = -1

    return __d__


def delete_job_requests(jid:str):
    requests = get_job_requests(job_id=jid)
    for req in requests:
        cleaneril_db.session.delete(req)
        cleaneril_db.session.commit()


class Job(cleaneril_db.Model):
    __tablename__ = "jobs"
    key = cleaneril_db.Column(cleaneril_db.Integer, primary_key=True, autoincrement=True)
    job_id = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    state = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    order_id = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    from_company = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    from_manager = cleaneril_db.Column(cleaneril_db.String, nullable=True)
    to_company = cleaneril_db.Column(cleaneril_db.String, nullable=True)
    to_manager = cleaneril_db.Column(cleaneril_db.String, nullable=True)
    from_company_name = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    to_company_name = cleaneril_db.Column(cleaneril_db.String, nullable=True)
    from_company_logo = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    job_type = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    availability_window = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    watches = cleaneril_db.Column(cleaneril_db.JSON, nullable=False)
    comments = cleaneril_db.Column(cleaneril_db.JSON, nullable=False)
    time_created = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    last_update = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    # תיאור העבודה - או תיאור שבא מההזמנה המקורית
    description = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    # הערות חובה כדי לבצע את העבודה
    requirements = cleaneril_db.Column(cleaneril_db.JSON, nullable=False)
    fee = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    fee_type = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    tax = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False)


def create_job(fmanager_id:str, fcompany_id:str, order_id:str, fee:float, fee_type:int, description:str, taxes:bool = False,
               state:int = JobMarketplaceState.AVAILABLE):
    exist = get_jobs(from_manager=fmanager_id, order_id=order_id).first()
    order: orders.CleanOrder = orders.get_clean_orders(manager_id=fmanager_id, order_id=order_id,
                                                       marketplace_shared=False).first()
    company:companies.Company = companies.get_companies(company_id=fcompany_id, manager_id=fmanager_id).first()

    if order is None:return core_msg.ServerCode.General.something_wrong
    if exist:
        return update_job(order_id, exist.job_id, fee, fee_type, description, taxes, state)
    new = Job()
    new.job_id = "JB"+generate_hex(14)
    new.state = JobMarketplaceState.AVAILABLE
    new.order_id = order_id
    new.from_company = fcompany_id
    new.from_manager = fmanager_id
    new.from_company_name = company.company_name
    new.from_company_logo = company.logo_path
    new.to_company = None
    new.to_manager = None
    new.to_company_name = None
    new.availability_window = order.date
    new.watches = []
    new.requirements = []
    new.comments = []
    new.time_created = ttime.time()
    new.last_update = ttime.time()
    new.description = description or "אין הערות"
    new.fee = fee
    new.fee_type = fee_type
    new.tax = taxes
    new.job_type = order.order_type
    cleaneril_db.session.add(new)
    cleaneril_db.session.commit()
    order.marketplace_shared = True
    cleaneril_db.session.commit()

    return core_msg.ServerCode.success


def update_job(order_id:str, jid:str, fee:float, fee_type:int, description:str, taxes:bool, state:int):
    job = get_jobs(order_id=order_id, job_id=jid).first()
    order: orders.CleanOrder = orders.get_clean_orders(order_id=order_id,
                                                       marketplace_shared=False).first()
    if not job:return core_msg.ServerCode.General.something_wrong
    if fee is not None:
        job.fee = fee
    if fee_type:
        job.fee_type = fee_type
    if description:
        job.description = description
    if taxes is not None:
        job.tax = taxes
    if state:
        job.state = state
    order.marketplace_shared = True
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success

def job_available_extend_data(job:Job):
    # UNVERIFIED
    order: orders.CleanOrder = orders.get_clean_orders(order_id=job.order_id, marketplace_shared=True,
                                                       stat=StateOrder.CLOSED).first()
    if not order: return 1
    mngr = manager.ApiManager.get_managers(manager_id=order.manager_id).first()
    if not mngr: return 1
    company = companies.get_companies(manager_id=mngr.manager_id).first()
    if not company: return 1

    job.order = JobOrderData().build(order)
    job.company = JobCompanyData().build(company, mngr)
    job.requests = get_job_requests(False, job_id=job.job_id)
    return 0


def get_jobs(source:bool = True, **kwargs):
    jobs = get_columns(Job, True, **kwargs)
    _jobs = []
    for job in jobs:
        if job_available_extend_data(job):continue
        if not source:
            _jobs.append(get_column_no_instance(job))
    if source:
        return jobs
    return _jobs


@dataclass
class JobOrderData:
    fullname:str        = None
    area_coordinate:str    = None
    area_name:str = None
    order_items_length:int = None
    order_items:list        = None
    price:int = None
    off_price:int = None
    vat:bool = None
    def build(self, order:orders.CleanOrder):
        self.fullname = order.fullname
        self.area_coordinate = order.area_coordinates
        self.order_items_length = order.items.__len__()
        self.order_items = order.items
        self.price = order.price
        self.off_price = order.off_price
        self.vat = order.vat
        self.area_name = order.area_name

        return self


@dataclass
class JobCompanyData:
    # personal
    p_verified:bool = None
    # company
    c_verified:bool = None
    owner_fullname:str = None
    def build(self, company:companies.Company, m:manager.Manager):
        self.p_verified = m.account_approved
        self.c_verified = company.company_approved
        self.owner_fullname = company.owner_fullname
        return self


def get_jobs_available(source:bool = True, **kwargs):
    jobs = []
    for j in Job.query.filter(Job.state.in_([JobMarketplaceState.AVAILABLE]), Job.availability_window>ttime.time()).all():
        if job_available_extend_data(j):continue
        jobs.append(get_column_no_instance(j))
    return jobs

def established_share_job(manager_id:str, jid:str, oi:str):
    # manager_id of destination manager
    job:Job = get_jobs(job_id=jid, order_id=oi, state=JobMarketplaceState.AVAILABLE).first()
    order: orders.CleanOrder = orders.get_clean_orders(order_id=oi, marketplace_shared=True).first()
    if not job or not order:
        return core_msg.ServerCode.General.something_wrong
    if job.state == JobMarketplaceState.DONE:
        return core_msg.ServerCode.General.something_wrong

    request:JobRequest = get_job_requests(True,  False, manager_id=manager_id, job_id=jid).first()
    if not request or request.stat & (JobRequestState.REJECTED|JobRequestState.BLOCKED):
        return core_msg.ServerCode.Marketplace.request_unavailable
    request.established_code = generate_code6()
    request.stat = JobRequestState.APPROVED
    request.viewed = True
    job.state = JobMarketplaceState.DONE
    job.last_update = ttime.time()
    job.to_manager = manager_id
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success


def reject_request_share_job(manager_id:str, jid:str, oi:str):
    # manager_id of destination manager
    job:Job = get_jobs(job_id=jid, order_id=oi).first()
    if not job or job.state & JobMarketplaceState.DONE:
        return core_msg.ServerCode.General.something_wrong
    request:JobRequest = get_job_requests(manager_id=manager_id, job_id=jid).first()
    if not request or request.stat != JobRequestState.WAIT:
        return core_msg.ServerCode.Marketplace.request_unavailable
    request.viewed = True
    request.stat = JobRequestState.REJECTED
    cleaneril_db.session.commit()

    return core_msg.ServerCode.success


def approve_share_job(manager_id:str, jid:str, oi:str):
    ...

def suspend_share_job(manager_id:str, jid:str, oi:str):
    # TODO : JID, as APPSEC
    job:Job = get_jobs(from_manager=manager_id, order_id=oi, state=JobMarketplaceState.AVAILABLE).first()
    order: orders.CleanOrder = orders.get_clean_orders(manager_id=manager_id, order_id=oi, marketplace_shared=True).first()
    if not job or not order:
        return core_msg.ServerCode.General.something_wrong
    if job.state == JobMarketplaceState.SUSPENDED:
        return core_msg.ServerCode.General.already_suspend
    if job.state == JobMarketplaceState.DONE:
        return core_msg.ServerCode.Marketplace.order_share_done

    job.state = JobMarketplaceState.SUSPENDED
    order.marketplace_shared = False
    job.last_update = ttime.time()
    cleaneril_db.session.commit()

    return core_msg.ServerCode.success

def delete_job_request(request_id:str):
    request:JobRequest = get_job_requests(request_id=request_id).first()
    if not request or request.stat != JobRequestState.WAIT:
        return core_msg.ServerCode.General.something_wrong

    cleaneril_db.session.delete(request)
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success

def delete_job_forever(oid:str):
    job = get_jobs(order_id=oid).first()
    if not job:return core_msg.ServerCode.General.something_wrong

    delete_job_requests(job.job_id)
    cleaneril_db.session.delete(job)
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success


@dataclass
class JobWatchHistory:
    manager_id:str      = None


def add_watch_history(manager_id:str, jid:str):
    job = get_jobs(job_id=jid).first()
    if not job:return error

    first =  list(filter(lambda w: JobWatchHistory(**w).manager_id == manager_id, job.watches))
    if first:
        return success

    watches = [JobWatchHistory(manager_id).__dict__]
    watches.extend(job.watches)
    job.watches = watches
    cleaneril_db.session.commit()
    return success


def add_request(company_id:str, manager_id:str, jid:str):
    job = get_jobs(job_id=jid).first()
    if not job:return error
    if job.state & (JobMarketplaceState.SUSPENDED|JobMarketplaceState.ESTABLISHED|JobMarketplaceState.DONE):
        return core_msg.ServerCode.Marketplace.job_unavailble
    if job.from_manager == manager_id:
        return error
    job_request = get_job_requests(manager_id=manager_id, job_id=jid).first()
    if job_request:
        return error
    company:companies.Company = companies.get_companies(manager_id=manager_id).first()
    if not company:return error
    jr:JobRequest = JobRequest()
    jr.manager_id = manager_id
    jr.request_id = generate_hex(14)
    jr.time_created = ttime.time()
    jr.job_id = job.job_id
    jr.stat = JobRequestState.WAIT
    jr.viewed = False
    jr.company_id = company_id
    jr.company_name = company.company_name
    jr.manager_name = company.owner_fullname
    jr.company_logo = company.logo_path
    cleaneril_db.session.add(jr)
    cleaneril_db.session.commit()

    return success






