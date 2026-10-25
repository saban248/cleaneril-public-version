from typing import Union

from api.databases.general import get_columns
from api.databases.ptc import cleaneril_db, ServerConfig
from api.ptc import generate_hex
from api.routes.ptc import RegisterApi
from api.validator import core_msg


unknown = 'unknown'

class Company(cleaneril_db.Model):
    __tablename__ = "settings"
    key = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, primary_key=True)
    logo_path = cleaneril_db.Column(cleaneril_db.String(256), nullable=False)
    company_name = cleaneril_db.Column(cleaneril_db.String(60), nullable=False)
    owner_fullname = cleaneril_db.Column(cleaneril_db.String(60), nullable=False)
    company_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    manager_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    company_description = cleaneril_db.Column(cleaneril_db.String(100), nullable=False)
    vat_company = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, default=False)
    owner_phone = cleaneril_db.Column(cleaneril_db.String(20), nullable=False, default=False)
    company_phone = cleaneril_db.Column(cleaneril_db.String(20), nullable=False, default=False)
    company_email = cleaneril_db.Column(cleaneril_db.String(50), nullable=False, default=False)
    company_VAT = cleaneril_db.Column(cleaneril_db.String(32), nullable=False, default=False)
    # general profit sharing employee
    gpse = cleaneril_db.Column(cleaneril_db.Integer, nullable=True, default=50)
    register_level = cleaneril_db.Column(cleaneril_db.Integer, nullable=True, default=-1)
    company_approved = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False, default=False)
    show_vat_code_order = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False, default=False)



def get_companies(source:bool = True, **kwargs) -> Union[Company, list[Union[dict, Company]]]:
    return get_columns(Company, source, **kwargs)



def create_company(c_name:str, o_name:str, manager_id:str, c_vat:int, register_level:int = 0):
    company = Company.query.filter_by(manager_id=manager_id).first()
    if company:return 1
    new_company = Company()
    new_company.company_name = c_name
    new_company.owner_fullname = o_name
    new_company.manager_id = manager_id
    new_company.vat_company = c_vat
    new_company.company_id = generate_hex(15)
    new_company.logo_path = ServerConfig.DEFAULT_COMPANY_LOGO
    new_company.company_description = "unknown"
    new_company.company_phone = "unknown"
    new_company.owner_phone = "unknown"
    new_company.company_email = ServerConfig.DEFAULT_COMPANY_EMAIL
    new_company.company_VAT = "000-000-000"
    new_company.gpse = ServerConfig.DEFAULT_GPSE
    new_company.register_level = register_level or RegisterApi.level2
    new_company.company_approved = False
    new_company.show_vat_code_order = False#default

    cleaneril_db.session.add(new_company)
    cleaneril_db.session.commit()

    return new_company


def update_company_details(manager_id:str, c_name:str = None, o_name:str = None, c_vat:int = None,
                           c_desc:str = None, c_phone:str = None, o_phone:str = None, c_email:str = None, c_vat_code:str = None,
                           c_gpse:int = None, r_level:int = -1, show_vat_code_order:bool = False):
    company:Company = get_companies(manager_id=manager_id).first()
    if not company:return core_msg.ServerCode.General.something_wrong
    if c_name:
        company.company_name = c_name
    if o_name:
        company.owner_fullname = o_name
    if c_vat is not None:
        company.vat_company = c_vat
    if c_desc:
        company.company_description = c_desc
    if c_phone:
        company.company_phone = c_phone
    if o_phone:
        company.owner_phone = o_phone
    if c_email:
        company.company_email = c_email
    if c_vat_code:
        company.company_VAT = c_vat_code
    if c_gpse:
        company.gpse = c_gpse
    if r_level and not r_level == -1:
        company.register_level = r_level
    if show_vat_code_order is not None:
        company.show_vat_code_order = show_vat_code_order

    cleaneril_db.session.commit()
    return core_msg.ServerCode.success


def change_logo(manager_id:str, logo_filename:str):
    company:Company = get_companies(manager_id=manager_id).first()
    if not company:return core_msg.ServerCode.General.something_wrong

    company.logo_path = logo_filename
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success


def delete_company(manager_id:str):
    company:Company = get_companies(manager_id=manager_id).first()
    if not company:return core_msg.ServerCode.General.something_wrong
    cleaneril_db.session.delete(company)
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success



def set_company_approve(manager_id:str):
    company:Company = get_companies(manager_id=manager_id).first()
    if not company:return core_msg.ServerCode.General.something_wrong
    company.company_approved = True
    cleaneril_db.session.commit()

    return core_msg.ServerCode.success