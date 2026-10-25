from datetime import time

from werkzeug.security import check_password_hash, generate_password_hash
from typing import Union


from api.databases import company as companies
from api.databases.ptc import cleaneril_db, ManagerPermissions, ManagerAccountStat, CompanyTaxType
from api.ptc import generate_hex
from api.routes.ptc import RegisterApi
from api.validator import core_msg, company as comp
import time

from werkzeug.security import check_password_hash, generate_password_hash


class Manager(cleaneril_db.Model):
    __tablename__ = "manager"
    key = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, primary_key=True)
    username = cleaneril_db.Column(cleaneril_db.String(64), nullable=False)
    permission = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    password = cleaneril_db.Column(cleaneril_db.String(255), nullable=False)
    manager_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    phone = cleaneril_db.Column(cleaneril_db.String(16), nullable=False)
    time_alive = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    time_register = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    account_stat = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    account_approved = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False)
    phone_verified = cleaneril_db.Column(cleaneril_db.Boolean, nullable=True, default=False)


def update_time_alive(manager_id:str):
    manager = ApiManager.get_managers(manager_id=manager_id).first()
    if not manager:
        return 1
    manager.time_alive = time.time()
    cleaneril_db.session.commit()
    return 0


def set_account_stat(manager_id:str,ac:ManagerAccountStat):
    manager = ApiManager.get_managers(manager_id=manager_id).first()
    if not manager:
        return core_msg.ServerCode.General.something_wrong
    manager.account_stat = ac
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success

def manager_exist(phone:str):
    manager = Manager.query.filter_by(phone=phone).first()
    return manager is not None


def _password_matches(stored_password: str, supplied_password: str) -> bool:
    """Verify a hashed password and transparently upgrade legacy plaintext records."""
    if not stored_password or supplied_password is None:
        return False
    if stored_password.startswith(("pbkdf2:", "scrypt:")):
        try:
            return check_password_hash(stored_password, supplied_password)
        except (TypeError, ValueError):
            return False

    # Backward compatibility for accounts created before password hashing.
    if stored_password == supplied_password:
        return True
    return False


def manager_auth(phone:str, password:str) -> Union[None, Manager]:
    manager = Manager.query.filter_by(phone=phone).first()
    if not manager or not _password_matches(manager.password, password):
        return None

    # Upgrade a legacy plaintext password only after successful authentication.
    if not manager.password.startswith(("pbkdf2:", "scrypt:")):
        manager.password = generate_password_hash(password)
        cleaneril_db.session.commit()
    return manager


def set_manager_approve(manager_id:str):
    manager = ApiManager.get_managers(manager_id=manager_id).first()
    if not manager:
        return core_msg.ServerCode.General.something_wrong

    manager.account_approved = True
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success

class ApiManager:
    @staticmethod
    def register(phone:str, permission:int, password:str, account_stat:ManagerAccountStat = ManagerAccountStat.PENDING,
                 phone_verified:bool = False):

        # A phone number identifies the account; don't compare a plaintext password in SQL.
        manager = ApiManager.get_managers(phone=phone).first()
        if manager:
            return None

        new = Manager()
        new.username = generate_hex(10)+phone[-4::]
        new.password = generate_password_hash(password)
        new.permission = permission
        new.manager_id = generate_hex(15)
        new.phone = phone
        new.time_alive = 0
        new.time_register = time.time()
        new.account_stat = account_stat
        new.account_approved = False
        new.phone_verified = phone_verified
        cleaneril_db.session.add(new)
        cleaneril_db.session.commit()

        return new

    @staticmethod
    def get_managers(source:bool = True, **kwargs) -> Union[None, Manager, list]:
        managers = Manager.query.filter_by(**kwargs)
        if source:
            return managers

        temp = []
        for manager in managers:
            copy =  manager.__dict__
            del copy['_sa_instance_state']
            temp.append(copy)
        return temp

    @staticmethod
    def auth(**kwargs):
        supplied_password = kwargs.pop("password", None)
        if supplied_password is None:
            return core_msg.ServerCode.General.access_denied
        managers = ApiManager.get_managers(**kwargs).all()
        for manager in managers:
            if _password_matches(manager.password, supplied_password):
                if not manager.password.startswith(("pbkdf2:", "scrypt:")):
                    manager.password = generate_password_hash(supplied_password)
                    cleaneril_db.session.commit()
                return core_msg.ServerCode.success
        return core_msg.ServerCode.General.access_denied


def delete_manager(username:str, password:str, **kwargs):
    manager = ApiManager.get_managers(username=username, **kwargs).first()
    if not manager or not _password_matches(manager.password, password):
        return core_msg.ServerCode.General.access_denied
    cleaneril_db.session.delete(manager)
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success


def delete_by_manager_id(manager_id:str):
    manager = ApiManager.get_managers(manager_id=manager_id).first()
    if not manager:return core_msg.ServerCode.General.something_wrong
    cleaneril_db.session.delete(manager)
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success

def delete_manager_account(manager_id:str):
    manager = ApiManager.get_managers(manager_id=manager_id).first()
    company = companies.get_companies(manager_id=manager_id).first()
    if not manager or not company:
        return core_msg.ServerCode.General.something_wrong
    cleaneril_db.session.delete(manager)
    cleaneril_db.session.delete(company)
    cleaneril_db.session.commit()
    return core_msg.ServerCode.success

def on_register_create_company(phone:str, pwd:str) -> int:
    null = 'unknown'
    new = ApiManager.register(phone, -1, pwd)
    if not new:return core_msg.ServerCode.Register.e_account_exist
    companies.create_company(null,null,new.manager_id,CompanyTaxType.PATOOR)
    return core_msg.ServerCode.success


def on_delete_manager_delete_company(user:str, pwd:str) -> int:
    delete_manager(user,pwd)
    # delete_company();


def get_list_manager_no_pwd():
    managers = ApiManager.get_managers(False)
    for m in managers:
        del m['password']

    return managers


def phone_verified(manager_id:str|Manager):
    if isinstance(manager_id, Manager):
        manager_id.phone_verified = True
        cleaneril_db.session.commit()

    elif isinstance(manager_id, str):
        manager = ApiManager.get_managers(manager_id=manager_id).first()
        if not manager:return core_msg.ServerCode.General.something_wrong
        manager.phone_verified = True
        cleaneril_db.session.commit()

    return core_msg.ServerCode.success


def is_phone_verified(manager_id:str):
    manager = ApiManager.get_managers(manager_id=manager_id).first()
    if not manager:return False

    return manager.phone_verified




