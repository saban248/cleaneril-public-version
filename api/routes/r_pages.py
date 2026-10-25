import os
from time import sleep

import markdown
from flask import request, render_template, redirect, url_for, abort, send_from_directory, render_template_string

from api.databases import subscriptions
from api.databases.crads import ApiCards
from api.databases.employee import ApiEmployee
from api.databases.orders import CountOfOrderByStat
from api.databases.ptc import cleaneril, ServerConfig
from api.ptc import ShortSession, get_dictionary_http
from api.routes import cil_struct
from api.routes.pages import get_public_page_action
from api.routes.ptc import RoutePages, Pages
from api.ptc import POV_ABOUTS


@cleaneril.route(RoutePages.home.path, methods=['GET'])
@cleaneril.route("/", methods=['GET'])
def main():
    return render_template(Pages.home.html)


@cleaneril.route(RoutePages.auth.path, methods=['GET'])
def auth():
    if ShortSession.is_admin_active():
        return redirect(url_for('dashboard'))

    return render_template(Pages.auth.html,application_name=ServerConfig.APPLICATION_NAME)


@cleaneril.route(RoutePages.dashboard.path, methods=["GET"])
def dashboard():
    if not ShortSession.is_admin() :
        return redirect(url_for("auth"))
    if ShortSession.is_admin_unactive():
        return redirect(url_for("create_account"))

    breq = get_dictionary_http(request)
    dash = cil_struct.Dashboard().build(**breq)
    manager = ShortSession.manager()
    company = ShortSession.company()
    manager_id = ShortSession.manager_id()
    workers = ApiEmployee.get_employees(manager_id=manager_id).all()
    subscription = subscriptions.get_subscriptions(manager_id=manager_id).first()
    # count_stat_orders
    return render_template(Pages.dashboard.html,
                           company=company,manager=manager, workers=workers)


@cleaneril.route(RoutePages.create_account.path, methods=['GET'])
def create_account():
    return render_template(Pages.register.html)



@cleaneril.route(RoutePages.pov.path, methods=['GET'])
def public_order_verification():
    return render_template(Pages.pov.html2, abouts=POV_ABOUTS)


@cleaneril.route(RoutePages.terms.path, methods=["GET"])
def terms_of_services():

    with open(os.path.join(ServerConfig.PAGES_FOLDER, Pages.terms.md), encoding="utf-8") as f:
        md = f.read()
    html = markdown.markdown(
        md,
        extensions=[
            "extra",
            "nl2br",
            "sane_lists"
        ]
    )

    return render_template(Pages.terms.html, terms=html)


@cleaneril.route("/icons/<path:filename>")
def icons(filename:str):
    if "/" in filename or "\\" in filename:
        abort(404)
    if not filename.endswith(".svg"):
        abort(404)

    return send_from_directory(ServerConfig.ICONS_FOLDER, filename)

@cleaneril.route("/icons")
def list_icons():
    icon_names = sorted(
        filename[:-4]
        for filename in os.listdir(ServerConfig.ICONS_FOLDER)
        if filename.endswith(".svg")
    )
    return render_template("/all-icons.html", icon_names=icon_names)


@cleaneril.route(RoutePages.public.path, methods=['GET'])
def public_pages():
    # p,a,IDs
    breq = get_dictionary_http(request)
    page = get_public_page_action(**breq)
    return page
