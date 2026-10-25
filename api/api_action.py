import base64
import os
from time import sleep

from flask import render_template, abort

import api.databases.company as companies
from api.data.orders import DataOrders
from api.data.ptc import AnalyticsData, ClientReports
from api.databases import invoice, manager as managers, subscriptions, limit_api, bridge
from api.databases.server_log import client_history
from api.databases import orders, clients
from api.databases.bridge import on_create_order_create_client, get_pov_details_response, do_delete_clean_order, \
    allow_edit_clean_order
from api.databases.clients import ClientProfile
from api.databases.crads import ApiCards, Cards
from api.databases.employee import ApiEmployee, Employee
from api.databases.general import get_columns_no_instance
from api.databases.limit_api import is_limit_for_otp
from api.databases.manager import ApiManager, manager_auth, \
    update_time_alive, get_list_manager_no_pwd
from api.databases.orders import CleanOrder
from api.databases.ptc import StateDocument, ServerConfig, cleaneril, ManagerPermissions, cleaneril_db, \
    ManagerAccountStat, CompanyTaxType, APIRateLimitTypes, ClientHistory
from api.general import is_logo_app_valid, get_client_ip
from api.ptc import SJson, ShortSession
from api.routes import cil_struct
from api.routes.cil_struct import ReportsDataAnalyze
from api.routes.general import set_session_data_admin
from api.routes.ptc import Pages, ApiCall, ApiUploadFile, RegisterApi, ReportsApi, SubscriptionApi, SubscriptionStat, PublicApiCall
from api.sms_019.otp import OTP019, is_valid_otp
from api.validator import core_msg, company


def get_public_api_action(**breq):
    sleep(1.5)
    action = int(breq.get("action", -1))
    success = core_msg.ServerCode.success
    error = core_msg.ServerCode.General.something_wrong
    match action:
        case PublicApiCall.clean_order_verify:
            pa = cil_struct.PublicApi().build(**breq)
            order:CleanOrder = orders.get_clean_orders(order_id=pa.oi, key=pa.key).first()
            if not order:
                return SJson.auto_code(error)
            response = get_pov_details_response(order)
            return SJson.auto_code(success, **response.__dict__)
        case PublicApiCall.view_clean_order:
            od = cil_struct.CleanOrder().build(**breq)
            order: CleanOrder = orders.get_clean_orders(key=od.koi,order_id=od.oi).first()
            if not order:
                return SJson.auto_code(core_msg.ServerCode.General.something_wrong)
            manager = ApiManager.get_managers(False, manager_id=order.manager_id)
            if not manager:return SJson.auto_code(core_msg.ServerCode.General.something_wrong)

            return SJson.auto_code(core_msg.ServerCode.success,
                                   **{"template":get_client_order_template(manager[0], order, False)})

    return abort(404)

def get_api_action(**breq) -> dict:
    action = int(breq.get("action", -1))
    manager = ShortSession.manager()
    manager_id = ShortSession.manager_id()
    __success__ = core_msg.ServerCode.success
    match action:
        case ApiCall.card_editor:
            card = cil_struct.CardEditor().build(**breq)
            return SJson.auto_code(__success__, **{"template": get_card_edit_template(card.ci)})
        case ApiCall.order_edit:
            r_order = cil_struct.CleanOrder().build(**breq)
            order: CleanOrder = orders.get_clean_orders(manager_id=manager_id, order_id=r_order.oi).first()
            if not order:
                return SJson.auto_code(-1)
            template =  {"template":get_client_order_template(manager, order), "order_id":order.order_id}
            return SJson.auto_code(__success__, **template)
        case ApiCall.client_view:
            client = cil_struct.Client().build(**breq)
            template = {"template":get_client_template(manager_id, client.cid)}
            return SJson.auto_code(__success__, **template)
        case ApiCall.order_save:
            r_order = cil_struct.CleanOrder().build(**breq)
            history_data = client_history.create_history_order_changed(manager_id, r_order)
            stat = allow_edit_clean_order(manager_id, r_order.oi)
            if stat:return SJson.auto_code(stat)
            order = orders.update_clean_order(manager_id, r_order.client_id,r_order)
            client = on_create_order_create_client(order)
            if history_data and client:
                client_history.create_history(manager_id, client.client_id, r_order.oi,
                                              ClientHistory.Entity.ORDER, ClientHistory.Action.CHANGED,
                                              history_data)
            return SJson.auto_code(__success__)
        case ApiCall.order_new:
            r_order = cil_struct.CleanOrder().build(**breq)
            order = orders.create_clean_order(manager_id,r_order.client_id, r_order)
            template = {"template":get_client_order_template(manager, order,True), "order_id":order.order_id}
            return SJson.auto_code(__success__, **template)
        case ApiCall.order_view:
            od = cil_struct.CleanOrder().build(**breq)
            order:CleanOrder = bridge.get_clean_order(manager_id, od.oi)
            if not order:
                return SJson.auto_code(core_msg.ServerCode.General.something_wrong)
            template = {"template": get_client_order_template(manager, order, False), "order_id":order.order_id}
            return SJson.auto_code(__success__, **template)
        case ApiCall.card_draft | ApiCall.card_save:
            if ApiCall.card_draft&action:state = StateDocument.DRAFT
            else: state = StateDocument.SAVED
            card = cil_struct.CardEditor().build(**breq)
            ApiCards.add_card(card.ci,state,card.ct,card.o,
                              card.op,card.imp,card.desc,card.wt, card.wtl,card.phone)
            return SJson.auto_code(__success__, **{"card_id": card.ci})
        case ApiCall.card_delete:
            card = cil_struct.CardEditor().build(**breq)
            code = ApiCards.delete_card(card_id=card.ci)
            return SJson.auto_code(code)
        case ApiCall.order_delete:
            rroder = cil_struct.CleanOrder().build(**breq)
            order = orders.get_clean_orders(manager_id=manager_id, order_id=rroder.oi).first()
            if not order:return SJson.auto_code(1)
            client_history.create_history(manager_id, order.client_id, order.order_id, ClientHistory.Entity.ORDER,
                                          ClientHistory.Action.CHANGED, [])
            code = do_delete_clean_order(manager_id, rroder.oi)
            return SJson.auto_code(code)
        case ApiCall.api_reports:
            return get_app_reports_api(**breq)
        case ApiCall.manager_settings:
            config = cil_struct.AccountAppSettings().build(**breq)
            code = companies.update_company_details(manager_id, config.c_name,config.c_name_owner, config.c_vat,
                                              config.c_desc,config.c_phone, config.c_owner_phone, config.c_email, config.c_vat_code,
                                                      config.c_gpse,-1,config.c_show_vcio)

            set_session_data_admin(ApiManager.get_managers(manager_id=manager_id).first(),
                                   companies.get_companies(manager_id=manager_id).first())
            return SJson.auto_code(code)
        case ApiCall.order_workers:
            workers = list(ApiEmployee.get_employees_search(manager_id=manager_id))
            return SJson.auto_code(__success__, **{"workers": workers})
        case ApiCall.worker_editor:
            worker = cil_struct.Employee().build(**breq)
            template =  {"template": get_worker_template(manager, worker.wid)}
            return SJson.auto_code(__success__, **template)
        case ApiCall.worker_view:
            worker = cil_struct.Employee().build(**breq)
            template = {"template": get_worker_template(manager, worker.wid, False)}
            return SJson.auto_code(__success__, **template)
        case ApiCall.worker_save:
            worker = cil_struct.Employee().build(**breq)
            code = ApiEmployee.add_employee(worker.e_name, worker.e_pwd, manager_id, worker.wid,
                                               worker.permission,worker.e_phone,worker.e_idc, worker.ps, worker.pvat)
            return SJson.auto_code(core_msg.ServerCode.success if code else core_msg.ServerCode.General.something_wrong)

        case ApiCall.worker_delete:
            worker = cil_struct.Employee().build(**breq)
            code = ApiEmployee.delete_employee(manager_id, worker.wid)
            return SJson.auto_code(code)

        case ApiCall.calendar:
            calendar = cil_struct.Calendar().build(**breq)
            _orders = get_columns_no_instance(orders.get_clean_order_by_date(manager_id,calendar.df, calendar.dt))
            data = {"data": _orders}
            return SJson.auto_code(__success__, **data)

        case ApiCall.orders_list:
            data = cil_struct.ListOrders().build(**breq)
            _orders = bridge.get_clean_orders(manager_id)
            _orders_data = get_columns_no_instance(bridge.get_clean_orders(manager_id))
            return SJson.auto_code(__success__, **{"orders":_orders_data})

        case ApiCall.list_orders_deleted:
            _orders = {"orders":orders.get_clean_order_deleted(False, mid=manager_id)}
            return SJson.auto_code(__success__, **_orders)
        case ApiCall.order_restore:
            order = cil_struct.CleanOrder().build(**breq)
            stat = orders.restore_clean_order(manager_id, order.oi)
            return SJson.auto_code(stat)

        case ApiCall.invoice_view:
            inv = cil_struct.Invoice().build(**breq)
            receipt = invoice.get_receipts(manager_id=manager_id, receipt_id=inv.iid).first()
            if not receipt:
                return SJson.auto_code(core_msg.ServerCode.General.something_wrong)
            template = {"template":get_invoice_template(manager_id, receipt)}
            return SJson.auto_code(__success__, **template)

        case ApiCall.invoice_create:
            inv = cil_struct.Invoice().build(**breq)
            code = invoice.create_receipt(manager_id,inv.cid,inv.oid,inv.stat, inv.is_c, inv.cf, inv.force)
            return SJson.auto_code(code)

        case ApiCall.invoice_list:
            invoices = invoice.get_receipts(False, manager_id=manager_id)
            receipts =  {"invoices":invoices}
            return SJson.auto_code(__success__, **receipts)

        case ApiCall.invoice_delete:
            inv = cil_struct.Invoice().build(**breq)
            code = invoice.delete_receipt(manager_id, inv.iid)
            return SJson.auto_code(code)

        case ApiCall.list_clients:
            _clients = clients.get_clients(False, manager_id=manager_id)
            lclients =  {"clients":_clients}
            return SJson.auto_code(__success__, **lclients)
        case ApiCall.permissions:
            _manager = ApiManager.get_managers(manager_id=manager_id).first()
            return SJson.auto_code(__success__, **{"p":_manager.permission})

        case ApiCall.list_managers:
            managers = []
            __code__ = __success__
            if not ShortSession.is_root():
                __code__ =core_msg.ServerCode.General.access_denied
            else:
                managers = get_list_manager_no_pwd()

            return SJson.auto_code(__code__, **{"managers":managers})

        case ApiCall.list_companies:
            _companies = []
            __code__ = __success__
            if not ShortSession.is_root():
                __code__ = core_msg.ServerCode.General.access_denied
            else:
                _companies = companies.get_companies(False)
            return SJson.auto_code(__code__, **{"companies":_companies})

        case ApiCall.alive:
            update_time_alive(manager_id)
            return SJson.auto_code(__success__)

        case ApiCall.my_subscription:
            subscription = subscriptions.get_subscriptions(False, manager_id=manager_id)
            return SJson.auto_code(__success__, **{"sub":subscription})
        case ApiCall.my_company:
            return SJson.auto_code(__success__, **{"company":ShortSession.company()})
        case ApiCall.my_manager:
            return SJson.auto_code(__success__, **{"manager":ShortSession.manager()})

        case ApiCall.duplicate_clean_order:
            order = cil_struct.CleanOrder().build(**breq)
            duplicate = orders.duplicate_clean_order(manager_id, order.client_id, order.oi)
            if duplicate is None:
                return SJson.auto_code(core_msg.ServerCode.Orders.order_duplicate_not_exist)
            client_history.create_history(manager_id, duplicate.client_id, order.oi, ClientHistory.Entity.ORDER,
                                                    ClientHistory.Action.CREATED, client_history.create_history_desc('שיכפול הזמנה'))
            return SJson.auto_code(__success__, **{"order_id":duplicate.order_id})
        case ApiCall.client_reports:
            order = cil_struct.CleanOrder().build(**breq)
            ana = DataOrders(order.client_id, manager_id)
            history = client_history.get_histories(False, manager_id=manager_id, client_id=order.client_id)
            packet = ClientReports(len(ana.wait_client()), len(ana.cancel_client()), len(ana.closed_client()), len(ana.done_client()),
                                   ana.get_place_client(), ana.get_total_funds_client(), ana.get_total_income_client(),
                                   ana.get_total_off_price_client(), ana.get_total_expenses_client(), 0,
                                   ana.get_average_income_orders_client(), ana.get_total_closed_orders_balance(),history)

            return SJson.auto_code(__success__, **{"reports":packet.build()})
        case ApiCall.history_delete:
            h = cil_struct.ClientHistory().build(**breq)
            history = client_history.delete_history(manager_id,h.hid)
            return SJson.auto_code(history)
        case ApiCall.history_restore:
            h = cil_struct.ClientHistory().build(**breq)
            history = client_history.restore_history(manager_id,h.hid)
            return SJson.auto_code(history)
    return SJson.auto_code(__success__)


def get_app_reports_api(**breq) -> dict:
    manager = ShortSession.manager()
    manager_id = manager["manager_id"]
    __success__ = core_msg.ServerCode.success
    reports = cil_struct.Reports().build(**breq)
    action = reports.rAction or -1
    analyze = AnalyticsData(manager_id, reports.df, reports.dt)
    struct = ReportsDataAnalyze()
    match action:
        case ReportsApi.funds:
            struct.ie = analyze.income_ever()
            struct.i = analyze.income()
            struct.ee = analyze.expenses_ever()
            struct.e = analyze.expenses()
            struct.aioe = analyze.get_average_income_orders_ever()
            struct.aio = analyze.get_average_income_orders()
            struct.aeoe = analyze.get_average_expense_orders_ever()
            struct.aeo = analyze.get_average_expense_orders()
            struct.odce = analyze.orders_done_count_ever()
            struct.odc = len(analyze.orders_done())
            struct.occe = analyze.orders_canceled_count_ever()
            struct.occ = analyze.orders_canceled_count()
            struct.cico = analyze.count_items_clean_orders()
            struct.cicoe = analyze.count_items_clean_orders_ever()
            struct.code = analyze.count_orders_done_ever()
            struct.cod = analyze.count_orders_done()
            struct.ccre = analyze.count_client_repeated_ever()
            struct.ccr = analyze.count_client_repeated()
            return SJson.auto_code(__success__, **struct.__dict__)
        case ReportsApi.orders:...
        case ReportsApi.graph_funds:
            struct.graph_funds = analyze.get_graph_funds(reports.year)
            return SJson.auto_code(__success__, **struct.__dict__)
        case ReportsApi.graph_orders:
            struct.graph_orders = analyze.get_graph_orders(reports.year)
            return SJson.auto_code(__success__, **struct.__dict__)

    return SJson.auto_code(__success__)



def get_register_action(**breq):
    action = int(breq.get("action", -1))
    register = cil_struct.Register().build(**breq)
    match action:
        case RegisterApi.level0:
            o_phone = company.phone(register.o_phone)
            if o_phone:return SJson.auto_code(o_phone)
            pwd = company.password(register.password)
            if pwd:return SJson.auto_code(pwd)
            manager = manager_auth(register.o_phone, register.password)
            if manager and manager.phone_verified:
                _company: companies.Company = companies.get_companies(manager_id=manager.manager_id).first()
                ShortSession.set_admin_details(manager, _company)
                if _company.register_level == RegisterApi.DONE:
                    return SJson.auto_code(core_msg.ServerCode.Register.e_account_exist)
                elif _company.register_level != RegisterApi.level1 and managers.is_phone_verified(manager.manager_id):
                    return SJson.auto_code(core_msg.ServerCode.success, **{'level':_company.register_level.bit_length()})
            else:
                ip = get_client_ip()
                if is_limit_for_otp(ip):
                    cooldown = limit_api.get_cooldown_min_sec_str(ip, APIRateLimitTypes.OTP)
                    return SJson.auto_code(core_msg.ServerCode.Integration.reach_otp_limit, **{"cooldown":cooldown})
                limit_api.update_arl(ip, APIRateLimitTypes.OTP)
                otp = OTP019(company.normalize_phone(register.o_phone))
                otp_response = otp.create_otp()
                if otp_response.status != 0:
                    return SJson.auto_code(-1, **{"notice":otp_response.message})

                ShortSession.set_otp(otp_response.code)
                return SJson.auto_code(core_msg.ServerCode.success)


        case RegisterApi.level1:
            # done

            null = 'unknown'
            manager = manager_auth(register.o_phone, register.password)
            if not manager:
                manager = ApiManager.register(register.o_phone, -1, register.password)
                _company = companies.create_company(null, null, manager.manager_id, CompanyTaxType.PATOOR)
            else:
                _company = companies.get_companies(manager_id=manager.manager_id).first()
            if manager:
                if _company.register_level == RegisterApi.DONE:
                    return SJson.auto_code(core_msg.ServerCode.Register.e_account_exist)
            # otp
            if managers.is_phone_verified(manager.manager_id):
                return SJson.auto_code(core_msg.ServerCode.Integration.already_verified)
            otp_code = ShortSession.get_otp()
            if otp_code == core_msg.ServerCode.General.access_denied:
                managers.delete_by_manager_id(manager.manager_id)
                companies.delete_company(manager.manager_id)
            if not is_valid_otp(register.otpcode):
                return SJson.auto_code(core_msg.ServerCode.Integration.otpcode_invalid)

            if not is_valid_otp(register.otpcode) or otp_code != str(register.otpcode):
                return SJson.auto_code(core_msg.ServerCode.Integration.otpcode_invalid)

            otp019 = OTP019(company.normalize_phone(register.o_phone))
            response = otp019.validate_opt(otp_code)
            if response.status:
                return SJson.auto_code(core_msg.ServerCode.Integration.otpcode_invalid, **{"notice":response.message})

            ShortSession.set_admin_details(manager, _company)
            managers.phone_verified(manager)
            _company.register_level = RegisterApi.level2
            cleaneril_db.session.commit()

        case RegisterApi.level2:
            manager_id = ShortSession.manager_id()
            manager = ApiManager.get_managers(manager_id=manager_id).first()
            _company = companies.get_companies(manager_id=manager_id).first()
            if not manager or( not _company or _company.register_level != RegisterApi.level2 or not managers.is_phone_verified(manager_id)):
                return SJson.auto_code(core_msg.ServerCode.General.access_denied)
            vat_code = company.is_valid_israeli_id(register.vat_code)
            if vat_code:return SJson.auto_code(vat_code)
            name = company.company_name(register.c_name)
            if name:return SJson.auto_code(name)
            exist = companies.get_companies(company_name=register.c_name).first()
            if exist and exist.manager_id != manager_id:return SJson.auto_code(core_msg.ServerCode.Company.name_company_exist)
            desc = company.description(register.c_desc)
            if desc:return SJson.auto_code(desc)
            c_phone = company.phone(register.c_phone)
            o_phone = company.phone(register.o_phone)
            if(register.c_phone and c_phone) or o_phone:return SJson.auto_code(c_phone)
            fullname = company.ownername(register.o_name)
            if fullname:return SJson.auto_code(fullname)
            stat = companies.update_company_details(manager_id,register.c_name,register.o_name,False,
                                                    register.c_desc,register.c_phone,register.o_phone,register.c_email
                                                    ,register.vat_code,None,RegisterApi.level3)
            # WHEN DONE
            manager.permission = ManagerPermissions.ADMIN
            cleaneril_db.session.commit()
            return SJson.auto_code(stat)
        case RegisterApi.level3:
            # validate upload
            manager_id = ShortSession.manager_id()
            _company = companies.get_companies(manager_id=manager_id).first()
            if not _company or _company.register_level != RegisterApi.level3 or not managers.is_phone_verified(manager_id):
                return SJson.auto_code(core_msg.ServerCode.General.access_denied)

            _stat_ = api_upload_file(ApiUploadFile.LOGO,**breq)
            companies.update_company_details(manager_id,r_level=RegisterApi.level4)
            return _stat_

        case RegisterApi.level4:
            # subscription
            manager_id = ShortSession.manager_id()
            company_id = ShortSession.company_id()
            _company = companies.get_companies(company_id=company_id).first()
            if not _company or _company.register_level != RegisterApi.level4 or not managers.is_phone_verified(manager_id):
                return SJson.auto_code(core_msg.ServerCode.General.access_denied)

            subscription = subscriptions.create_manager_subscription(manager_id,company_id, register.sub_type,
                                                                     register.sub_plan, SubscriptionStat.ACTIVE)
            _company.register_level = RegisterApi.DONE
            cleaneril_db.session.commit()
            return SJson.auto_code(subscription)


    return SJson.auto_code(core_msg.ServerCode.success)


def get_subscription_api(**breq):
    action = int(breq.get("action", -1))
    subs = cil_struct.Subscription().build(**breq)
    manager_id = ShortSession.manager_id()
    code = core_msg.ServerCode.success
    match action:
        case SubscriptionApi.m_pending:
            code = managers.set_account_stat(subs.manager_id, ManagerAccountStat.PENDING)
        case SubscriptionApi.m_active:
            code = managers.set_account_stat(subs.manager_id, ManagerAccountStat.ACTIVE)
        case SubscriptionApi.m_banned:
            code = managers.set_account_stat(subs.manager_id, ManagerAccountStat.BANNED)
        case SubscriptionApi.m_pause:
            code = managers.set_account_stat(subs.manager_id, ManagerAccountStat.PAUSE)
        case SubscriptionApi.m_delete:
            code = managers.delete_manager_account(subs.manager_id)
        case SubscriptionApi.manager_template:
            template = {"template": get_manager_dashboard_template(manager_id)}
            return SJson.auto_code(code, **template)
        case SubscriptionApi.manager_workers:
            employees = ApiEmployee.get_employees(manager_id=subs.manager_id).all()
            return SJson.auto_code(code, **{"workers": get_columns_no_instance(employees)})
        case SubscriptionApi.approve_assets:
            if subs.asset == 1:
                code = companies.set_company_approve(subs.manager_id)
            elif subs.asset == 2:
                code = managers.set_manager_approve(subs.manager_id)
        case SubscriptionApi.list_subscriptions:
            l_subs = subscriptions.get_subscriptions(False)
            return SJson.auto_code(code, **{"subscriptions": l_subs})
        case SubscriptionApi.create_premium:...

    return SJson.auto_code(code)




def get_card_edit_template(card_id:str, **_):
    card:Cards = ApiCards.create_card(card_id=card_id)
    return render_template(f"{Pages.home.path}card_ba.html",
                           editor=True,card=card,
                           special=[]
                       )


def get_client_order_template(manager, order:CleanOrder, edit:bool = True, **_):
    _company = companies.get_companies(manager_id=manager["manager_id"]).first()
    return render_template(f'{Pages.dashboard.path}order.html',
                           editor=edit, order=order, manager=manager, company=_company)


def get_client_template(manager_id:str, client_id:str):
    client: ClientProfile = clients.get_clients(manager_id=manager_id, client_id=client_id).first()
    return render_template(f'{Pages.dashboard.path}client.html', client=client)


def get_worker_template(manager, worker_id:str, edit:bool = True, **_):
    manager_id = manager["manager_id"]
    worker:Employee = ApiEmployee.create_employee(worker_id, manager_id)
    _company = companies.get_companies(manager_id=manager_id).first()
    return render_template(f'{Pages.dashboard.path}worker.html',
                           editor=edit, worker=worker, manager=manager, company=_company)


def get_invoice_template(manager_id:str, receipt):
    _company = companies.get_companies(manager_id=manager_id).first()
    order = CleanOrder(**receipt.data)
    return render_template(Pages.invoice.f_dashboard, company=_company, invoice=receipt, order=order,
                           vat_number=ServerConfig.VAT_IL)


def get_manager_dashboard_template(manager_id:str):
    path = os.path.join(Pages.dashboard.path+Pages.subscription.path, Pages.manager.html2)
    return render_template(f'{path}')


def api_upload_file(flag, **data):
    filename = data.get("filename", "null")
    img_data = data.get("data")
    if not img_data:
        return SJson.auto_code(core_msg.ServerCode.General.something_wrong)

    image_bytes = base64.b64decode(img_data)
    manager_id:str = ShortSession.manager_id()
    match flag:
        case ApiUploadFile.CARD:
            if not ShortSession.is_admin_active():
                return SJson.auto_code(core_msg.ServerCode.General.access_denied)
            fullpath = os.path.join(os.path.basename(os.path.dirname(cleaneril.static_folder)),
                                    str(os.path.join(ServerConfig.FOLDER_IMAGE_BA, filename)))
            if ServerConfig.DEFAULT_IMAGE_CARD == fullpath: return SJson.auto_code(core_msg.ServerCode.success)

            with open(fullpath, "wb") as f:
                f.write(image_bytes)

        case ApiUploadFile.LOGO:
            exist = ApiManager.get_managers(manager_id=manager_id).first()
            if not exist :
                return SJson.auto_code(core_msg.ServerCode.General.access_denied)
            name = manager_id+".png"
            fullpath = os.path.join(os.path.basename(os.path.dirname(cleaneril.static_folder)),
                                    os.path.join(ServerConfig.FOLDER_LOGOS_PATH, name))
            stat = is_logo_app_valid(image_bytes)
            if stat:
                return SJson.auto_code(stat)

            with open(fullpath, "wb") as f:
                f.write(image_bytes)

            companies.change_logo(manager_id, name)


    return SJson.auto_code(core_msg.ServerCode.success)




