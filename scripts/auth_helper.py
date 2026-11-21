#!/usr/bin/env python3
"""One-shot OAuth helper for the local machine.

Writes the consent URL to state/auth_url.txt AND prints it, then serves the loopback
callback on a fixed port until the user approves. Saves token.json on success.

  python -u scripts/auth_helper.py
"""
import json
import os
import sys

from google_auth_oauthlib.flow import Flow

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]
PORT = 8765
REDIRECT = f"http://localhost:{PORT}/"

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(here)

flow = Flow.from_client_secrets_file(
    "client_secret.json", scopes=SCOPES, redirect_uri=REDIRECT,
)
url, _ = flow.authorization_url(
    access_type="offline", include_granted_scopes="true", prompt="consent",
)
os.makedirs("state", exist_ok=True)
with open("state/auth_url.txt", "w", encoding="utf-8") as f:
    f.write(url)
print("AUTH_URL " + url, flush=True)

# Loopback server: Google redirects here with ?code=...
import http.server
import socketserver
import threading
import urllib.parse

code_holder = {}


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        q = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(q)
        code = params.get("code", [None])[0]
        err = params.get("error", [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        if code:
            code_holder["code"] = code
            self.wfile.write(b"<h2>Authorized.</h2><p>You can close this tab and return to the agent.</p>")
        else:
            self.wfile.write(f"<h2>Not authorized.</h2><p>{err}</p>".encode())
        threading.Thread(target=self.server.shutdown, daemon=True).start()

    def log_message(self, *a):
        pass


with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    httpd.timeout = 600
    print(f"LISTENING on {REDIRECT}", flush=True)
    httpd.serve_forever()

if "code" not in code_holder:
    sys.exit("no code received")

flow.fetch_token(code=code_holder["code"])
creds = flow.credentials
with open("token.json", "w", encoding="utf-8") as f:
    f.write(creds.to_json())
try:
    os.chmod("token.json", 0o600)
except OSError:
    pass

from yt_auth import get_service  # noqa: E402

yt = get_service()
r = yt.channels().list(part="snippet", mine=True).execute()
for c in r.get("items", []):
    print(f"CONNECTED: {c['snippet']['title']} ({c['id']})", flush=True)
with open("state/auth_done.txt", "w", encoding="utf-8") as f:
    json.dump({"ok": True, "items": r.get("items", [])}, f)
