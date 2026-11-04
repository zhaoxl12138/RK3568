#!/usr/bin/env bash
set -euo pipefail

PROGRAM="${1:-./capture_10_frames}"
OUTPUT="$($PROGRAM /dev/video0)"

grep -Fq 'queued buffers   :' <<<"$OUTPUT"
grep -Fq 'stream status    : ON' <<<"$OUTPUT"
grep -Fq 'stream status    : OFF' <<<"$OUTPUT"
grep -Fq 'captured frames  : 10' <<<"$OUTPUT"
grep -Eq 'plane\[0\]\.bytesused=[1-9][0-9]*' <<<"$OUTPUT"

FRAME_COUNT="$(grep -Ec '^frame\[[0-9][0-9]\]' <<<"$OUTPUT")"
if [[ "$FRAME_COUNT" -ne 10 ]]; then
    printf 'expected 10 frame records, got %s\n' "$FRAME_COUNT" >&2
    exit 1
fi

printf 'Day 4 QBUF/STREAMON/DQBUF acceptance: PASS\n'
