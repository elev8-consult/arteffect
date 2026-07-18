# ArtEffect CMS fill guide

Field-by-field checklist for account managers entering showcase content in Payload Admin (**Showcase** group).

## Recommended entry order

1. **Media** uploads (images / videos)
2. **Artists**
3. **Causes**
4. **Artworks**
5. **Drops** (requires Artist + Artwork + Cause)
6. **Products** (needs at least one variant with a unique SKU)
7. **Impact Stats**
8. **Impact Entries**

---

## Quick rules that often block saves

| Topic | Rule |
| --- | --- |
| Slugs | Lowercase letters, numbers, hyphens only. Auto-generated from name/title if left blank. |
| Images | Products must have a local Media image **or** an external URL. Alt text is always required. |
| Variants | At least one variant. Unique SKUs. Reserved inventory cannot exceed on-hand. Compare-at ≥ price. |
| Impact entries | Amounts are additive. Do **not** re-enter the same funds when changing projected → verified. |
| Homepage “current” | For artists, causes, artworks, and drops: first **published** record with **Use on homepage** is used. |
| Publishing | Unpublished records stay in CMS but are hidden from the public site for anonymous visitors. |

---

## Artists

- **Admin path:** `/admin/collections/artists`
- **Purpose:** Artist profiles shown on `/artists` and linked from drops/products.
- **Depends on:** Upload Media first (portrait, process video, works).

| Field | Required | What to enter | Notes / limits |
| --- | --- | --- | --- |
| Slug | Yes | URL path, e.g. `maya-raad` | Auto from name if blank. Lowercase, numbers, hyphens only. |
| Name | Yes | Artist display name | Max 140. |
| Role | Yes | Short role line | e.g. Ceramicist · Beirut. Max 140. |
| Quote | Yes | Featured quote | Max 500. |
| Bio | Yes | Biography body | Max 900. |
| Location | No | City / studio location | Max 120. |
| Website | No | Personal site URL | Max 220. |
| Instagram | No | Handle or profile URL | Max 120. |
| Local image | One of image / URL | Upload to Media library | Prefer local Media upload for production. |
| External image URL | One of image / URL | Fallback image URL | Prefer Media when possible. |
| Image alt text | Yes | Accessibility description | Max 180 characters. |
| Process video | No | Local MP4/WebM upload | Short silent making-of film. |
| External process video URL | No | Hosted video fallback | Local process video wins if both set. |
| Process video poster image | No | Poster frame image | Media upload. |
| Process video caption | No | Caption under video | Max 300. |
| Portrait and studio images[] | No | Gallery of studio/portrait shots | Each row: Image (required) + Caption (optional). |
| Facts[] | Yes (min 1) | Label / value pairs | e.g. Based in → Beirut. Label max 80, value max 160. |
| Representative works[] | No | Selected artworks for the profile | Title required; Year, Medium, Image optional. |
| Featured | No | Promote in curated modules | Sidebar checkbox. |
| Use on homepage | No | Homepage current artist | First published + current wins. |
| SEO → Meta title | No | Search / browser title override | Max 70 characters. |
| SEO → Meta description | No | Search snippet | Max 180 characters. |
| SEO → OpenGraph image | No | Social share image | Upload from Media. |
| Published | No | Show on the website | Default on. Unpublish to hide without deleting. |
| Sort order | No | Listing order | Lower numbers appear first. Default 0. |

---

## Causes (NGOs)

- **Admin path:** `/admin/collections/causes`
- **Purpose:** NGO partners shown on `/causes` and linked from drops/products/impact.
- **Depends on:** Upload field photos to Media first.

| Field | Required | What to enter | Notes / limits |
| --- | --- | --- | --- |
| Slug | Yes | URL path | Auto from name if blank. |
| Name | Yes | Public NGO name | Max 140. |
| Focus | Yes | One-line focus area | e.g. Coastal restoration. Max 180. |
| Legal NGO name | No | Registered legal name | Max 180. |
| Registration number | No | Legal / charity ID | Max 100. |
| Website | No | NGO website | Max 220. |
| Summary | Yes | About the cause | Max 900. |
| Contact → Name / Email / Phone | No | Partner contact details | Internal + optional public use. |
| Local image | One of image / URL | Upload to Media library | Prefer local Media upload for production. |
| External image URL | One of image / URL | Fallback image URL | Prefer Media when possible. |
| Image alt text | Yes | Accessibility description | Max 180 characters. |
| Field images[] | No | Gallery from the field | Each: Image (required) + Caption. |
| Metrics[] | Yes (min 1) | Progress markers | Label, Value, Progress 0–100 (required). |
| Programs[] | No | Funded programs | Name + Description required; Allocation optional (e.g. 25% of proceeds). |
| Verification → Status | No | pending / verified / needs-review | Default pending. |
| Verification → Verified at / Notes | No | Date + internal notes | Notes max 500. |
| Impact reports[] | No | External report links | Title + Period required; External URL optional. |
| Featured | No | Promote in modules | Sidebar. |
| Use on homepage | No | Homepage current cause | First published + current wins. |
| SEO → Meta title | No | Search / browser title override | Max 70 characters. |
| SEO → Meta description | No | Search snippet | Max 180 characters. |
| SEO → OpenGraph image | No | Social share image | Upload from Media. |
| Published | No | Show on the website | Default on. |
| Sort order | No | Listing order | Lower numbers appear first. Default 0. |

---

## Artworks

- **Admin path:** `/admin/collections/artworks`
- **Purpose:** Source designs linked to drops and products (detail hotspots on artwork).
- **Depends on:** Main artwork image in Media.

| Field | Required | What to enter | Notes / limits |
| --- | --- | --- | --- |
| Slug | Yes | URL-safe id | Auto from title if blank. |
| Title | Yes | Artwork title | Max 160. |
| Artist line | Yes | Credit line shown with the work | Often artist name. Max 160. |
| Summary | Yes | Short artwork story | Max 900. |
| Local image | One of image / URL | Upload to Media library | Prefer local Media upload for production. |
| External image URL | One of image / URL | Fallback image URL | Prefer Media when possible. |
| Image alt text | Yes | Accessibility description | Max 180 characters. |
| Detail hotspots[] | Yes (min 1) | Clickable points on the image | Label (max 8), Title, Body, X% (0–100), Y% (0–100) — all required. |
| Use on homepage | No | Homepage current artwork | First published + current wins. |
| Published | No | Show on the website | Default on. |
| Sort order | No | Listing order | Lower numbers appear first. Default 0. |

---

## Drops (batches)

- **Admin path:** `/admin/collections/drops`
- **Purpose:** Limited batches on `/drops`. Must link Artist + Artwork + Cause.
- **Depends on:** Create Artist, Artwork, and Cause first.

| Field | Required | What to enter | Notes / limits |
| --- | --- | --- | --- |
| Slug | Yes | URL path | Auto from title if blank. |
| Eyebrow | Yes | Small label above title | e.g. Batch 001. Max 80. |
| Title | Yes | Drop title | Max 160. |
| Summary | Yes | Drop story | Max 900. |
| Batch size | Yes | Total edition count | Number ≥ 1. |
| Reserved | Yes | Already reserved count | Number ≥ 0. |
| Status | Yes | draft / preview / live / sold-out / closed | Default draft. Sidebar. |
| Opens at | No | Launch date/time | Sidebar. |
| Closes at | Yes | Close date | Day picker. |
| Products in this batch | No | Related products | Multi-select. Can also link product → drop the other way. |
| Artist | Yes | Linked artist profile | Relationship to Artists. |
| Designs or artworks | Yes (one or more) | Linked artworks | Relationship to Artworks. First artwork is featured on the drop page. |
| NGO or cause | Yes | Linked cause | Relationship to Causes. |
| NGO donation percentage | No | % of proceeds to NGO | 0–100. |
| Local image | One of image / URL | Upload to Media library | Prefer local Media upload for production. |
| External image URL | One of image / URL | Fallback image URL | Prefer Media when possible. |
| Image alt text | Yes | Accessibility description | Max 180 characters. |
| Gallery images[] | No | Drop gallery | Image required; Caption optional. |
| Milestones[] | Yes (min 1) | Campaign milestones | Label, Value, Progress 0–100 — all required. |
| Fund allocations[] | No | How proceeds are split | Label + Percentage required; Description optional. Percentages should add up to ~100. |
| Call to action → Label / Href / Style | No | Button on drop page | Style: primary / secondary / text. |
| Use on homepage | No | Homepage current drop | First published + current wins. |
| SEO → Meta title | No | Search / browser title override | Max 70 characters. |
| SEO → Meta description | No | Search snippet | Max 180 characters. |
| SEO → OpenGraph image | No | Social share image | Upload from Media. |
| Published | No | Show on the website | Default on. |
| Sort order | No | Listing order | Lower numbers appear first. Default 0. |

---

## Products

- **Admin path:** `/admin/collections/products`
- **Purpose:** Shop items on `/shop`. Sellable via variants + inventory.
- **Depends on:** Ideally Drop, Artist, Artwork, Cause exist. Media image required.

| Field | Required | What to enter | Notes / limits |
| --- | --- | --- | --- |
| Slug | Yes | URL path under `/shop` | Auto from name if blank. |
| Name | Yes | Product name | Max 120. |
| Form | Yes | Object type label | e.g. Plate, Scarf, Print. Max 80. |
| Price (display) | Yes | Marketing price string | e.g. `$120` or `From $95`. Max 40. |
| Currency | No | USD / LBP / EUR / GBP | Default USD. |
| Edition | Yes | Edition wording | e.g. Edition of 40. Max 120. |
| Local image | Yes (one of them) | Upload to Media library | Must have local image **or** external URL to save. |
| External image URL | Yes (one of them) | Fallback image URL | Must have local image **or** external URL to save. |
| Image alt text | Yes | Accessibility description | Max 180 characters. |
| Product gallery[] | No | Extra PDP images | Alt required; Local image and/or External URL per row. |
| Story | Yes | Product narrative | Max 700. |
| Dimensions | No | Size / measurements | Max 160. |
| Care instructions | No | Care copy | Max 700. |
| Shipping and returns | No | Shipping/returns copy | Max 700. |
| Drop or batch | No | Parent drop | Relationship. |
| Artist | No | Linked artist | Relationship. |
| Design or artwork | No | Linked artwork | Relationship. |
| NGO or cause | No | Linked cause | Relationship. |
| Materials[] | Yes (min 1) | Material labels | Each row: Label required. Max 80. |
| Variants[] | Yes (min 1) | Sellable SKUs | See variant fields below. SKUs must be unique. Reserved ≤ Inventory. |
| ↳ Variant name | Yes | Option name | e.g. Off-white / M. Max 120. |
| ↳ SKU | Yes | Unique stock code | Max 80. No duplicates across variants. |
| ↳ Price amount | Yes | Numeric price | ≥ 0. Feeds shop filters (min/max auto). |
| ↳ Compare-at price | No | Was / strike price | Must be ≥ price if set. |
| ↳ Color | No | Shop color filter | black, white, off-white, cream, beige, tan, brown, grey, green, blue, purple, pink, red, orange, yellow, metallic, multicolor. |
| ↳ Size | No | Shop size filter | one-size, xxs, xs, s, m, l, xl, xxl, xxxl. |
| ↳ Inventory on hand | Yes | Units in stock | Default 0. |
| ↳ Reserved inventory | Yes | Held for carts/orders | Cannot exceed inventory. |
| ↳ Low stock threshold | No | Triggers low-stock status | Default 5. |
| ↳ Attributes[] | No | Extra name/value pairs | Optional custom attributes. |
| ↳ Available to sell | No | Include in sellable rollup | Default on. |
| Shop search keywords | No | Extra search terms | Do not repeat the product name. Max 500. |
| Total inventory | Auto | Sellable rollup | Recalculated from variants on save. |
| Availability / Colors / Sizes / Min–Max price | Auto | Shop filters | Read-only; calculated from variants. |
| Shipping profile | No | standard / fragile / textile / digital | Default standard. Sidebar. |
| Cart upsells | No | Related products in cart | Max 6 products. |
| Featured | No | Featured badge / modules | Sidebar. |
| SEO → Meta title | No | Search / browser title override | Max 70 characters. |
| SEO → Meta description | No | Search snippet | Max 180 characters. |
| SEO → OpenGraph image | No | Social share image | Upload from Media. |
| Published | No | Show on the website | Default on. |
| Sort order | No | Listing order | Lower numbers appear first. Default 0. |

---

## Impact Stats

- **Admin path:** `/admin/collections/impact-stats`
- **Purpose:** Headline impact numbers (homepage / impact modules).
- **Depends on:** Optional links to Drop and Cause.

| Field | Required | What to enter | Notes / limits |
| --- | --- | --- | --- |
| Label | Yes | Stat name | e.g. Trees funded. Max 120. |
| Value | Yes | Numeric amount | ≥ 0. |
| Metric type | Yes | projected / committed / transferred / verified | Evidence state. Default projected. |
| Prefix | No | Shown before value | e.g. `$`. Max 8. |
| Suffix | No | Shown after value | e.g. `+` or `kg`. Max 12. |
| Detail | Yes | Supporting sentence | Max 400. |
| Related drop or batch | No | Link to drop | Relationship. |
| Related NGO or cause | No | Link to cause | Relationship. |
| Period | No | Time window label | e.g. Batch 001 or Q3 2026. Max 80. |
| Source | No | Report URL or verification note | Max 220. |
| Measured at | No | Measurement date | Day picker. |
| Featured | No | Promote in modules | Sidebar. |
| Published | No | Show on the website | Default on. |
| Sort order | No | Listing order | Lower numbers appear first. Default 0. |

---

## Impact Entries

- **Admin path:** `/admin/collections/impact-entries`
- **Purpose:** Ledger lines on the impact page (additive allocations — do not re-enter the same money when state changes).
- **Depends on:** Cause required. Drop optional.

| Field | Required | What to enter | Notes / limits |
| --- | --- | --- | --- |
| Title | Yes | Entry headline | Max 160. |
| Description | Yes | What this allocation funded | Max 500. |
| Amount | Yes | Money allocated | ≥ 0. Additive only — don’t record same funds again when verification changes. |
| Currency | Yes | USD only today | Default USD. |
| Metric type | Yes | projected / committed / transferred / verified | Evidence state for this allocation. |
| Optional outcome value | No | Numeric outcome | e.g. 120. |
| Optional outcome label | No | Outcome unit name | e.g. seedlings. Max 100. |
| Optional outcome suffix | No | Suffix after value | Max 20. |
| Occurred at | Yes | Date of allocation | Day picker. |
| NGO or cause | Yes | Which cause received it | Relationship. |
| Related drop or batch | No | Source drop | Relationship. |
| Source | No | Report / transfer reference | Max 220. |
| Published | No | Show on the website | Default on. |
| Sort order | No | Listing order | Lower numbers appear first. Default 0. |

---

## Collection summary

| Collection | Purpose | Must-have before publish |
| --- | --- | --- |
| Artists | `/artists` profiles | Name, role, quote, bio, image/alt, ≥1 fact |
| Causes | NGO partners | Name, focus, summary, image/alt, ≥1 metric |
| Artworks | Source designs | Title, artist line, summary, image/alt, ≥1 hotspot |
| Drops | Limited batches | Eyebrow, title, summary, batch size, reserved, closes at, artist, ≥1 artwork, cause, ≥1 milestone |
| Products | Shop items | Name, form, display price, edition, image or URL + alt, story, ≥1 material, ≥1 variant (unique SKU) |
| Impact Stats | Headline numbers | Label, value, metric type, detail |
| Impact Entries | Impact ledger lines | Title, description, amount, currency, metric type, occurred at, cause |
