#!/usr/bin/env python3
"""Text to speech with swappable providers. Used by build_video.py.

Providers (config voice.provider):
  edge    free neural voices via the edge-tts package (needs internet). voice_id e.g. en-US-AndrewNeural, ur-PK-AsadNeural, hi-IN-MadhurNeural
  piper   fully offline; needs the `piper` binary and voice_id = path to a .onnx model
  silent  no audio (timing only). Used for tests and dry runs.
Never clone a real person's voice without documented permission.
"""
import asyncio, subprocess, sys


def duration(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "default=nw=1:nk=1", path], text=True)
    return float(out.strip())


def synth(text, out_mp3, provider="edge", voice_id="en-US-AndrewNeural", rate="+0%"):
    if provider == "edge":
        import edge_tts
        asyncio.run(edge_tts.Communicate(text, voice_id, rate=rate).save(out_mp3))
    elif provider == "piper":
        wav = out_mp3 + ".wav"
        subprocess.run(["piper", "--model", voice_id, "--output_file", wav], input=text, text=True, check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, out_mp3], check=True)
    elif provider == "silent":
        secs = max(2.0, len(text.split()) / 2.6)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i",
                        "anullsrc=r=44100:cl=mono", "-t", f"{secs:.2f}", "-q:a", "9", out_mp3], check=True)
    else:
        sys.exit(f"unknown voice provider: {provider}")
    return duration(out_mp3)
