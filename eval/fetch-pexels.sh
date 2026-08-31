#!/bin/bash
# Fetch Pexels videos by id into the corpus.
#
# Discovery and download are separate problems on Pexels:
#
#   www.pexels.com/search/...        403 to curl — use WebFetch to read the page
#                                    and harvest numeric video ids
#   www.pexels.com/download/video/N/ 302 to the real file, but ONLY with a
#                                    browser User-Agent
#   videos.pexels.com/video-files/…  403 unless you use the exact URL the
#                                    redirect gave you. The filename is not
#                                    derivable from the video id — new uploads
#                                    use a different internal id entirely
#                                    (id 32665228 serves 13926765_…mp4), which
#                                    is why constructing URLs by hand fails.
#
# So: harvest ids with WebFetch, then run this. Resolution is whatever Pexels
# serves, usually 4K — that is kept rather than downscaled, because plate width
# in pixels is the binding constraint on recognition.
#
# Usage: eval/fetch-pexels.sh <idfile> <outdir> <prefix> [parallel]

set -uo pipefail

IDFILE="${1:?usage: fetch-pexels.sh <idfile> <outdir> <prefix> [parallel]}"
OUTDIR="${2:?}"
PREFIX="${3:?}"
PAR="${4:-4}"

UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
MANIFEST="$OUTDIR/MANIFEST-pexels.md"

mkdir -p "$OUTDIR"

if [ ! -f "$MANIFEST" ]; then
  {
    echo "# ${PREFIX} — Pexels source manifest"
    echo
    echo "Pexels Licence: free for commercial and non-commercial use, no"
    echo "attribution required. https://www.pexels.com/license/"
    echo
    echo "| File | Pexels id | Page | Resolution | Duration | Size |"
    echo "| --- | --- | --- | --- | --- | --- |"
  } > "$MANIFEST"
fi

fetch_one() {
  local id="$1"
  local out="$OUTDIR/${PREFIX}-px${id}.mp4"

  [ -s "$out" ] && { echo "  = $id already held"; return 0; }

  curl -sL --max-time 600 --retry 2 -A "$UA" \
       -o "$out" "https://www.pexels.com/download/video/${id}/" || {
    echo "  ! $id download failed"; rm -f "$out"; return 1; }

  # Reject anything that is not a real, tall-enough video.
  local probe
  probe=$(ffprobe -v error -select_streams v:0 \
          -show_entries stream=width,height,duration -of csv=p=0 "$out" 2>/dev/null)

  local h
  h=$(echo "$probe" | cut -d, -f2)

  if [ -z "$h" ] || [ "$h" -lt 1080 ] 2>/dev/null; then
    echo "  x $id rejected (${probe:-unreadable})"
    rm -f "$out"
    return 1
  fi

  local sz
  sz=$(du -m "$out" | cut -f1)
  echo "  + $id  ${probe}  ${sz}MB"

  printf '| `%s` | %s | https://www.pexels.com/video/%s/ | %s | %s | %sMB |\n' \
    "$(basename "$out")" "$id" "$id" \
    "$(echo "$probe" | cut -d, -f1)x${h}" \
    "$(echo "$probe" | cut -d, -f3 | cut -d. -f1)s" "$sz" >> "$MANIFEST"
}

export -f fetch_one
export OUTDIR PREFIX UA MANIFEST

tr ' ' '\n' < "$IDFILE" | grep -E '^[0-9]+$' | sort -u \
  | xargs -P "$PAR" -I{} bash -c 'fetch_one "$@"' _ {}

echo "done: $(find "$OUTDIR" -name "${PREFIX}-px*.mp4" | wc -l) files, $(du -sm "$OUTDIR" | cut -f1) MB"
