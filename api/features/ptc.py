from enum import IntFlag


class OrderFeature(IntFlag):
    CREATE     = 1 << 0
    SHARE      = 1 << 1
    DUPLICATE  = 1 << 2
    SUMMARY    = 1 << 3
    SMS_REMINDER = 1 << 4


class WorkerFeature(IntFlag):
    CREATE     = 1 << 0


class InvoiceFeature(IntFlag):
    CREATE     = 1 << 0


class ReportsFeature(IntFlag):
    GRAPH_VIEW = 1 << 0