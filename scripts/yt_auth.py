#!/usr/bin/env python3
"""Shared YouTube auth. Official Data API v3, user's own OAuth login only.

  python yt_auth.py login     # opens a browser once, saves token.json
  python yt_auth.py whoami    # prints the connected channel name and id
"""
import os, sys

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",  # comments, captions, thumbnails
]


def get_service(client_secret="client_secret.json", token_file="token.json", api="youtube", version="v3"):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    creds = None
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(client_secret):
                sys.exit(f"Missing {client_secret}. See references/youtube-ops.md, step 1.")
            creds = InstalledAppFlow.from_client_secrets_file(client_secret, SCOPES).run_local_server(port=0)
        with open(token_file, "w") as f:
            f.write(creds.to_json())
        try:
            os.chmod(token_file, 0o600)
        except OSError:
            pass
    return build(api, version, credentials=creds)


if __name__ == "__main__":
    yt = get_service()
    r = yt.channels().list(part="snippet", mine=True).execute()
    for c in r.get("items", []):
        print(f"Connected: {c['snippet']['title']} ({c['id']})")
    if not r.get("items"):
        print("Logged in, but this Google account has no YouTube channel yet. Create one in YouTube Studio.")
