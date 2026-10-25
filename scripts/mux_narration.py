#!/usr/bin/env python3
"""Lay narration segments onto a silent render, each at its scene's start.

Scene timing must match the video component: LEAD_IN, then each segment's
duration plus GAP (see CampaignVideo.tsx). Usage:
  python3 scripts/mux_narration.py silent.mp4 narration_dir/ out.mp4 [ffmpeg]
narration_dir holds <id>.mp3 files and durations.json (from tts_narration.py)."""
import json, os, subprocess, sys

LEAD_IN, GAP = 0.5, 0.7


def main(silent, ndir, out, ffmpeg="ffmpeg"):
    durs = json.load(open(os.path.join(ndir, "durations.json")))["durations"]
    ids = list(durs)
    probe = subprocess.run([ffmpeg, "-nostdin", "-i", silent], capture_output=True, text=True).stderr
    h, m, s = probe.split("Duration: ")[1].split(",")[0].split(":")
    length = int(h) * 3600 + int(m) * 60 + float(s)
    t, starts = LEAD_IN, []
    for i in ids:
        starts.append(t)
        t += durs[i] + GAP
    args = [ffmpeg, "-y", "-nostdin", "-loglevel", "error", "-i", silent]
    for i in ids:
        args += ["-i", os.path.join(ndir, f"{i}.mp3")]
    f = ";".join(f"[{k + 1}:a]adelay={int(s * 1000)}|{int(s * 1000)}[a{k}]" for k, s in enumerate(starts))
    f += ";" + "".join(f"[a{k}]" for k in range(len(ids))) + f"amix=inputs={len(ids)}:normalize=0,apad=whole_dur={length}[aout]"
    args += ["-filter_complex", f, "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac",
             "-b:a", "160k", "-t", str(length), "-movflags", "+faststart", out]
    subprocess.run(args, check=True)
    print(f"{out}: {length:.2f}s, narration at {[round(s, 2) for s in starts]}")


if __name__ == "__main__":
    main(*sys.argv[1:])
