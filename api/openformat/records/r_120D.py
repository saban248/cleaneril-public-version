from api.jfunc import payment_type_text
from api.openformat.formatters.record import OFRecordBuilder
from api.openformat.formatters.ptc import alpha, numeric, decimal_field, format_date



def build_120d(row_number,vat_number,order, receipt,header_link):
    r = OFRecordBuilder()
    r.add(alpha("120D", 4))
    r.add(numeric(row_number, 9))
    r.add(numeric(vat_number, 9))
    r.add(numeric(320 if receipt.is_vat else 400,3))
    r.add(alpha(receipt.key,20))
    r.add(numeric(1,4))
    r.add(numeric(payment_type_text(receipt.payment_type),1))
    r.add(numeric(None or 0,10))
    r.add(numeric(None or 0,10))
    r.add(numeric(None or 0,15))
    r.add(numeric(None or 0,10))
    r.add(format_date(receipt.date))
    r.add(decimal_field(order.price-order.off_price,12))
    r.add(numeric(None or 0,1))
    r.add(alpha(None or "",20))
    r.add( numeric(None or 0,1))
    r.add(alpha("", 0))
    r.add(alpha("", 0))
    r.add(alpha("", 0))
    r.add(alpha("", 0))
    r.add(alpha("", 7))
    r.add(alpha("", 0))
    r.add(format_date(receipt.date))
    r.add(numeric(header_link,7))
    r.add(alpha("", 60))

    row = r.build()
    print(repr(row[140:180]))
    return row


