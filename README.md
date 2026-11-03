# Neighborhood Data POC

Mobile "Neighbourhood Data" screen for PriceLabs, built to plug into the real app's
existing (currently "Coming Soon") slot for that feature.

## Pages

- **calendar.html** — opens on the **Neighborhood** tab (footer nav). Sections:
  Future Prices, Occupancy, Market History, Prices by Bedroom Type and the
  Competitor Calendar (Change Compset sheet with Selected / Nearby tabs,
  365-day table, per-competitor calendar sheet). Charts open in a landscape
  full-screen view. The **Calendar** tab is the single-listing Pricing
  Calendar ported from the mobile-app-onboarding project.
- **assets/comps/** — sample listing photos (Unsplash) used in the
  competitor calendar sheet.
- **ia-options.html** — IA exploration: options for where Neighbourhood Data lives
- **index.html** — redirects to calendar.html

## How this was built

`calendar.html` is assembled from markup and CSS
extracted **live** from `sagar.app.pricelabs.co` (real DOM, real Chakra/Emotion
classes, real computed design-token values) — see `_extracted/` for the raw
fragments and `_extracted/README.md` for what each file is. This isn't a
hand-drawn approximation: the header, listing cards, price card, calendar grid,
and "Select View" bottom sheet are the actual production markup/CSS, with our
Neighbourhood Data content (Future Prices, Occupancy, Market History, Competitor
Calendar/Map, Market Overview) plugged into the real "Neighbourhood Data" bottom
sheet slot.

Known rough edges (real-DOM extraction, not final production code):
- The captured Calendar fragment included a nested "Review Pricing" drawer
  wrapper from the live page, producing a duplicate header line — needs cleanup.
- Some layout overflow/width issues from stripping React/Next.js runtime sizing.
- Customization, Listing Details, Hotel Rate Shopper, and Help Me Choose a Base
  Price are left as labeled placeholders — out of scope for this exercise.
