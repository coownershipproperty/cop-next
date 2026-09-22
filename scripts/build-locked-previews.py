#!/usr/bin/env python3
"""Regenerate data/locked-previews.json — the blurred 2x2 teaser behind the
gallery unlock box on property pages (see lib/lockedPreviews.js).

    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python3 scripts/build-locked-previews.py

Needs: pip install requests pillow. Run after a listing sync that adds homes,
then commit data/locked-previews.json. Floor plans, site plans and maps are
skipped on filename; homes with fewer than three real gated photos get no
entry and the page falls back to its blurred hero.
"""
import base64, concurrent.futures as cf, io, json, os, re, sys
import requests
from PIL import Image, ImageFilter

URL = os.environ.get('SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
if not URL or not KEY:
    sys.exit('set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
SKIP = re.compile(r'plan|floor|grundriss|plano|planta|layout|sketch|\bmap\b|site-?plan|brochure|_p-\d+', re.I)
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'locked-previews.json')

def rows():
    h = {'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
    r = requests.get(f'{URL}/rest/v1/properties', headers=h, params={
        'select': 'slug,images,photos,extra_photos', 'status': 'eq.Live', 'is_discreet': 'eq.false', 'limit': '2000'}, timeout=60)
    r.raise_for_status()
    return r.json()

S = requests.Session()
def tiny(url):
    try:
        r = S.get(url, timeout=15); r.raise_for_status()
        im = Image.open(io.BytesIO(r.content)).convert('RGB')
        w, h = im.size; tw, th = 28, 20; s = max(tw / w, th / h)
        im = im.resize((max(tw, round(w * s)), max(th, round(h * s))), Image.LANCZOS)
        l = (im.width - tw) // 2; t = (im.height - th) // 2
        im = im.crop((l, t, l + tw, t + th)).filter(ImageFilter.GaussianBlur(1.2))
        b = io.BytesIO(); im.save(b, 'JPEG', quality=40, optimize=True)
        return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
    except Exception:
        return None

def one(row):
    shown = set(row.get('images') or [])
    gated = [u for u in (row.get('photos') or []) + (row.get('extra_photos') or [])
             if isinstance(u, str) and u.startswith('http') and u not in shown and not SKIP.search(u)]
    outs = []
    for u in gated[:6]:
        d = tiny(u)
        if d: outs.append(d)
        if len(outs) == 4: break
    return row['slug'], (outs if len(outs) >= 3 else None)

res = {}
with cf.ThreadPoolExecutor(12) as ex:
    for slug, outs in ex.map(one, rows()):
        if outs: res[slug] = outs
json.dump(res, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(res)} homes -> {OUT}')
