@echo off
rem BodyQuest 3D - daily autopilot runner (youtube-master-autopilot DAILY)
rem Full loop: sync state -> pending uploads -> produce (if not covered) -> upload (private) -> log -> push state.
rem The GitHub repo (TBKING4316/bodyquest-3d) is the shared ledger with the cloud fallback; pull keeps dedupe exact.
cd /d "C:\Users\TB KING\youtube-master"
git pull --rebase --autostash >> "C:\Users\TB KING\youtube-master\state\autopilot.log" 2>&1
"C:\Users\TB KING\AppData\Local\Programs\ai.opencode.desktop\resources\opencode-cli.exe" run --auto --archived --title "BodyQuest DAILY" "Run the youtube-master-autopilot skill in DAILY mode. Follow channel.yaml never_stop.catch_up_contract exactly: FIRST upload any pending uploads (state/uploads.yaml visibility pending_upload_local) via Zapier as private, THEN if state/journal.md has no DAILY line for today, produce today's BodyQuest 3D Short end to end (research topic -> script -> render with SOFTWARE_GL=1 -> upload PRIVATE), notify email per state/notifications.yaml, and update state ledgers." >> "C:\Users\TB KING\youtube-master\state\autopilot.log" 2>&1
git add -A state facts videos channel.yaml >> "C:\Users\TB KING\youtube-master\state\autopilot.log" 2>&1
git diff --cached --quiet || (git -c user.name="BodyQuest-local" -c user.email="bodyquest@local" commit -m "local daily: %date% %time%" >> "C:\Users\TB KING\youtube-master\state\autopilot.log" 2>&1 && git push >> "C:\Users\TB KING\youtube-master\state\autopilot.log" 2>&1)
