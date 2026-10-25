from dataclasses import dataclass, asdict
from datetime import datetime, time
import time as ttime

from api.databases import orders
from api.databases.ptc import StateOrder

@dataclass
class DataGlobalTMTransaction:
    stat:int        = None
    key:int         = None
    order_type:int = None
    value:float = None


@dataclass
class DataGlobalTransactionsMarketplace:
    transactions_value: float = None
    transactions_count:int = None
    array:list[DataGlobalTMTransaction] = None

def get_transactions():
    data = DataGlobalTransactionsMarketplace()
    data.array = []
    start = datetime.combine(datetime.today(), time.min).timestamp()
    end = datetime.combine(datetime.today(), time.max).timestamp()
    orders_today:list[orders.CleanOrder] = orders.get_clean_order_by_date_done(start, end,
                                                                          marketplace_shared=True)
    value, count = 0,0
    for order in orders_today:
        t = DataGlobalTMTransaction()
        value += order.price-order.off_price
        count += 1
        t.stat = order.stat
        t.key = order.key
        t.order_type = order.order_type
        t.value = value
        data.array.append(t)

    data.transactions_count = count
    data.transactions_value = value
    return data



