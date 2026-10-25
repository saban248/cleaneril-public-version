import os
from api.databases import orders, company, manager
from api.databases.bridge import fix_order_to_client
from api.databases.manager import delete_manager
from api.databases.marketplace import jobs
from api.general import is_logo_app_valid
from api.openformat.ptc import OFConfig
from api.openformat.services.export import OFExporter
from api.routes.ptc import RegisterApi
from api.routes.r_json import *
from api.routes.r_pages import *
from api.databases.ptc import *
from api.jfunc import *



if __name__ == "__main__":
    with cleaneril.app_context():
        cleaneril_db.create_all()

    cleaneril.run(host="127.0.0.1", port=int(os.getenv("PORT", "80")), debug=False)