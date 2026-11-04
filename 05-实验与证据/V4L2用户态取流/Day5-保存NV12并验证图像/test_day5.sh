#!/usr/bin/env bash
set -euo pipefail

PROGRAM="${1:-./capture_one_frame}"
OUTPUT_FILE="${2:-/tmp/frame_000.nv12}"

rm -f "$OUTPUT_FILE"
OUTPUT="$($PROGRAM /dev/video0 "$OUTPUT_FILE")"

grep -Fq 'stream status    : ON' <<<"$OUTPUT"
grep -Fq 'stream status    : OFF' <<<"$OUTPUT"
grep -Fq "saved frame      : $OUTPUT_FILE" <<<"$OUTPUT"
grep -Eq 'bytes written    : [1-9][0-9]*' <<<"$OUTPUT"

test -s "$OUTPUT_FILE"

REPORTED_SIZE="$(awk -F': ' '/bytes written/{print $2}' <<<"$OUTPUT")"
ACTUAL_SIZE="$(stat -c '%s' "$OUTPUT_FILE")"
if [[ "$ACTUAL_SIZE" -ne "$REPORTED_SIZE" ]]; then
    printf 'file size %s does not match reported bytes %s\n' \
        "$ACTUAL_SIZE" "$REPORTED_SIZE" >&2
    exit 1
fi

printf 'Day 5 save NV12 frame acceptance: PASS (%s bytes)\n' "$ACTUAL_SIZE"
