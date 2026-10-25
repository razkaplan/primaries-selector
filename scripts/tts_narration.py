#!/usr/bin/env python3
"""Synthesize a video narration (one MP3 per segment) with a neural Hebrew
voice, and write durations.json for the renderer to time scenes by.

Runs in GitHub Actions (the speech service isn't reachable from every
environment):  python3 scripts/tts_narration.py app/data/video/campaign-narration.json out/
Needs: pip install edge-tts mutagen"""
import asyncio, json, os, sys

import edge_tts
from mutagen.mp3 import MP3


async def main(spec_path, out_dir):
    spec = json.load(open(spec_path, encoding="utf-8"))
    os.makedirs(out_dir, exist_ok=True)
    durations = {}
    for seg in spec["segments"]:
        path = os.path.join(out_dir, f"{seg['id']}.mp3")
        await edge_tts.Communicate(seg["text"], spec["voice"], rate=spec.get("rate", "+0%")).save(path)
        durations[seg["id"]] = round(MP3(path).info.length, 3)
        print(f"{seg['id']}: {durations[seg['id']]}s")
    json.dump({"voice": spec["voice"], "durations": durations}, open(os.path.join(out_dir, "durations.json"), "w"), indent=1)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
