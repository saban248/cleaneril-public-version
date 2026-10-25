from api.databases.ptc import cleaneril_db


class ManagerPayment(cleaneril_db.Model):
    __tablename__ = "manager_payment"

    key = cleaneril_db.Column(cleaneril_db.Integer, primary_key=True)
    manager_id = cleaneril_db.Column(cleaneril_db.String(32), nullable=False, index=True)
    amount = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    plan_type = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)
    time_created = cleaneril_db.Column(cleaneril_db.Float, nullable=False)
    transaction_id = cleaneril_db.Column(cleaneril_db.String(128))
    external_transaction_id = cleaneril_db.Column(cleaneril_db.String(128))
    status = cleaneril_db.Column(cleaneril_db.Integer, nullable=False)