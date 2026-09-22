# Extracted real markup from sagar.app.pricelabs.co

These files are captured directly from the live app (logged in, mobile-emulated viewport),
via document.querySelector + outerHTML, and matched CSS rules (Emotion/Chakra generated
classes, deduped to only rules whose selector matches a class actually used in the captured
subtree). Used as the literal foundation for the static recreation in ../index.html and
../pricing-dashboard.html — not hand-written approximations.

- header.html            — top app header (hamburger, title, bell/gear/help), shared across all screens
- pricing-dashboard.css  — matched CSS rules for the Pricing Dashboard (listing list) screen
- pricing-dashboard-root.html — the listing list body content (search/filter bar + listing cards + pagination)
- calendar-view.html / .css — the single-listing Calendar screen (price card, sync row, FullCalendar grid, Override FAB, bottom nav)
- select-view-sheet.html — the "More" bottom sheet (Select View: Calendar/Customization/Listing Details/Neighbourhood Data/Hotel Rate Shopper/Help Me Choose a Base Price)
- neighbourhood-coming-soon.html — real "Coming Soon" placeholder state for Neighbourhood Data (the slot our POC now fills)
