import time
from datetime import datetime
from pathlib import Path

from api.databases.company import Company
from api.databases.invoice import get_receipts_by_date, Receipt
from api.databases.manager import Manager
from api.databases.orders import CleanOrder
from api.openformat.main import write_to_bkmvd, write_to_ini, write_bkmv_to_zip
from api.openformat.ptc import OFConfig
from api.openformat.records.ini import build_summary_rows, build_ini
from api.openformat.records.r_100A import build_100a
from api.openformat.records.r_100C import build_100c
from api.openformat.records.r_110D import build_110d
from api.openformat.records.r_120D import build_120d
from api.openformat.records.r_900Z import build_900z
from api.openformat.services.validator import OFValidator


def generate_file_id():

    return datetime.now().strftime(
        "%y%m%d%H%M%S%f"
    )[:15]


def create_export_directory(vat_id:str):
    now = datetime.now()
    folder_1 = (vat_id[:8]+ "."+ now.strftime("%y"))
    folder_2 = now.strftime("%m%d%H%M")
    export_path = (Path(OFConfig.EXPORT_PATH) / folder_1 / folder_2)
    export_path.mkdir(parents=True, exist_ok=True)

    return export_path



class OFExporter:

    def __init__(self, manager:Manager, company:Company):
        self.file_id = generate_file_id()
        self.receipts_selected:list[Receipt] = None
        self.__c_rows = 1
        self.__bkm = []
        self.__ini = []
        self.__df:float = 0
        self.__dt:float = time.time()
        self.manager = manager
        self.company = company
        self.output_path = None

    def export(self, df:float = None, dt:float = None):
        if df:self.__df = df
        if dt:self.__dt = dt
        self.__load_documents()
        # >>
        if self.receipts_selected.__len__() == 0:
            return self

        self.__build_docs()
        self.__build_ini()
        self.__build_path()
        self.__write()
        validator = OFValidator.validate(self.__bkm, self.company.company_VAT, self.file_id)
        return self

    def __build_path(self):
        self.output_path = create_export_directory(self.company.company_VAT)

    def __load_documents(self):
        self.receipts_selected = get_receipts_by_date(self.manager.manager_id,self.__df, self.__dt)

    def __build_docs(self):
        # 1: first
        __100A__ = build_100a(self.__c_rows, self.company.company_VAT, self.file_id)
        self.__append(__100A__)
        for receipt in self.receipts_selected:
            header_link = self.__c_rows
            order = CleanOrder(**receipt.data)
            __100C__ = build_100c(self.__c_rows, self.company.company_VAT,receipt.key,receipt.date,
                                  order.fullname,order.price-order.off_price, order.vat)
            self.__append(__100C__)
            if order.vat:
                line = 0
                for item in order.items:
                    __110D__ = build_110d(self.__c_rows, self.company.company_VAT,order, receipt,item,line,header_link)
                    self.__append(__110D__)
                    line += 1

            __120D__ = build_120d(self.__c_rows, self.company.company_VAT, order, receipt, header_link)
            self.__append(__120D__)

        __900Z__ = build_900z(self.__c_rows, self.company.company_VAT, self.file_id, self.__c_rows)
        self.__append(__900Z__)

    def __build_ini(self):
        summary_rows = build_summary_rows(self.__bkm)
        ini_open_record = build_ini(self.company.company_VAT, self.file_id, self.company.company_name, self.__c_rows,
                                    self.output_path)
        self.__ini.append(ini_open_record)
        self.__ini.extend(summary_rows)

    def __write(self):
        bkmvdata_content = "".join(self.__bkm)
        ini_content = "".join(self.__ini)
        write_to_bkmvd(self.output_path, bkmvdata_content)
        write_to_ini(self.output_path, ini_content)
        write_bkmv_to_zip(self.output_path)

    def __append(self, line):
        self.__bkm.append(line)
        self.__c_rows += 1

