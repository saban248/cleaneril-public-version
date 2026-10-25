from typing import Union

from werkzeug.security import check_password_hash, generate_password_hash

from api.databases.ptc import cleaneril_db, ManagerPermissions, ServerConfig
from api.ptc import generate_hex
from api.validator import core_msg

unknown = 'unknown'

class Employee(cleaneril_db.Model):
    __tablename__ = "employee"
    key = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, primary_key=True)
    username = cleaneril_db.Column(cleaneril_db.String(64), nullable=False)
    permission = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    password = cleaneril_db.Column(cleaneril_db.String(255), nullable=False)
    employee_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    phone = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    idc = cleaneril_db.Column(cleaneril_db.String(14), nullable=False)
    manager_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    profit_sharing = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    pay_vat = cleaneril_db.Column(cleaneril_db.Boolean, nullable=False, default=False)


class ApiEmployee:

    @staticmethod
    def create_employee(employee_id:str, manager_id:str):
        worker = None
        if employee_id:
            worker = ApiEmployee.get_employees(employee_id=employee_id).first()
        if worker:return worker
        return ApiEmployee.add_employee(ServerConfig.DEF_wNAME, ServerConfig.DEF_wPWD, manager_id, employee_id)

    @staticmethod
    def add_employee(name:str, pwd:str, mid:str, employee_id:str = None, permission:int = ManagerPermissions.VIEW,
                        phone:str = unknown, idc:str = "0", ps:int = ServerConfig.DEFAULT_GPSE, pay_vat:bool = False):
        employee = None
        if not employee_id:
            employee = Employee()
            employee.employee_id = generate_hex(15)
        else:
            employee = ApiEmployee.get_employees(employee_id=employee_id).first()

        employee.password = generate_password_hash(pwd)
        employee.username = name
        employee.phone = phone
        employee.idc = idc
        employee.manager_id = mid
        employee.profit_sharing = ps
        employee.permission = permission
        employee.pay_vat = pay_vat
        if not employee_id:
            cleaneril_db.session.add(employee)
        cleaneril_db.session.commit()
        return employee

    @staticmethod
    def get_employees(source:bool = True, **kwargs):
        employees = Employee.query.filter_by(**kwargs)
        if source:
            return employees

        return [
            {column.name: getattr(employee, column.name)
             for column in Employee.__table__.columns
             if column.name != "password"}
            for employee in employees
        ]

    @staticmethod
    def get_employees_search(manager_id):
        employees = ApiEmployee.get_employees(manager_id=manager_id)
        __data__ =  [{"username":e.username, "employee_id":e.employee_id}for e in employees]
        __data__.append({"username":"אני (מנהל)", "employee_id":manager_id})
        return __data__

    @staticmethod
    def auth(**kwargs):
        supplied_password = kwargs.pop("password", None)
        if supplied_password is None:
            return 1

        employees = ApiEmployee.get_employees(**kwargs).all()
        for employee in employees:
            stored_password = employee.password or ""
            if stored_password.startswith(("pbkdf2:", "scrypt:")):
                try:
                    matched = check_password_hash(stored_password, supplied_password)
                except (TypeError, ValueError):
                    matched = False
            else:
                # Backward compatibility; upgrade only after a successful match.
                matched = stored_password == supplied_password
                if matched:
                    employee.password = generate_password_hash(supplied_password)
                    cleaneril_db.session.commit()
            if matched:
                return 0
        return 1

    @staticmethod
    def delete_employee(mid:str, wid:str):
        employee = ApiEmployee.get_employees(manager_id=mid, employee_id=wid).first()
        if not employee:
            return core_msg.ServerCode.General.something_wrong

        cleaneril_db.session.delete(employee)
        cleaneril_db.session.commit()
        return core_msg.ServerCode.success
