"""SMS alerts through Africa's Talking.

Rule: a message NEVER contains a child's name, offence or evidence.
Only the tracking code, a date and a place. With SMS_ENABLED=False
(the default for the demo) messages are logged instead of sent.
"""

import json
import logging
import os
import urllib.parse
import urllib.request

logger = logging.getLogger("tuliwamu.sms")
SENT = []  # last messages, kept in memory for the demo and tests

AT_URLS = {
    "sandbox": "https://api.sandbox.africastalking.com/version1/messaging",
    "live": "https://api.africastalking.com/version1/messaging",
}


def send_sms(phone, message):
    if not phone:
        return False
    SENT.append((phone, message))
    del SENT[:-50]
    if os.getenv("SMS_ENABLED", "False").lower() != "true":
        logger.info("SMS (not sent, SMS_ENABLED=False) to %s: %s", phone, message)
        return False

    username = os.getenv("AT_USERNAME", "sandbox")
    data = {"username": username, "to": phone, "message": message}
    if os.getenv("AT_SENDER_ID"):
        data["from"] = os.getenv("AT_SENDER_ID")
    request = urllib.request.Request(
        AT_URLS["sandbox" if username == "sandbox" else "live"],
        data=urllib.parse.urlencode(data).encode(),
        headers={"apiKey": os.getenv("AT_API_KEY", ""), "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            json.load(response)
        return True
    except Exception:  # an SMS failure must never block the legal workflow
        logger.exception("SMS to %s failed", phone)
        return False
