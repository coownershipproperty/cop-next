#!/bin/bash
# make_clip.sh OUT "HOOK" "LOCATION" "PRICE LINE" img1 img2 [img3] [img4]
#
# scripts/make-property-clip.sh — COP listing-to-video generator.
# Turns 2-4 listing photos into a branded ~17s vertical clip (1080x1920)
# for YouTube Shorts / Reels / TikTok / Pinterest: slow ken-burns per photo,
# crossfades, hook line, gold location eyebrow, price, site end-card.
# Requires ffmpeg + DejaVu fonts. Run anywhere with network access to the
# property photo URLs (download them first, pass local paths).
# 1080x1920 vertical clip: slow ken-burns per photo, crossfades, brand overlays.
set -e
OUT="$1"; HOOK="$2"; LOC="$3"; PRICE="$4"; shift 4
IMGS=("$@"); N=${#IMGS[@]}
DUR=$(( N==2 ? 9 : (N==3 ? 6 : 5) ))   # per-slide seconds → total ~18-20s
FPS=25; FR=$((DUR*FPS))
SERIF=/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf
SANS=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
printf '%s' "$HOOK"  > /tmp/hook.txt
printf '%s' "$LOC"   > /tmp/loc.txt
printf '%s' "$PRICE" > /tmp/price.txt
printf '%s' "co-ownership-property.com" > /tmp/site.txt

inputs=(); for img in "${IMGS[@]}"; do inputs+=(-loop 1 -t $DUR -i "$img"); done

filt=""
for i in $(seq 0 $((N-1))); do
  filt+="[$i:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(1+0.0006*on,1.10)':d=$FR:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=$FPS,setsar=1[s$i];"
done
# chain xfades
prev="s0"; off=0
for i in $(seq 1 $((N-1))); do
  off=$(echo "$off + $DUR - 0.7" | bc)
  out="x$i"; [ $i -eq $((N-1)) ] && out="vx"
  filt+="[$prev][s$i]xfade=transition=fade:duration=0.7:offset=$off[$out];"
  prev="$out"
done
TOTAL=$(echo "$off + $DUR" | bc)
END=$(echo "$TOTAL - 3.2" | bc)

filt+="[vx]"
# bottom scrim
filt+="drawbox=y=ih-560:w=iw:h=560:color=0x1E3448@0.0:t=fill:enable='lt(t,0)',"
filt+="drawbox=y=ih-430:w=iw:h=430:color=black@0.35:t=fill,"
# hook (first slide)
filt+="drawtext=fontfile=$SERIF:textfile=/tmp/hook.txt:fontsize=68:fontcolor=0xF4EFE4:borderw=0:shadowcolor=black@0.6:shadowx=2:shadowy=2:x=(w-text_w)/2:y=760:enable='between(t,0.6,$DUR)',"
# location + price (persistent from t=1)
filt+="drawtext=fontfile=$SANS:textfile=/tmp/loc.txt:fontsize=34:fontcolor=0xC9A84C:x=(w-text_w)/2:y=h-330:enable='gte(t,1)',"
filt+="drawtext=fontfile=$SERIF:textfile=/tmp/price.txt:fontsize=58:fontcolor=white:x=(w-text_w)/2:y=h-270:enable='gte(t,1)',"
# end card site
filt+="drawtext=fontfile=$SANS:textfile=/tmp/site.txt:fontsize=40:fontcolor=0xF4EFE4:box=1:boxcolor=0x1E3448@0.85:boxborderw=22:x=(w-text_w)/2:y=h-160:enable='gte(t,$END)',"
filt+="format=yuv420p[v]"

ffmpeg -y "${inputs[@]}" -filter_complex "$filt" -map "[v]" -t "$TOTAL" -r $FPS -c:v libx264 -preset medium -crf 21 -movflags +faststart "$OUT" 2>/tmp/ff.log || { tail -5 /tmp/ff.log; exit 1; }
echo "OK $OUT ($TOTAL s)"
