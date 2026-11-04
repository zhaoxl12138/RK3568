#!/usr/bin/env bash
set -euo pipefail

PROGRAM="${1:-./capture_100_frames}"

validate_run() {
    local output="$1"
    local frame_lines
    local fps

    grep -Fq 'captured frames  : 100' <<<"$output"
    grep -Fq 'sequence gaps    : 0' <<<"$output"
    grep -Fq 'poll timeouts    : 0' <<<"$output"
    grep -Eq 'bytesused min    : [1-9][0-9]*' <<<"$output"
    grep -Eq 'bytesused max    : [1-9][0-9]*' <<<"$output"

    frame_lines="$(grep -Ec '^frame\[[0-9][0-9][0-9]\]' <<<"$output")"
    if [[ "$frame_lines" -ne 100 ]]; then
        printf 'expected 100 frame records, got %s\n' "$frame_lines" >&2
        return 1
    fi

    fps="$(awk -F': ' '/actual fps/{print $2}' <<<"$output")"
    awk -v fps="$fps" 'BEGIN { exit !(fps >= 25.0 && fps <= 35.0) }'
}

# 连续运行两次：第二次成功能够发现 STREAMOFF、munmap、REQBUFS(0)、close
# 等清理遗漏造成的“第一次成功、第二次失败”。
FIRST_OUTPUT="$($PROGRAM /dev/video0)"
SECOND_OUTPUT="$($PROGRAM /dev/video0)"

validate_run "$FIRST_OUTPUT"
validate_run "$SECOND_OUTPUT"

FIRST_FPS="$(awk -F': ' '/actual fps/{print $2}' <<<"$FIRST_OUTPUT")"
SECOND_FPS="$(awk -F': ' '/actual fps/{print $2}' <<<"$SECOND_OUTPUT")"

printf 'Day 6 100-frame acceptance: PASS (fps=%s, rerun_fps=%s)\n' \
    "$FIRST_FPS" "$SECOND_FPS"
