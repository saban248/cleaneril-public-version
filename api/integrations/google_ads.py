import secrets
import time
from urllib.parse import urlencode

from flask import session, abort, redirect

from api.databases import integrations
from api.databases.ptc import ServerConfig
from api.integrations.ptc import AppIntegration, GOOGLE_TOKEN_URL, GOOGLE_AUTH_URL
import requests

from api.ptc import ShortSession
from api.validator import core_msg


def build_google_oauth_url():
    state = secrets.token_urlsafe(32)
    session[f"stat_oauth_{AppIntegration.GOOGLE_ADS}"] = state
    params = {
        "client_id": ServerConfig.google_client_id,
        "redirect_uri": ServerConfig.integration_redirect_uri.format(flag=AppIntegration.GOOGLE_ADS),
        "response_type": "code",
        "scope": " ".join(ServerConfig.google_permission_scopes),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
        "include_granted_scopes": "true"
    }

    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def google_ads_callback(code:str):
    __error__ = core_msg.ServerCode.General.something_wrong
    response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": ServerConfig.google_client_id,
            "client_secret": ServerConfig.google_client_secret,
            "code": code,
            "redirect_uri": ServerConfig.integration_redirect_uri.format(
                flag=AppIntegration.GOOGLE_ADS
            ),
            "grant_type": "authorization_code",},timeout=30,
    )
    if not response.ok:
        return __error__

    token = response.json()

    access_token = token.get("access_token")
    refresh_token = token.get("refresh_token")
    expires_in = token.get("expires_in", 3600)
    token_type = token.get("token_type", "Bearer")
    scope = token.get("scope", "")

    expires_at = time.time() + expires_in

    headers = {
        "Authorization": f"Bearer {access_token}",
        "developer-token": ServerConfig.google_ads_developer_token,
    }

    response = requests.get(
        "https://googleads.googleapis.com/v20/customers:listAccessibleCustomers",
        headers=headers,
        timeout=30,
    )
    if not response.ok:
        return __error__

    customers = response.json().get("resourceNames", [])
    if not customers:
        return __error__

    customer_id = customers[0].split("/")[-1]
    manager_id = ShortSession.manager_id()
    company_id = ShortSession.company_id()
    __code__ = integrations.create_integration(manager_id, company_id, AppIntegration.GOOGLE_ADS, customer_id, access_token,
                                    refresh_token, expires_at, scope)

    return __code__


