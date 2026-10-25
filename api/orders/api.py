from api.databases import orders, bridge
from api.databases.bridge import allow_edit_clean_order, on_create_order_create_client, do_delete_clean_order
from api.databases.general import get_columns_no_instance
from api.databases.ptc import ClientHistory
from api.databases.server_log import client_history
from api.orders.ptc import OrdersApiCall
from api.ptc import ShortSession, SJson
from api.routes import cil_struct
from api.validator import core_msg


def get_order_api(**breq):
    action:int = breq.get('action', -1)
    manager_id = ShortSession.manager_id()
    company_id = ShortSession.company_id()
    success = core_msg.ServerCode.success

    match action:
        case OrdersApiCall.save_clean_order:
            r_order = cil_struct.CleanOrder().build(**breq)
            history_data = client_history.create_history_order_changed(manager_id, r_order)
            stat = allow_edit_clean_order(manager_id, r_order.oi)
            if stat: return SJson.auto_code(stat)
            order = orders.update_clean_order(manager_id, r_order.client_id, r_order)
            client = on_create_order_create_client(order)
            if history_data and client:
                client_history.create_history(manager_id, client.client_id, r_order.oi,
                                              ClientHistory.Entity.ORDER, ClientHistory.Action.CHANGED,
                                              history_data)
            return SJson.auto_code(success)
        case OrdersApiCall.delete_clean_order:
            rroder = cil_struct.CleanOrder().build(**breq)
            order = orders.get_clean_orders(manager_id=manager_id, order_id=rroder.oi).first()
            if not order: return SJson.auto_code(1)
            client_history.create_history(manager_id, order.client_id, order.order_id, ClientHistory.Entity.ORDER,
                                          ClientHistory.Action.CHANGED, [])
            code = do_delete_clean_order(manager_id, rroder.oi)
            return SJson.auto_code(code)
        case OrdersApiCall.list_clean_orders:
            data = cil_struct.ListOrders().build(**breq)
            _orders = bridge.get_clean_orders(manager_id)
            _orders_data = get_columns_no_instance(bridge.get_clean_orders(manager_id))
            return SJson.auto_code(success, **{"orders": _orders_data})
        case OrdersApiCall.list_clean_orders_deleted:
            _orders = {"orders": orders.get_clean_order_deleted(False, mid=manager_id)}
            return SJson.auto_code(success, **_orders)
        case OrdersApiCall.restore_clean_order:
            order = cil_struct.CleanOrder().build(**breq)
            stat = orders.restore_clean_order(manager_id, order.oi)
            return SJson.auto_code(stat)
        case OrdersApiCall.duplicate_clean_order:
            order = cil_struct.CleanOrder().build(**breq)
            duplicate = orders.duplicate_clean_order(manager_id, order.client_id, order.oi)
            if duplicate is None:
                return SJson.auto_code(core_msg.ServerCode.Orders.order_duplicate_not_exist)
            client_history.create_history(manager_id, duplicate.client_id, order.oi, ClientHistory.Entity.ORDER,
                                          ClientHistory.Action.CREATED, client_history.create_history_desc('שיכפול הזמנה'))
            return SJson.auto_code(success, **{"order_id": duplicate.order_id})
        case OrdersApiCall.clean_order_details:
            order = cil_struct.CleanOrder().build(**breq)
            order_details = orders.get_clean_order(False, manager_id=manager_id, order_id=order.oi)
            return SJson.auto_code(not bool(order_details), **{"order": order_details })


    return SJson.auto_code(core_msg.ServerCode.General.something_wrong)

