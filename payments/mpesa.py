import requests
import base64
from datetime import datetime
from decouple import config


class MpesaClient:
    def __init__(self):
        self.env = config("MPESA_ENVIRONMENT", default="sandbox")
        self.consumer_key = config("MPESA_CONSUMER_KEY")
        self.consumer_secret = config("MPESA_CONSUMER_SECRET")
        self.shortcode = config("MPESA_SHORTCODE")
        self.passkey = config("MPESA_PASSKEY")
        self.callback_url = config("MPESA_CALLBACK_URL")

        if self.env == "production":
            self.base_url = "https://api.safaricom.co.ke"
        else:
            self.base_url = "https://sandbox.safaricom.co.ke"

    def get_access_token(self):
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        response = requests.get(url, auth=(self.consumer_key, self.consumer_secret))
        response.raise_for_status()
        return response.json()["access_token"]

    def get_password(self):
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        raw = f"{self.shortcode}{self.passkey}{timestamp}"
        encoded = base64.b64encode(raw.encode()).decode()
        return encoded, timestamp

    def stk_push(self, phone_number, amount, account_ref, description):
        access_token = self.get_access_token()
        password, timestamp = self.get_password()

        phone = str(phone_number).strip()
        if phone.startswith("0"):
            phone = "254" + phone[1:]
        elif phone.startswith("+"):
            phone = phone[1:]

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone,
            "PartyB": self.shortcode,
            "PhoneNumber": phone,
            "CallBackURL": self.callback_url,
            "AccountReference": account_ref,
            "TransactionDesc": description,
        }

        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        response = requests.post(url, json=payload, headers=headers)
        return response.json()