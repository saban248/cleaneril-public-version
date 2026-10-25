from api.databases.ptc import ServerConfig
from api.openformat.formatters.record import OFRecordBuilder
from api.openformat.formatters.ptc import alpha, numeric, decimal_field, format_date
from api.openformat.ptc import OFConfig, OFRecordLengths


def build_100c(row_number,vat_number, number, date, fullname, total_payment, is_vat):
    r = OFRecordBuilder()
    r.add(alpha("100C", 4))
    r.add(numeric(row_number, 9))
    r.add(numeric(vat_number, 9))
    r.add(numeric(320, 3))
    r.add(alpha(number, 20))
    r.add(format_date(date))
    r.add(alpha("", 4))
    r.add(alpha(fullname, 50))
    r.add(alpha("", 50))
    r.add(alpha("", 10))
    r.add(alpha("", 30))
    r.add(alpha("", 8))
    r.add(alpha("", 30))
    r.add(alpha("", 2))
    r.add(alpha("", 15))
    r.add(numeric(0, 9))
    r.add(numeric(0, 8))
    r.add(alpha("", 15))
    r.add(alpha("", 3))
    r.add(decimal_field(total_payment, 12))
    r.add(decimal_field(0, 12))
    if is_vat:
        r.add(decimal_field(total_payment - ServerConfig.VAT_IL,12))
        r.add(decimal_field(ServerConfig.VAT_IL, 12))
    r.add(decimal_field(total_payment, 12))

    row = r.build()
    row = row.ljust(OFRecordLengths.v100C.value)
    return row

