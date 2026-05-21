#!/usr/bin/env python3
"""
MYNE → COP Upload Template
----------------------------
1. Adapt the PROPERTIES list below for the new property/properties.
2. Run: python upload_template.py
3. Check output — every line should say OK.
4. Tell David the slugs, photo counts, and that extra_photos is ready for brochures.
"""
import requests, time, json, uuid
from datetime import date

SUPABASE_URL = "https://iotzzoxyckpyatzqcjbo.supabase.co"
# IMPORTANT: Must be the Legacy JWT service_role key (not the sb_secret_ format key)
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdHp6b3h5Y2tweWF0enFjamJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwMTk5MSwiZXhwIjoyMDkyMDc3OTkxfQ.NzeqvQSgUlEdAXUhe3aeG5C3auVuoq53dAJG3AZ2rJc"
HEADERS = {"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY}

def upload_image(bucket, path, url):
    print(f"  Downloading {url.split('/')[-1].split('?')[0]}...")
    r = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    ct = "image/png" if url.endswith(".png") else "image/jpeg"
    resp = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}",
        headers={**HEADERS, "Content-Type": ct, "x-upsert": "true"},
        data=r.content
    )
    if resp.status_code not in (200, 201):
        print(f"  ERROR {path}: {resp.status_code} {resp.text[:150]}")
        return None
    pub = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
    print(f"  OK -> {pub}")
    return pub


# ─── ADAPT THIS SECTION FOR EACH BATCH OF NEW PROPERTIES ───────────────────

PROPERTIES = [
    {
        # Slug: URL-safe, unique. city-region-country-Nbed-type-feature
        "slug": "FILL-IN",
        "title": "City, Region, Country — N-Bed Type With Feature",
        "city": "FILL-IN",
        "region": "FILL-IN",
        "country": "FILL-IN",
        "beds": 2,
        "baths": 2.0,
        "price": 000000,          # EUR, integer
        "lat": 0.0,
        "lng": 0.0,
        "partner_url": "https://www.myne-homes.com/listings/FILL-IN",
        "property_type": "apartment",   # apartment / villa / house
        "property_style": "modern",     # garden / terrace / modern / penthouse / etc.
        "amenities": [
            "FILL-IN",
        ],
        # Raw scraped description from MYNE (no changes)
        "description_original": "FILL-IN",
        # AI-improved description (markdown bold, SEO, no MYNE branding, no nickname)
        "description": "FILL-IN",
        # Hero image = first / best photo
        "hero": "https://a.storyblok.com/f/148662/...",
        # All property-specific images (filtered by filename prefix)
        "photos": [
            "https://a.storyblok.com/f/148662/...",
        ],
    },
    # Add more properties here...
]

# ─── UPLOAD LOOP — don't touch below this line ─────────────────────────────

for prop in PROPERTIES:
    slug = prop["slug"]
    print(f"\n{'='*60}")
    print(f"PROPERTY: {prop['title']}")
    print(f"{'='*60}")
    ts = int(time.time() * 1000)

    # Hero
    print("\n[Hero]")
    hero_url = upload_image("property-images", f"{slug}/hero.jpg", prop["hero"])

    # Photos + locked gallery (first 3 become gallery-0/1/2)
    print(f"\n[Photos] {len(prop['photos'])} images")
    pub_photos, gallery = [], []
    for i, img_url in enumerate(prop["photos"]):
        ts_i = ts + i
        ext = "png" if img_url.endswith(".png") else "jpg"
        uploaded = upload_image("property-photos", f"{slug}/{ts_i}-p{i}.{ext}", img_url)
        if uploaded:
            pub_photos.append(uploaded)
        if i < 3:
            g = upload_image("property-images", f"{slug}/gallery-{i}.{ext}", img_url)
            if g:
                gallery.append(g)
        time.sleep(0.1)

    # Insert DB row
    print(f"\n[Insert row]")
    row = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "title": prop["title"],
        "city": prop["city"],
        "region": prop["region"],
        "country": prop["country"],
        "beds": prop["beds"],
        "baths": prop["baths"],
        # NOTE: "size" intentionally omitted — MYNE doesn't provide m²
        "price": prop["price"],
        "currency": "EUR",
        "description": prop["description"],
        "description_original": prop["description_original"],
        "description_scraped": prop["description_original"],
        "description_ai": prop["description"],
        "amenities": prop["amenities"],
        "img": hero_url,
        "photos": pub_photos,
        "images": gallery,
        "extra_photos": [],          # David fills this manually from brochure screenshots
        "partner": "myne",
        "partner_url": prop["partner_url"],
        "property_type": prop["property_type"],
        "property_style": prop["property_style"],
        "status": "for_sale",
        "lat": prop["lat"],
        "lng": prop["lng"],
        "date_added": str(date.today()),
        "rental": False,
        "drive_url": f"https://co-ownership-property.com/gallery/{slug}",
        "total_images": len(pub_photos),
    }
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/properties",
        headers={**HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
        json=row
    )
    if r.status_code in (200, 201):
        print(f"  OK -> inserted {slug} ({len(pub_photos)} photos)")
    else:
        print(f"  ERROR {r.status_code}: {r.text[:300]}")

print("\n\nDONE!")
