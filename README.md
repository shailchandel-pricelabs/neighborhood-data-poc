# Neighborhood Data POC

Mobile "Neighbourhood Data" screen for PriceLabs, built to plug into the real app's
existing (currently "Coming Soon") slot for that feature.

## Pages

- **pricing-dashboard.html** — the real Pricing Dashboard (listing list) entry screen
- **calendar.html** — a single listing's real Calendar screen shell (header, price card,
  calendar grid, bottom nav, "Select View" sheet) — tap **More → Neighbourhood Data**
  to open our POC content in the same real bottom-sheet pattern the app already uses
  for that destination.
- **index.html** — the standalone Neighbourhood Data mock in a plain phone-frame
  (earlier iteration, kept for reference)

## How this was built

`pricing-dashboard.html` and `calendar.html` are assembled from markup and CSS
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
