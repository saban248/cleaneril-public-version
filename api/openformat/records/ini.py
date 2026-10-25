import os.path

from api.databases.ptc import ServerConfig
from api.openformat.formatters.record import OFRecordBuilder
from api.openformat.formatters.ptc import alpha, format_date, format_time, numeric

from datetime import datetime
from collections import Counter
from api.openformat.ptc import OFConfig


def build_summary_rows(rows):
    counter = Counter()
    for r in rows:
        code = r[:4]
        counter[code] += 1
    sr = []
    for code, count in counter.items():
        summary = ''
        summary += alpha(code, 4)
        summary += numeric(count,15)
        summary += "\r\n"
        sr.append(summary)
    return sr


def build_ini(vat_number,file_id,company_name, total_rows,output_path):
    now = datetime.now()
    r = OFRecordBuilder()
    r.add(alpha("000A", 4))
    r.add(alpha("", 5))
    r.add(numeric(total_rows,15))
    r.add(numeric(vat_number,9))
    r.add(numeric(file_id,15))
    r.add(alpha(OFConfig.VERSION, 8))
    r.add(numeric(OFConfig.SOFTWARE_NUM,8)) # ??
    r.add(alpha(ServerConfig.APPLICATION_NAME, 20))
    r.add(alpha(ServerConfig.APP_VERSION,20))
    r.add(numeric(OFConfig.SOFTWARE_VAT_ID,9)) # ??
    r.add(alpha(ServerConfig.APPLICATION_NAME,20))
    r.add(numeric(1, 1))
    r.add(alpha(str(output_path), 50))
    r.add(numeric(0, 1))
    r.add(numeric(0, 1))
    r.add(numeric(0, 9))
    r.add(numeric(0, 9))
    r.add(alpha("", 10))
    r.add(alpha(company_name,50)) # ??
    r.add(alpha("", 50))
    r.add(alpha("", 10))
    r.add(alpha("", 30))
    r.add(alpha("", 8))
    r.add(numeric(now.year, 4))
    r.add(numeric(0, 8))
    r.add(numeric(0, 8))
    r.add(format_date(now))
    r.add(format_time(now))
    r.add(numeric(0, 1))
    r.add(numeric(1, 1))
    r.add(alpha("ZIP",20))
    r.add(alpha("ILS", 3))
    r.add(numeric(0, 1))
    r.add(alpha("", 46))

    row = r.build()
    row = row.rstrip("\r\n")
    row = row.ljust(OFConfig.INI_LENGTH)
    row += "\r\n"
    return row
