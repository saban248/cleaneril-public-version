from flask import request

import api.databases.company as companies
from api import cardcom
from api.api_action import get_api_action, api_upload_file, get_register_action, get_subscription_api, \
    get_public_api_action
from api.databases.bridge import fix_order_to_client
from api.databases.manager import manager_auth, update_time_alive
from api.databases.ptc import cleaneril, ManagerAccountStat, cleaneril_db
from api.integrations.api import get_integrations_api, set_interactions_api
from api.marketplace.api import get_marketplace_api
from api.orders.api import get_order_api
from api.ptc import ShortSession, SJson, get_dictionary_http
from api.routes import cil_struct
from api.routes.general import set_session_data_admin
from api.routes.ptc import RouteApi, ApiUploadFile, UserAccountSubscription
from api.validator import core_msg


@cleaneril.route(RouteApi.do_auth.path, methods=["POST"])
def authorize():
    __success__ = core_msg.ServerCode.success
    if ShortSession.is_admin_active():
        return SJson.auto_code(__success__)
    breq = get_dictionary_http(request)
    auth = cil_struct.Auth().build(**breq)
    manager = manager_auth(auth.phone, auth.password)
    if not manager:
        return SJson.auto_code(core_msg.ServerCode.General.access_denied)

    _company = companies.get_companies(manager_id=manager.manager_id).first()
    update_time_alive(manager.manager_id)
    if manager.account_stat != ManagerAccountStat.ACTIVE:
        return SJson.auto_code(core_msg.ServerCode.Register.register_not_finished)

    set_session_data_admin(manager, _company)

    return SJson.auto_code(__success__)


@cleaneril.route(RouteApi.api.path, methods=["POST"])
def api():
    if not ShortSession.is_admin_active():
        return SJson.auto_code(core_msg.ServerCode.General.access_denied)

    breq = get_dictionary_http(request)
    sjson = get_api_action(**breq)
    return sjson


@cleaneril.route(RouteApi.papi.path, methods=["POST"])
def public_api():
    breq = get_dictionary_http(request)
    sjson = get_public_api_action(**breq)
    return sjson

@cleaneril.route(RouteApi.up_image.path, methods=["POST"])
def up_image():
    data = request.json
    response = api_upload_file(ApiUploadFile.LOGO, **data)

    return response


@cleaneril.route(RouteApi.register.path, methods=["POST"])
def register():
    breq = get_dictionary_http(request)
    get_ac = get_register_action(**breq)
    return get_ac


@cleaneril.route(RouteApi.subscription.path, methods=["POST"])
def subscription():
    if not ShortSession.is_root():
        return SJson.auto_code(core_msg.ServerCode.General.access_denied)

    breq = get_dictionary_http(request)
    get_ac = get_subscription_api(**breq)
    return get_ac


@cleaneril.route(RouteApi.marketplace.path, methods=["POST"])
def marketplace():
    if not ShortSession.is_admin_active():
        return SJson.auto_code(core_msg.ServerCode.General.access_denied)
    breq = get_dictionary_http(request)
    get_ac = get_marketplace_api(**breq)
    return get_ac


@cleaneril.route(RouteApi.orders.path, methods=["POST"])
def orders():
    if not ShortSession.is_admin_active():
        return SJson.auto_code(core_msg.ServerCode.General.access_denied)
    breq = get_dictionary_http(request)
    get_ac = get_order_api(**breq)
    return get_ac

@cleaneril.route(RouteApi.integrations.path, methods=["POST"])
def integrations():
    if not ShortSession.is_admin_active():
        return SJson.auto_code(core_msg.ServerCode.General.access_denied)

    breq = get_dictionary_http(request)
    get_ac = get_integrations_api(**breq)

    return get_ac

@cleaneril.route(f"{RouteApi.integrations.path}/<int:integration>/callback", methods=["GET"])
def integrations_callback(integration:int = 0):
    if not ShortSession.is_admin_active():
        return SJson.auto_code(core_msg.ServerCode.General.access_denied)

    breq = get_dictionary_http(request)
    return set_interactions_api(integration, **breq)



@cleaneril.route(RouteApi.logout.path, methods=["POST"])
def logout():
    ShortSession.logout()
    return SJson.auto_code(core_msg.ServerCode.success)



