#!/bin/bash
# Running total of the corpus, by scope. Counts every container we accept —
# Commons serves .webm and .ogv, stock sites serve .mp4.
cd "$(dirname "$0")"
total=0
for d in india night fixed highway; do
  [ -d "$d" ] || continue
  n=$(find "$d" -type f \( -name '*.mp4' -o -name '*.webm' -o -name '*.ogv' -o -name '*.mov' -o -name '*.mkv' \) 2>/dev/null | wc -l)
  s=$(du -sm "$d" 2>/dev/null | cut -f1)
  printf "%-10s %3d clips  %6d MB\n" "$d" "$n" "$s"
  total=$((total + s))
done
printf "%-10s %19d MB  (%.2f GB)\n" "TOTAL" "$total" "$(echo "scale=2;$total/1024" | bc -l)"
