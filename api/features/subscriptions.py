from dataclasses import dataclass

from api.features.ptc import WorkerFeature, OrderFeature, InvoiceFeature, ReportsFeature

#STATIC

@dataclass(frozen=True)
class SubscriptionPlan:
    orders:     OrderFeature
    workers:    WorkerFeature
    invoices:   InvoiceFeature
    reports:    ReportsFeature




FREE = SubscriptionPlan(
    orders=OrderFeature.CREATE,
    workers=WorkerFeature.CREATE,
    invoices=InvoiceFeature(0),
    reports=ReportsFeature(0),
)

PREMIUM = SubscriptionPlan(
    orders=(
        OrderFeature.CREATE |
        OrderFeature.SHARE |
        OrderFeature.DUPLICATE |
        OrderFeature.SUMMARY |
        OrderFeature.SMS_REMINDER
    ),
    workers=WorkerFeature.CREATE,
    invoices=InvoiceFeature.CREATE,
    reports=ReportsFeature.GRAPH_VIEW,
)

