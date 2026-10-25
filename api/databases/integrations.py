import time
from api.databases.general import get_columns
from api.databases.ptc import cleaneril_db, ServerConfig
from api.integrations.ptc import IntegrationStat
from api.ptc import generate_hex
from api.validator import core_msg


class Integration(cleaneril_db.Model):
    __tablename__ = 'integration'
    id = cleaneril_db.Column(cleaneril_db.Integer, primary_key=True)
    integration_id = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    company_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    manager_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    provider = cleaneril_db.Column(cleaneril_db.Integer, nullable=False, default=1)
    account_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False)
    account_name = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    access_token = cleaneril_db.Column(cleaneril_db.String(2048), nullable=False)
    refresh_token = cleaneril_db.Column(cleaneril_db.String(2048), nullable=True)
    expires_at = cleaneril_db.Column(cleaneril_db.Float, nullable=True)
    stat = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    created_at = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    update_at = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    imetadata = cleaneril_db.Column(cleaneril_db.String, nullable=False)
    scope = cleaneril_db.Column(cleaneril_db.String(512), nullable=True)
    last_sync_at = cleaneril_db.Column(cleaneril_db.Float, nullable=True)
    last_error = cleaneril_db.Column(cleaneril_db.JSON, nullable=True)


def get_integrations(source:bool = True, **kwargs):
    return get_columns(Integration, source, **kwargs)

def create_integration(manager_id:str, company_id:str, provider:int, account_id:str, access_token:str,
                       refresh_token:str, expires_at:str, scope:list = None):
    exist = get_integrations(manager_id=manager_id,company_id=company_id, provider=provider).first()
    if exist:
        return core_msg.ServerCode.Integration.already_exist

    new = Integration()
    new.integration_id = generate_hex(15)
    new.company_id = company_id
    new.manager_id = manager_id
    new.provider = provider
    new.account_id = account_id
    new.account_name = "unknown"
    new.access_token = access_token
    new.refresh_token = refresh_token
    new.expires_at = expires_at
    new.stat = IntegrationStat.CONNECT
    new.created_at = time.time()
    new.update_at = time.time()
    new.scope = scope or []
    new.imetadata = str()

    cleaneril_db.session.add(new)
    cleaneril_db.session.commit()

    return core_msg.ServerCode.success


