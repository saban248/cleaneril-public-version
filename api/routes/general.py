from flask import session

from api.ptc import ShortSession


def set_session_data_register(register):
    ...

def set_session_data_admin(manager, company):
    ShortSession.set_admin_details(manager, company)

