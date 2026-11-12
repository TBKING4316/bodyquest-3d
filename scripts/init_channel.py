#!/usr/bin/env python3
"""Create a channel project folder with config, .gitignore and the daily runner.

  python init_channel.py my-channel --hint "personal finance for students"
"""
import argparse, json, os, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

p = argparse.ArgumentParser()
p.add_argument("folder")
p.add_argument("--hint", default="", help="short niche hint; empty = Claude picks from trends")
p.add_argument("--language", default="en")
a = p.parse_args()

os.makedirs(os.path.join(a.folder, "episodes"), exist_ok=True)
os.makedirs(os.path.join(a.folder, "scripts"), exist_ok=True)
for f in os.listdir(HERE):
    if f.endswith((".py", ".sh", ".ps1")) and f != "init_channel.py":
        shutil.copy(os.path.join(HERE, f), os.path.join(a.folder, "scripts", f))
cfg = json.load(open(os.path.join(ROOT, "templates", "channel-config.json"), encoding="utf-8"))
cfg["niche_hint"] = a.hint
cfg["niche_mode"] = "hint" if a.hint else "auto"
cfg["language"] = a.language
cfg_path = os.path.join(a.folder, "channel-config.json")
if not os.path.exists(cfg_path):
    json.dump(cfg, open(cfg_path, "w", encoding="utf-8"), indent=2)
shutil.copy(os.path.join(ROOT, "templates", "requirements.txt"), os.path.join(a.folder, "requirements.txt"))
open(os.path.join(a.folder, ".gitignore"), "w").write("client_secret.json\ntoken.json\n_build/\n*.log\n.env\n")
print(f"Created {a.folder}. Next: pip install -r requirements.txt, add client_secret.json, run scripts/yt_auth.py")
