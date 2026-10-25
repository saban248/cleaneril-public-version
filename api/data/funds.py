from api.data.ptc import AnalyticsData
from api.databases.orders import CleanOrder


class DataFunds(AnalyticsData):

    def __init__(self, mid):
        super().__init__(mid)

        self.fi = self.get_income_funds
        self.fe = self.get_expense_funds
        self.pf = self.get_profit_funds

    @property
    def get_income_funds(self):
        income = 0
        _orders:list[CleanOrder] = self.od
        for order in _orders:
            income += (order.price - order.off_price)

        return income

    @property
    def get_expense_funds(self):
        _orders:list[CleanOrder] = self.od
        expense = 0
        for order in _orders:
            expense += order.expense

        return expense

    @property
    def get_profit_funds(self):
        return self.fi-self.fe