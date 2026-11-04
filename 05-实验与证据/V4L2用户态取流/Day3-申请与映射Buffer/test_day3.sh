#!/usr/bin/env bash
set -euo pipefail

PROGRAM="${1:-./map_buffers}"
OUTPUT="$($PROGRAM /dev/video0)"

grep -Fq 'requested buffers : 4' <<<"$OUTPUT"
grep -Eq 'driver buffers    : [2-9][0-9]*' <<<"$OUTPUT"
grep -Fq 'buffer[0] plane[0]' <<<"$OUTPUT"
grep -Fq 'all buffers unmapped and released' <<<"$OUTPUT"

printf 'Day 3 buffer mapping acceptance: PASS\n'
