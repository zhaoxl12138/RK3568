#!/usr/bin/env bash
set -euo pipefail

PROGRAM="${1:-./set_format}"
OUTPUT="$($PROGRAM /dev/video0)"

grep -Fq 'request fmt  : NV12 3840x2160' <<<"$OUTPUT"
grep -Fq 'driver fmt   : NV12 3840x2160, planes=1' <<<"$OUTPUT"
grep -Fq 'plane[0]     : bytesperline=3840, sizeimage=12441600' <<<"$OUTPUT"

printf 'Day 2 set_format acceptance: PASS\n'
