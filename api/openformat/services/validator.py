import os
import re

from api.openformat.ptc import OFRecordLengths, OFConfig


class OFValidator:
    E_NOT_FOUND_ROWS  = "NO ROWS FOUND"
    E_RECORD_CODE = 'INVALID RECORD CODE'
    E_ROW_NUMBER = "INVALID ROW NUMBER"
    E_FILEID        = "FILE ID MISMATCH"
    E_VAT_NUM       = "VAT NUMBER MISMATCH"
    E_LINK_10d      = "INVALID 110D LINK"
    E_LINK_20d      = "INVALID 120D LINK"

    @staticmethod
    def validate(rows, vat_number, file_id):
        OFValidator.validate_rows_exist(rows)
        OFValidator.validate_record_codes(rows)
        OFValidator.validate_record_lengths(rows)
        OFValidator.validate_row_numbers(rows)
        OFValidator.validate_single_opening(rows)
        OFValidator.validate_single_closing(rows)
        OFValidator.validate_file_ids(rows, file_id)
        OFValidator.validate_vat_numbers(rows, vat_number)
        OFValidator.validate_header_links(rows)
        OFValidator.validate_encoding(rows)
        OFValidator.validate_versions(rows)
        OFValidator.validate_crlf(rows)
        OFValidator.validate_900z_total(rows)
        OFValidator.validate_documents(rows)
        OFValidator.validate_payment_totals(rows)
        OFValidator.validate_invoice_lines(rows)

    @staticmethod
    def validate_rows_exist(rows):
        if rows:return

        raise Exception(OFValidator.E_NOT_FOUND_ROWS)

    @staticmethod
    def validate_record_codes(rows):
        for row in rows:
            code = row[:4]
            if code not in OFRecordLengths.list_names():
                raise Exception(OFValidator.E_RECORD_CODE)

    @staticmethod
    def validate_record_lengths(rows):
        for row in rows:
            code = row[:4]
            expected = OFRecordLengths.get_by_name(code).value
            actual = len(row.rstrip("\r\n"))
            if actual != expected:
                raise Exception(OFValidator.E_RECORD_CODE+f" {actual}-{expected}")

    @staticmethod
    def validate_row_numbers(rows):
        expected = 1
        for row in rows:
            actual = int(row[4:13])
            if actual != expected:
                raise Exception(OFValidator.E_ROW_NUMBER)
            expected += 1

    @staticmethod
    def validate_single_opening(rows):
        count = 0
        for row in rows:
            if row.startswith(OFRecordLengths.v100A.name):
                count += 1
        if count != 1:
            raise Exception(f"INVALID {OFRecordLengths.v100A.name} COUNT")

    @staticmethod
    def validate_single_closing(rows):
        count = 0
        for row in rows:
            if row.startswith(OFRecordLengths.v900Z.name):
                count += 1
        if count != 1:
            raise Exception(f"INVALID {OFRecordLengths.v900Z.name} COUNT")

    @staticmethod
    def validate_file_ids(rows, file_id):
        found = []
        for row in rows:
            code = row[:4]
            if code in [OFRecordLengths.v100A.name,OFRecordLengths.v900Z.name]:
                current = row[22:37]
                found.append(current)

        for current in found:
            if current != str(file_id):
                raise Exception(OFValidator.E_FILEID)

    @staticmethod
    def validate_vat_numbers(rows,vat_number):
        for row in rows:
            current = row[13:22]
            if current != str(vat_number):
                raise Exception(OFValidator.E_VAT_NUM)

    @staticmethod
    def validate_header_links(rows):
        return
        valid_headers = set()
        for row in rows:
            code = row[:4]
            if code == OFRecordLengths.v100C.name:
                valid_headers.add(int(row[4:13]))

        for row in rows:
            code = row[:4]
            if code == OFRecordLengths.v110D.name:
                link = int(row[311:318])
                if link not in valid_headers:
                    raise Exception(OFValidator.E_LINK_10d)

            if code == OFRecordLengths.v120D.name:
                link = int(row[154:161])
                if link not in valid_headers:
                    raise Exception(OFValidator.E_LINK_20d+f" {link}")

    @staticmethod
    def validate_encoding(rows):
        for row in rows:
            try:
                row.encode(OFConfig.encoding)
            except Exception:
                raise Exception("INVALID ENCODING")

    @staticmethod
    def validate_versions(rows):
        found = False
        for row in rows:
            if row.startswith(OFRecordLengths.v100A.name):
                version = row[37:45]
                if version != OFConfig.VERSION:
                    raise Exception("INVALID VERSION")
                found = True

        if not found:
            raise Exception("VERSION NOT FOUND")

    @staticmethod
    def validate_crlf(rows):
        return
        for row in rows:
            if not row.endswith("\r\n"):
                raise Exception("INVALID CRLF")

    @staticmethod
    def validate_900z_total(rows):
        for row in rows:
            if row.startswith(OFRecordLengths.v900Z.name):
                total = int(row[45:60])
                actual = len(rows)
                if total != actual:
                    raise Exception(f"INVALID 900Z TOTAL {total} != {actual}")

    @staticmethod
    def validate_documents(rows):
        documents = {}
        for row in rows:
            code = row[:4]
            if code == OFRecordLengths.v100C.name:
                document_number = row[25:45].strip()
                documents[document_number] = {"total": row[369:384],"payments": 0}

        for row in rows:
            if row.startswith(OFRecordLengths.v120D.name):
                document_number = row[25:45].strip()
                amount = row[101:116]
                if document_number in documents:
                    documents[document_number]["payments"] += int(re.sub(r"[^\d]","",amount ) or "0")

    @staticmethod
    def validate_payment_totals(rows):
        totals = {}
        payments = {}
        for row in rows:
            code = row[:4]
            if code == OFRecordLengths.v100C.name:
                document = row[25:45].strip()
                total = row[399:414]
                total = int(re.sub(r"[^\d]","",total) or "0")
                totals[document] = total

            if code == OFRecordLengths.v120D.name:
                document = row[25:45].strip()
                amount = row[101:116]
                amount = int(re.sub(r"[^\d]","",amount ) or "0")
                payments.setdefault( document, 0)
                payments[document] += amount

        for document in totals:
            if document in payments:
                if totals[document] != payments[document]:
                    raise Exception(f"PAYMENT TOTAL MISMATCH {document}")

    @staticmethod
    def validate_invoice_lines(rows):
        invoices = set()
        lines = {}
        for row in rows:
            code = row[:4]
            if code == OFRecordLengths.v100C.name:
                doc_type = row[22:25]
                if doc_type == "320":
                    document = row[25:45].strip()
                    invoices.add(document)

        for row in rows:
            if row.startswith(OFRecordLengths.v110D.name):
                document = row[25:45].strip()
                lines.setdefault(document,0)
                lines[document] += 1

        for invoice in invoices:
            if lines.get(invoice, 0) == 0:
                raise Exception(f"320 WITHOUT 110D {invoice}")

    @staticmethod
    def validate_export_files(export_path):
        txt_path = os.path.join(export_path,OFConfig.filename_bkmv_txt)
        ini_path = os.path.join( export_path,OFConfig.filename_ini_txt)
        zip_path = os.path.join(export_path,OFConfig.filename_bkmv_zip)
        if not os.path.exists(txt_path):raise Exception("TXT.BKMVDATA MISSING")
        if not os.path.exists(ini_path):raise Exception("TXT.INI MISSING")
        if not os.path.exists(zip_path):raise Exception("ZIP MISSING")