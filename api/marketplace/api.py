from time import sleep

from api.databases import orders
from api.databases.bridge import delete_job_marketplace_forever
from api.databases.general import get_columns
from api.databases.marketplace.jobs import Job
from api.databases.marketplace.marketapi import validate_share_order_marketplace
from api.marketplace import transactions
from api.marketplace.ptc import MarketplaceApiCall, JobMarketplaceState
from api.databases.marketplace import jobs
from api.ptc import SJson, ShortSession
from api.routes import cil_struct


def get_marketplace_api(**breq):
    action:int = breq.get('action', -1)
    manager_id = ShortSession.manager_id()
    company_id = ShortSession.company_id()
    match action:
        case MarketplaceApiCall.list_jobs:
            return SJson.auto_code(0, **{"jobs":jobs.get_jobs_available(False)})
        case MarketplaceApiCall.list_transactions:
            return SJson.auto_code(0, **{"transactions":transactions.get_transactions()})
        case MarketplaceApiCall.list_my_jobs:
            return SJson.auto_code(0, **{"jobs":jobs.get_jobs(False, from_manager=manager_id,
                                                              from_company=company_id)})
        case MarketplaceApiCall.validate_share_order_marketplace:
            rorder = cil_struct.CleanOrder().build(**breq)
            stat = validate_share_order_marketplace(manager_id, rorder)
            return SJson.auto_code(stat)
        case MarketplaceApiCall.share_order_marketplace:
            sleep(1)
            stm = cil_struct.ShareJob().build(**breq)
            validate = validate_share_order_marketplace(manager_id, stm)
            if validate:return SJson.auto_code(validate)
            stat = jobs.create_job(manager_id,company_id,stm.oi,stm.fee,stm.feet, stm.desc, stm.tax,stm.s)
            return SJson.auto_code(stat)
        case MarketplaceApiCall.cancel_share_order_market:
            stm = cil_struct.ShareJob().build(**breq)
            stat = delete_job_marketplace_forever(stm.oi)
            return SJson.auto_code(stat)
        case MarketplaceApiCall.view_job:
            stm = cil_struct.ShareJob().build(**breq)
            stat = jobs.add_watch_history(manager_id, stm.jid)
            return SJson.auto_code(stat)
        case MarketplaceApiCall.job_request:
            stm = cil_struct.ShareJob().build(**breq)
            stat = jobs.add_request(ShortSession.company_id(), manager_id, stm.jid)
            return SJson.auto_code(stat)
        case MarketplaceApiCall.established_share_job:
            stm = cil_struct.ShareJob().build(**breq)
            stat = jobs.established_share_job(stm.mid, stm.jid, stm.oi)
            return SJson.auto_code(stat)
        case MarketplaceApiCall.reject_share_job:
            stm = cil_struct.ShareJob().build(**breq)
            stat= jobs.reject_request_share_job(stm.mid, stm.jid, stm.oi)
            return SJson.auto_code(stat)
        case MarketplaceApiCall.delete_request_share_job:
            stm = cil_struct.ShareJob().build(**breq)
            stat = jobs.delete_job_request(stm.rid)
            return SJson.auto_code(stat)


    return SJson.auto_code(1)

