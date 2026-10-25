from api.openformat.formatters.record import OFRecordBuilder
from api.openformat.formatters.ptc import alpha, numeric
from api.openformat.ptc import OFConfig
from api.ptc import generate_hex


def build_100a(row_number,vat_number,file_id):

    r = OFRecordBuilder()
    r.add(alpha("100A", 4))
    r.add(numeric(row_number, 9))
    r.add(numeric(vat_number, 9))
    r.add(numeric(file_id, 15))
    r.add(alpha(OFConfig.VERSION, 8))
    r.add(alpha("", 50))

    return r.build()

