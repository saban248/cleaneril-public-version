import time
from dataclasses import dataclass
from datetime import datetime, timezone

from api.databases import orders, clients
from api.databases.orders import CleanOrder
from api.databases.ptc import StateOrder


def get_month_range_by_ym(year:int, month:int):
    start = datetime(year, month, 1, tzinfo=timezone.utc).timestamp()
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc).timestamp()
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc).timestamp()

    return start, end


@dataclass
class GraphFunds:
    date:str            = None
    amount:int          = None
    average_income:int = None
    average_expense:int= None
    expense:int         = None

@dataclass
class GraphOrders:
    date:str            = None
    items:int           = None
    canceled:int        = None
    average_client_repeat_percent:float = None


@dataclass
class ClientReports:
    wait:int        = None
    canceled:int    = None
    closed:int      = None
    done:int        = None
    place:int       = None
    funds:int       = None
    income:int      = None
    off_price:int   = None
    expenses:int    = None
    orders_count:int= None
    ave_income:float= None
    balance:int     = None
    history:dict    = None

    def build(self):
        self.orders_count = self.wait+self.canceled+self.closed+self.done
        return self




class AnalyticsData:

    def __init__(self, manager_id:str, date_from:float = None, date_to:float = None, cache:bool = True):
        self.mid = manager_id
        self.__df = date_from or 0
        self.__dt = date_to or time.time()
        self.__cache = cache

        self.__od = None

    def __get_clean_orders_by_stat(self, stat:StateOrder):
        _orders = orders.get_clean_order_by_date(self.mid, self.__df, self.__dt, stat=stat)
        return _orders

    def orders_done(self):
        if self.__od and self.__cache:return self.__od
        self.__od=self.__get_clean_orders_by_stat(StateOrder.DONE)
        return self.__od

    def orders_done_count_ever(self):
        return len(orders.get_clean_order_by_date(self.mid, 0, time.time(), stat=StateOrder.DONE))

    def orders_wait(self):
        return self.__get_clean_orders_by_stat(StateOrder.WAIT)

    def orders_canceled(self):
        return self.__get_clean_orders_by_stat(StateOrder.CANCELED)

    def orders_canceled_count(self):
        return len(self.orders_canceled())

    def orders_canceled_count_ever(self):
        return len(orders.get_clean_order_by_date(self.mid, 0, time.time(), stat=StateOrder.CANCELED))

    def orders_closed(self):
        return self.__get_clean_orders_by_stat(StateOrder.CLOSED)

    def get_orders_done_by_year(self, year:int):
        start = datetime(year, 1, 1, tzinfo=timezone.utc).timestamp()
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc).timestamp()
        return orders.get_clean_order_by_date(self.mid, start, end, False, stat=StateOrder.DONE)

    def income(self):
        income = 0
        _orders = self.orders_done()
        for order in _orders:
            income += (order.price - order.off_price)
        return income

    def income_ever(self):
        income = 0
        _orders = orders.get_clean_order_by_date(self.mid, 0, time.time(), stat=StateOrder.DONE)
        for order in _orders:
            income += (order.price - order.off_price)
        return income

    def off_price(self):
        off_price = 0
        _orders = self.orders_done()
        for order in _orders:
            off_price += order.off_price
        return off_price

    def expenses(self):
        expenses = 0
        _orders = self.orders_done()
        for order in _orders:
            expenses += order.expense
        return expenses

    def expenses_ever(self):
        expenses = 0
        _orders = orders.get_clean_order_by_date(self.mid, 0, time.time(), stat=StateOrder.DONE)
        for order in _orders:
            expenses += order.expense

        return expenses

    def get_average_income_orders(self) -> float:
        _orders = self.orders_done()
        total_income = self.income()
        return float(f"{total_income/(len(_orders) or 1):.1f}")

    def get_average_income_orders_ever(self):
        orders_count = self.orders_done_count_ever()
        income_ever = self.income_ever()
        return float(f"{income_ever/(orders_count or 1):.1f}")

    def get_average_expense_orders(self) -> float:
        _orders = self.orders_done()
        return float(f"{self.expenses()/(len(_orders) or 1):.1f}")

    def get_average_expense_orders_ever(self):
        orders_count = self.orders_done_count_ever()
        expense_ever = self.expenses_ever()
        return float(f"{expense_ever/(orders_count or 1):.1f}")

    def get_average_income_orders_month(self, year:int, month:int):
        df, dt = get_month_range_by_ym(year, month)
        _orders = orders.get_clean_order_by_date(self.mid, df, dt, False, stat=StateOrder.DONE)
        income = 0
        length_orders = 0
        for order in _orders:
            income += (order.price - order.off_price)
            length_orders+=1

        if not length_orders:return 0
        return float(f"{income / length_orders:.1f}")

    def get_average_expense_orders_month(self, year:int, month:int):
        df, dt = get_month_range_by_ym(year, month)
        _orders = orders.get_clean_order_by_date(self.mid, df, dt, False, stat=StateOrder.DONE)
        expense = 0
        length_orders = 0
        for order in _orders:
            expense += order.expense
            length_orders+=1

        if not length_orders:return 0
        return float(f"{expense / length_orders:.1f}")

    def get_graph_funds(self, year:int):
        data = []
        _orders = self.get_orders_done_by_year(year)
        for order in _orders:
            date = datetime.fromtimestamp(float(order.date))
            item = GraphFunds()
            item.date = date.strftime("%Y.%m.%d")
            item.amount = order.price - order.off_price
            item.expense = order.expense
            item.average_income = self.get_average_income_orders_month(date.year, date.month)
            item.average_expense = self.get_average_expense_orders_month(date.year, date.month)
            data.append(item.__dict__)

        return data

    def get_graph_orders(self, year:int):
        start = datetime(year, 1, 1, tzinfo=timezone.utc).timestamp()
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc).timestamp()
        data = []
        _orders = CleanOrder.query.filter(
            CleanOrder.manager_id == self.mid,
            CleanOrder.date >= start,
            CleanOrder.date <= end,
            CleanOrder.stat.in_([
                StateOrder.DONE,
                StateOrder.CANCELED
            ])
        ).all()
        for order in _orders:
            date = datetime.fromtimestamp(order.date)
            item = GraphOrders()
            item.date = date.strftime("%Y.%m.%d")
            item.items = len(order.items)
            item.canceled = bool(order.stat & StateOrder.CANCELED)
            item.average_client_repeat_percent = 0.0
            data.append(item.__dict__)
        return data


    def count_items_clean_orders_ever(self):
        _orders = orders.get_clean_order_by_date(self.mid, 0, time.time(), stat=StateOrder.DONE)
        items = 0
        for order in _orders:
            items += len(order.items)

        return items

    def count_items_clean_orders(self):
        _orders = self.orders_done()
        items = 0
        for order in _orders:
            items += len(order.items)

        return items

    def count_orders_done(self):
        return len(self.orders_done())

    def count_orders_done_ever(self):
        _orders = orders.get_clean_order_by_date(self.mid, 0, time.time(), stat=StateOrder.DONE)
        return len(_orders)

    def count_client_repeated_ever(self):
        _clients = clients.get_clients(manager_id=self.mid).all()
        repeat = 0
        for client in _clients:
            repeat += len(orders.get_clean_order_by_date(self.mid, 0, time.time(),
                                                         stat=StateOrder.DONE, client_id=client.client_id))

        return repeat

    def count_client_repeated(self):
        _clients = clients.get_clients(manager_id=self.mid).all()
        repeat = 0
        for client in _clients:
            __repeat__ = len(orders.get_clean_order_by_date(self.mid, self.__df, self.__dt,
                                                            stat=StateOrder.DONE, client_id=client.client_id))
            if __repeat__ >= 2:
                repeat+=(__repeat__-1)

        return repeat


