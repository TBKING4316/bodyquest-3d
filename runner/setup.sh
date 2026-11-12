#!/bin/bash
# Cloud runner setup (ubuntu-latest): node + ffmpeg + chrome + python env + models.
set -euo pipefail
echo "::group::apt deps"
sudo apt-get update -qq
sudo apt-get install -y -qq ffmpeg wget gnupg >/dev/null
echo "::endgroup::"

echo "::group::chrome"
if ! command -v google-chrome >/dev/null; then
  wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg
  echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list >/dev/null
  sudo apt-get update -qq && sudo apt-get install -y -qq google-chrome-stable >/dev/null
fi
echo "::endgroup::"

echo "::group::python env"
FH="${FACELESS_HOME:-$HOME/.faceless-shorts}"
mkdir -p "$FH"
python3 -m venv "$FH/venv"
PY="$FH/venv/bin/python"
"$PY" -m pip install -q --upgrade pip
"$PY" -m pip install -q numpy scipy kokoro-onnx faster-whisper
"$PY" -m pip install -q -r "$GITHUB_WORKSPACE/requirements.txt"   # google API client for direct upload
echo "::endgroup::"

echo "::group::models (Kokoro ~340MB + Whisper small.en ~500MB)"
"$PY" "$GITHUB_WORKSPACE/skill/scripts/voice.py" --download
"$PY" -c "from faster_whisper import WhisperModel; WhisperModel('small.en', device='cpu', compute_type='int8')"
echo "::endgroup::"

echo "All set"
