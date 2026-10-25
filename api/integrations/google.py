import time
from dataclasses import dataclass

import requests
from docutils.languages import fa

from api.databases.ptc import ServerConfig
from api.integrations.ptc import AppIntegration, GOOGLE_TOKEN_URL
from api.validator import core_msg
from flask import session


@dataclass(slots=True)
class GoogleOAuthToken:
    access_token: str|None
    refresh_token: str | None
    expires_at: float|None
    token_type: str|None
    scope: str|None

def exchange_google_code(provider, code):
    response = requests.post(GOOGLE_TOKEN_URL,data={
            "client_id": ServerConfig.google_client_id,
            "client_secret": ServerConfig.google_client_secret,
            "code": code,
            "redirect_uri": ServerConfig.integration_redirect_uri.format(flag=provider),
            "grant_type": "authorization_code"
        },
        timeout=15
    )

    if not response.ok:
        return None

    token = response.json()

    return GoogleOAuthToken(
        access_token=token["access_token"],
        refresh_token=token.get("refresh_token"),
        expires_at=time.time() + token.get("expires_in", 3600),
        token_type=token.get("token_type", "Bearer"),
        scope=token.get("scope", "")
    )

def integration(provider:AppIntegration, **breq):
    e = core_msg.ServerMsg[core_msg.ServerCode.General.something_wrong]
    s = core_msg.ServerMsg[core_msg.ServerCode.success]
    error = breq.get("error")
    if error:return error
    code = breq.get("code", None)
    state = breq.get("state", None)
    if not code or not state: e
    if state != session.get(f"oauth_state_{provider}"): return e
    session.pop(f"stat_oauth_{provider}", None)

    auth = exchange_google_code(provider, code)
    if not auth:
        return e

    return s

