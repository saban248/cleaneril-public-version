from api.data.ptc import AnalyticsData
from api.databases import orders
from api.databases.ptc import StateOrder


class DataOrders(AnalyticsData):

    def __init__(self, client_id:str, *args):
        super().__init__(*args)
        self.__cid = client_id
        self.__orders = orders.get_clean_orders(manager_id=self.mid, client_id=self.__cid).all()

    def get_total_funds_client(self):
        _funds = 0
        for order in self.__orders:
            if order.stat != StateOrder.DONE:continue
            _funds += order.price

        return _funds

    def get_total_income_client(self):
        income =0
        for order in self.__orders:
            if order.stat != StateOrder.DONE: continue
            income += order.price
            income = (income-order.off_price)-order.expense

        return income

    def get_total_off_price_client(self):
        off_price = 0
        for order in self.__orders:
            if order.stat != StateOrder.DONE: continue
            off_price += order.off_price

        return off_price

    def get_total_expenses_client(self):
        expenses = 0
        for order in self.__orders:
            if order.stat != StateOrder.DONE: continue
            expenses += order.expense
        return expenses

    def get_total_closed_orders_balance(self):
        balance = 0
        for o in self.__orders:
            if o.stat == StateOrder.CLOSED:
                balance += (o.price-o.off_price)

        return balance

    def get_place_client(self):
        return 100

    def get_average_income_orders_client(self):
        return float(f"{self.get_total_income_client()/(self.__orders.__len__() or 1):.2f}")

    def wait_client(self):return list(filter(lambda x: x.stat == StateOrder.WAIT, self.__orders))
    def cancel_client(self):return list(filter(lambda x: x.stat == StateOrder.CANCELED, self.__orders))
    def closed_client(self):return list(filter(lambda x: x.stat == StateOrder.CLOSED, self.__orders))
    def done_client(self):return list(filter(lambda x: x.stat == StateOrder.DONE, self.__orders))




