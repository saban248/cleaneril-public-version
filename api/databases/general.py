from typing import Callable

from sqlalchemy.orm import Query

from api.databases.ptc import cleaneril_db

unknown = 'unknown'

def get_column_no_instance(column:Query):
    copy = column.__dict__

    del copy['_sa_instance_state']
    return copy


def get_columns_no_instance(columns:list):
    temp = []
    for column in columns:
        temp.append(get_column_no_instance(column))
    return temp

def get_columns_as_dict(data):
    if hasattr(data, "__table__"):
        return {c.name: getattr(data, c.name)for c in data.__table__.columns}

    return [{c.name: getattr(e, c.name) for c in e.__table__.columns} for e in data]


def get_columns(table:cleaneril_db.Model, source:bool = True, *args, **kwargs):
    columns = table.query.filter_by(**kwargs)
    if source:
        return columns
    return get_columns_as_dict(columns)


def get_latest_columns(table:cleaneril_db.Model, source, key:Callable, **kwargs):
    columns = get_columns(table, source, **kwargs)
    return sorted(columns, key=lambda column: key(column), reverse=True)

def delete_column(table:cleaneril_db.Model, column):
    if not column:return
    cleaneril_db.session.delete(column)
    cleaneril_db.session.commit()

