# CRICZONE — Hero image

The night stadium hero looks for a background image at:

    public/images/hero-night-cricket.jpg

## How to get one

**Option A — Use your pngtree image (recommended if you have a license)**
1. Download the night-cricket image you liked from pngtree (paid / licensed).
2. Save it as `public/images/hero-night-cricket.jpg` (rename the extension if needed).
3. Recommended: at least **1920×1080**, landscape, dark overall exposure.

**Option B — Free alternatives**
- Unsplash → search "cricket stadium night" (free, attribution appreciated)
- Pexels → search "cricket floodlight"
- Pixabay → search "cricket stadium night"
Save the file as `public/images/hero-night-cricket.jpg`.

**Option C — Remote URL**
Open `src/components/landing/Hero.tsx` and change:

    const HERO_IMAGE = "/images/hero-night-cricket.jpg";

to your remote URL, e.g.:

    const HERO_IMAGE = "https://images.unsplash.com/photo-…";

`next.config.ts` already whitelists `images.unsplash.com` and `images.pexels.com`.

## What if the file is missing?

The Hero component renders a deep forest radial gradient fallback underneath.
The page never looks broken — it just looks simpler. Drop the file in and it
appears instantly.