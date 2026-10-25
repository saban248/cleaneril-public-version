from api.openformat.formatters.record import OFRecordBuilder
from api.openformat.formatters.ptc import alpha, decimal_field, format_date, numeric



def build_110d(row_number,vat_number,order, receipt,item,line_number,header_link):

    r = OFRecordBuilder()
    r.add(alpha("110D", 4))
    r.add(numeric(row_number,9))
    r.add(numeric(vat_number,9))
    r.add(numeric(320 if receipt.is_vat else 400,3))
    r.add(alpha(receipt.key,20))
    r.add(numeric(line_number,4))
    r.add(numeric(0,3))
    r.add(alpha("",20))
    r.add(numeric(1, 1))
    r.add(alpha("",20))
    r.add(alpha(item.name,30))
    r.add(alpha("",50))
    r.add(alpha("",30))
    r.add(alpha("יחידה",20))
    r.add(decimal_field(1.0,12, 4))
    r.add(decimal_field(item.price,12))
    r.add(decimal_field(order.off_price,12))
    line_total = (1 *item.price)-order.off_price
    r.add(decimal_field(line_total,12))
    vat_rate = ( 1800 if receipt.is_vat else 0)
    r.add(numeric(vat_rate,4))
    r.add(alpha("", 0))
    r.add(alpha("", 7))
    r.add(alpha("", 0))
    r.add(format_date(receipt.date))
    r.add(numeric(header_link,7))
    r.add(alpha("", 7))
    r.add(alpha("", 21))

    return r.build()
