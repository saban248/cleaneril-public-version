from enum import IntFlag


class OrdersApiCall(IntFlag):
    edit_clean_order = 1
    save_clean_order = 2
    create_clean_order = 3
    clean_order_details = 4
    delete_clean_order = 5
    list_clean_orders = 6
    list_clean_orders_deleted = 7
    restore_clean_order = 8
    duplicate_clean_order = 9