import time

from sqlalchemy import JSON

from api.databases.general import get_columns, get_latest_columns, delete_column
from api.databases.ptc import cleaneril_db
from api.ptc import generate_hex


class ClientProfile(cleaneril_db.Model):
    __tablename__ = "client_profile"
    key = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, primary_key=True)
    client_id = cleaneril_db.Column(cleaneril_db.String(16), nullable=False)
    manager_id = cleaneril_db.Column(cleaneril_db.String(16), nullable=False)
    fullname = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    address = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    phone = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    notes = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    timestamp_entered = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    coordinates = cleaneril_db.Column(JSON, nullable=False)


def get_clients(source:bool = True, **kwargs):
    return get_columns(ClientProfile, source, **kwargs)


def get_clients_latest(**kwargs):
    return get_latest_columns(ClientProfile, lambda c:c.timestamp_entered, **kwargs)


def create_client_profile(manager_id:str, fullname:str, address:str, phone:str, notes:str, coordinates:list):
    exist = get_clients(manager_id=manager_id,fullname=fullname, phone=phone).first()
    if exist:return exist
    client = ClientProfile()
    client.client_id = generate_hex(15)
    client.fullname = fullname
    client.address = address
    client.phone = phone
    client.notes = notes
    client.timestamp_entered = time.time()
    client.coordinates = coordinates
    client.manager_id = manager_id
    cleaneril_db.session.add(client)
    cleaneril_db.session.commit()
    return client


def edit_exist_client(response):...

def delete_client(client_id):
    delete_column(ClientProfile, get_clients(client_id=client_id).first())

