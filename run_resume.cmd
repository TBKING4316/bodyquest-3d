@echo off
rem BodyQuest 3D - Continuity Watchdog
rem Runs every 2 hours. If a session was cut by the model limit mid-task, the
rem journal carries a PENDING line; this run finishes that work automatically
rem (pinned to the free model, same as the daily task). If nothing is pending
rem it exits cheaply with a one-line reply. Since 2026-11-16 production is
rem cloud-first (GitHub Actions); the watchdog also feeds the cloud authoring
rem queue when its owner session ordered it, and emails the private report
rem address from state/private.yaml (never hardcoded here).
cd /d "C:\Users\TB KING\youtube-master"
git pull --rebase --autostash >> "C:\Users\TB KING\youtube-master\state\watchdog.log" 2>&1
"C:\Users\TB KING\AppData\Local\Programs\ai.opencode.desktop\resources\opencode-cli.exe" run --auto --archived --model opencode/glm-5.3-flash-free --title "BodyQuest CONTINUITY" "You are the BodyQuest 3D continuity watchdog (resume-on-limit). Steps: (1) Read state/journal.md - check the last 20 lines only. RESUME RULE: if any line ends with | PENDING (or text 'INCOMPLETE' / 'not done'), that is work a limit-cut session left unfinished: complete exactly that work now using the youtube-master skill + scripts in the repo, verify it, append a journal line ending | COMPLETE (keep the original PENDING line, do not delete it), commit and push. (2) If no PENDING/INCOMPLETE work exists: reply only 'nothing pending' and do NOTHING else - no production, no settings changes, no extra checks (GitHub Actions owns production since 2026-11-16; the 16:00 local daily run owns fallback + authoring + reports). (3) NEW WORK RULE: complete+test+commit+push after every sub-task. (4) If you completed PENDING work in step (1), email the report address from state/private.yaml via the Zapier outbound action (subject 'BodyQuest 3D WATCHDOG: pending work completed', from_name 'BodyQuest 3D Autopilot') a short report of what was pending and what you did - the user must hear about autonomous completions, never only in the journal. (5) If you cannot finish within this run, append a journal line ending | PENDING describing exactly what remains, commit+push, and stop - the next watchdog picks it up." >> "C:\Users\TB KING\youtube-master\state\watchdog.log" 2>&1
git add -A state >> "C:\Users\TB KING\youtube-master\state\watchdog.log" 2>&1
git diff --cached --quiet || (git -c user.name="BodyQuest-local" -c user.email="bodyquest@local" commit -m "watchdog: %date% %time%" >> "C:\Users\TB KING\youtube-master\state\watchdog.log" 2>&1 && git push >> "C:\Users\TB KING\youtube-master\state\watchdog.log" 2>&1)
