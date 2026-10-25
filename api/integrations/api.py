
from api.integrations.google_ads import build_google_oauth_url, google_ads_callback
from api.integrations.google_calendar import build_google_calendar_oauth_url
from api.integrations.ptc import AppIntegration
from flask import session, abort, redirect

from api.ptc import SJson
from api.routes.ptc import RoutePages
from api.validator import core_msg



def get_integrations_api(**breq):
    integration = int(breq.get("integration", -1))
    __success__ = core_msg.ServerCode.success
    match integration:
        case AppIntegration.GOOGLE_ADS:
            return SJson.auto_code(__success__, **{"redirect":build_google_oauth_url()})
        case AppIntegration.GOOGLE_CALENDAR:
            return SJson.auto_code(__success__, **{"redirect":build_google_calendar_oauth_url()})
    return ''

def set_interactions_api(integration:int, **breq):
    __success__ = core_msg.ServerCode.success
    __error__ = core_msg.ServerCode.General.something_wrong
    integration = int(integration)
    last_state = session.get(f"stat_oauth_{integration}")
    index = f"{RoutePages.dashboard.path}?show=&integrationnotice={{n}}"
    session.pop(f"oauth_state_{integration}", None)
    match integration:
        case AppIntegration.GOOGLE_ADS:
            error = breq.get("error", core_msg.ServerMsg[__error__] or str())
            state = breq.get("state")
            code = breq.get("code", str())
            if error or (not code or state) or (last_state is None or last_state != state):
                return redirect(index.format(n=error))
            __success__ = google_ads_callback(code)
            return redirect(index.format(n=core_msg.ServerMsg[__success__]))

        case AppIntegration.GOOGLE_CALENDAR:
            error = breq.get("error", core_msg.ServerMsg[__error__] or str())
            state = breq.get("state")
            code = breq.get("code", str())
            if error or (not code or state) or (last_state is None or last_state != state):
                return redirect(index.format(n=error))
            __success__ = google_ads_callback(code)


    return abort(400)