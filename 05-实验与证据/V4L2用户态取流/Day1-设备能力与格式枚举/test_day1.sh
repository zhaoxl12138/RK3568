#!/usr/bin/env bash
set -euo pipefail

PROGRAM="${1:-./query_device}"
OUTPUT="$($PROGRAM /dev/video0)"

grep -Fq 'driver       : rkisp_v5' <<<"$OUTPUT"
grep -Fq 'card         : rkisp_mainpath' <<<"$OUTPUT"
grep -Fq 'capture type : Video Capture Multiplanar' <<<"$OUTPUT"
grep -Fq "current fmt  : NV12 3840x2160, planes=1" <<<"$OUTPUT"
grep -Fq "NV12" <<<"$OUTPUT"

printf 'Day 1 query_device acceptance: PASS\n'
