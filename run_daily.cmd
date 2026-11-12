@echo off
rem BodyQuest 3D - daily autopilot runner (youtube-master-autopilot DAILY)
rem Runs the full loop: trend research -> topic -> produce video -> upload (private) -> log.
rem --auto: approve permissions (headless)  --archived: keep session lists clean  --title: findable in journal
cd /d "C:\Users\TB KING"
"C:\Users\TB KING\AppData\Local\Programs\ai.opencode.desktop\resources\opencode-cli.exe" run --auto --archived --title "BodyQuest DAILY" "Run the youtube-master-autopilot skill in DAILY mode: produce today's BodyQuest 3D Short end to end (research topic -> script -> render -> upload PRIVATE) and update state/journal.md. Follow the skill exactly." >> "C:\Users\TB KING\youtube-master\state\autopilot.log" 2>&1
