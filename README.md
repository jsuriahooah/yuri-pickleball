# YURI Pickleball brand website

Static site exported from the v3 prototypes (`HBC-Website-Projects/Yuri-Pickleball`). Do not edit here: edit the copy there, run the generators, then `python3 _tools/export_site.py`.

Forms post to `api/lead.js` (a Vercel function) and go to GoHighLevel. Set `GHL_PRIVATE_TOKEN` and `GHL_LOCATION_ID` in Vercel (see `.env.example`). Analytics: Google Tag Manager, live domain only, after cookie consent (`analytics.js`; `?debug_analytics=1` shows events).

Live: indexed, with sitemap.xml.
