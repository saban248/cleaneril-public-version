from time import sleep

from flask import abort, render_template

from api.api_action import get_client_order_template
from api.databases import orders
from api.databases.manager import ApiManager
from api.databases.orders import CleanOrder
from api.ptc import SJson
from api.routes import cil_struct
from api.routes.ptc import PublicPage
from api.validator import core_msg


def get_public_page_action(**breq):
    # sleep(1)
    page = int(breq.get('p', 0))
    match page:
        case PublicPage.client_order_view:
            return render_template('/public/client/view.html')