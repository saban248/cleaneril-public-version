from dataclasses import dataclass
from typing import Any

import requests


@dataclass(slots=True)
class CheckoutResult:
    url: str
    low_profile_id: str
    raw: dict[str, Any]


@dataclass(slots=True)
class LowProfileResult:
    success: bool
    response_code: int
    description: str

    low_profile_id: str | None
    transaction_id: int |None
    return_value: str | None

    token_info: dict[str, Any] | None
    transaction_info: dict[str, Any] | None
    document_info: dict[str, Any] | None

    raw: dict[str, Any]

    @property
    def token(self) -> str | None:
        if not self.token_info:
            return None
        return self.token_info.get("Token")

    @property
    def card_number(self) -> str | None:
        if not self.token_info:
            return None
        return self.token_info.get("CardNumber")

    @property
    def card_expiry(self) -> str | None:
        if not self.token_info:
            return None
        return self.token_info.get("CardExpiration")

    @property
    def has_token(self) -> bool:
        return self.token is not None


class CardComSubscription:
    BASE_URL = "https://secure.cardcom.solutions/api/v11"

    def __init__(
        self,
        terminal_number: int,
        api_name: str,
        timeout: int = 30,
    ):
        self.terminal_number = terminal_number
        self.api_name = api_name
        self.timeout = timeout

        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "CleanerIL/1.0",
        })

    def create(
        self,
        *,
        amount: float,
        return_value: str,
        success_url: str,
        failed_url: str,
        webhook_url: str,
        customer_name: str,
        customer_email: str,
        description: str,
    ) -> CheckoutResult:

        data = self._post(
            "/LowProfile/Create",
            {
                "TerminalNumber": self.terminal_number,
                "ApiName": self.api_name,
                "Amount": amount,
                "ReturnValue": return_value,
                "SuccessRedirectUrl": success_url,
                "FailedRedirectUrl": failed_url,
                "WebHookUrl": webhook_url,
                "Document": {
                    "Name": customer_name,
                    "Email": customer_email,
                    "Products": [{
                        "Description": description,
                        "UnitCost": amount,
                    }]
                }
            }
        )

        url = data.get("Url")
        low_profile_id = data.get("LowProfileId")

        if not url:
            raise RuntimeError("CardCom did not return Url.")

        if not low_profile_id:
            raise RuntimeError("CardCom did not return LowProfileId.")

        return CheckoutResult(url=url,low_profile_id=low_profile_id,raw=data,)

    def get_result(self, low_profile_id: str) -> LowProfileResult:

        data = self._post(
            "/LowProfile/GetLpResult",
            {
                "TerminalNumber": self.terminal_number,
                "ApiName": self.api_name,
                "LowProfileId": low_profile_id,
            },
        )

        return self._parse_result(data)

    def webhook(self, payload: dict[str, Any]) -> LowProfileResult:
        return self._parse_result(payload)

    def _post(
        self,
        endpoint: str,
        body: dict[str, Any],
    ) -> dict[str, Any]:

        response = self.session.post(
            self.BASE_URL + endpoint,
            json=body,
            timeout=self.timeout,
        )

        response.raise_for_status()

        try:
            data = response.json()
        except ValueError:
            raise RuntimeError("CardCom returned invalid JSON.")

        if data.get("ResponseCode") != 0:
            raise RuntimeError(
                data.get("Description", "CardCom request failed.")
            )

        return data

    @staticmethod
    def _parse_result(data: dict[str, Any]) -> LowProfileResult:

        return LowProfileResult(
            success=data.get("ResponseCode") == 0,
            response_code=data.get("ResponseCode", -1),
            description=data.get("Description", ""),
            low_profile_id=data.get("LowProfileId"),
            transaction_id=data.get("TranzactionId"),
            return_value=data.get("ReturnValue"),
            token_info=data.get("TokenInfo"),
            transaction_info=data.get("TranzactionInfo"),
            document_info=data.get("DocumentInfo"),
            raw=data,
        )