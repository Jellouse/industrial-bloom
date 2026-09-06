# Industrial Bloom project handbook

Last reviewed: 2026-09-06

This is the first file future agents and collaborators should read. It describes the brand, product system, website, commerce backend, operations, and deployment workflow. Keep it current whenever architecture or operating procedures change.

> Maintenance note: update this handbook in the same task whenever code, configuration, deployment, catalog, or operating procedures change. Also update the “Last reviewed” date.

## 1. Project in one minute

Industrial Bloom makes small-run aluminium vessels that accentuate the contrast between living plants and industrial material. The visual language is quiet, precise, monochrome, and editorial. Product photography and plant silhouettes carry the page; interface chrome stays minimal.

The codebase is a deliberately small HTML/CSS/JavaScript site with Vercel Functions. Neon Postgres stores products, serial inventory, checkouts, and orders. Stripe Checkout handles payments. Brevo receives newsletter signups.

The shop is intentionally custom. Do not introduce a template storefront or large framework unless the project genuinely outgrows the current system.

## 2. Start here

1. Read this file completely.
2. Run `git status --short`; the workspace may contain intentional uncommitted work.
3. Treat `website/` as source and `public/` as generated output.
4. Run `npm test` before and after changes.
5. Run `npm run build` to reproduce the deploy output.
6. Test on staging before production.
7. Never deploy production unless explicitly requested.

## 3. Brand and experience rules

- Core phrase: “Objects for living things.”
- Concept: nature against industry; delicate silhouettes against extruded aluminium.
- Tone: restrained, premium, direct, slightly experimental.
- Typography: Unica77 for interface and shop-scale display (`clamp(32px, 5.2vw, 56px)` for page titles); Anonymous Pro for eyebrows, serials, and technical metadata.
- Surface: shared paper `#f6f4ef`, ink `#111`, muted `#6a6862`. Page gutter `--page-pad: clamp(24px, 5.5vw, 72px)`.
- Logo: the circular Industrial Bloom mark. On image areas it uses difference blending.
- Expanded white panels use one restrained shadow token; transparent controls rely on the shared radial scrim.
- Motion: smooth and deliberate. Avoid permanent JavaScript animation loops. Pause media when fully off screen and respect reduced motion.
- Shop imagery: large, native-aspect product photographs in an editorial grid (featured first edition, then two columns). Horizontal galleries stay understated: swipe/keyboard only, no arrows or dots.
- Shop controls: each card shows price plus Add and Choose. Choose opens a side panel with gallery, copy, edition, and the technical drawing. Add reserves a serial and updates the header Selection count. A series/pack block can add one available edition of each type.
- Intro transition: “Explore more below” fades over the first 120px of scroll.
- Header: sparse wordmark on a transparent paper field, plus a few text links and a Selection trigger. Motion stays restrained (loader, hover logo turn, drawer slide). Respect reduced motion.
- Mobile Safari is a priority. Avoid fragile viewport hacks and fixed bottom UI behind browser controls.

## 4. Products

The database is the source of truth for live names, prices, availability, serials, and activation state. The protected handbook page displays those live values above this document.

Stable code IDs and their product names:

| Product | Code ID | Primary shop image | Notes |
| --- | --- | --- | --- |
| 660 | `thorn-vase` | `/assets/shop/660-vase-01.jpg` | Intended to be the most accessible product. Live shop currently omits serial 1; do not invent it back until the shelf is counted (7 vs 8). |
| 120 | `column-vase` | `/assets/shop/120-vase-01.jpg` | Counted shelf: 2 pieces. `edition_size` is 2. |
| 490 | `round-vase` | `/assets/shop/490-vase-01.jpg` | Counted shelf: 2 assembled vases. `edition_size` is 2 with serials 1 and 2. Uses four 90-degree extrusions per vase. |
| 28 | `28` | `/assets/shop/technical/type-28.png` | Small single-flower tube. Cover is a technical-drawing stopgap until a real single-vase photo exists. |

`lib/shop/catalog.js` is fallback/seed data, not the normal editing surface. Use the admin panel for ongoing catalog changes. A re-seed must not recreate the old invented editions (Type 120 edition 10 / Type 490 edition 8). Counted-shelf values live in the catalog, in `db/migrations/003_counted_shelf_and_type28.sql`, and in `scripts/align-counted-shelf.js` (`npm run db:align-shelf`). Seed inserts new rows only (`ON CONFLICT DO NOTHING`) and then runs that alignment. Alignment never edits Type 660 serials. Admin saves use `GREATEST` for `edition_size`, so lowering an edition requires a migration or the alignment script, not the admin form.

Source files, renders, manufacturing files, and working media live under `studio/products/<product>/`. Web-ready files live under `website/assets/`.

## 5. Repository map

```text
api/                     Vercel serverless functions
  shop/                  catalog, checkout, webhook, orders, admin APIs
lib/shop/                shared commerce, database, auth, and serial logic
db/migrations/           ordered, versioned database schema changes
scripts/                 database migration and seed commands
studio/                  non-deployed source assets and business files
test/                    Node test suite
website/                 editable static-site source
  assets/                web-ready fonts, images, and video
  shop/                  storefront and admin UI
public/                  generated by npm run build; never edit directly
PROJECT.md               this handbook
vercel.json              root deployment configuration
```

The repository root must be the Vercel deployment root. Deploying from `website/` publishes static pages but omits the root shop APIs.

## 6. Public routes

| Route | Purpose |
| --- | --- |
| `/` | Independent shop front: quiet catalog intro, framed Type 660 well, edition grid, newsletter signup |
| `/shop/` | Product galleries and cart |
| `/shop/success.html` | Checkout confirmation/status |
| `/kit/` | Curated kit/affiliate page |
| `/impressum/` | Public legal stub: operator identity |
| `/widerruf/` | Public legal stub: withdrawal notice |
| `/versand/` | Public legal stub: shipping countries and rate |
| `/datenschutz/` | Public legal stub: what data the site actually uses |
| `/shop/admin/` | Token-protected product and order management |
| `/shop/admin/docs/` | Token-protected project handbook |

Important API routes:

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/subscribe` | POST | Brevo newsletter subscription |
| `/api/shop/products` | GET | Active public catalog |
| `/api/shop/checkout` | POST | Reserve serials and open checkout |
| `/api/shop/order-status` | GET | Success-page order status |
| `/api/shop/stripe-webhook` | POST | Finalize or expire Stripe checkouts |
| `/api/shop/admin/products` | GET/POST | Manage products and serial inventory |
| `/api/shop/admin/images` | GET/POST/DELETE | Manage the authenticated image library |
| `/api/shop/image` | GET | Serve an uploaded product image by ID |
| `/api/shop/admin/orders` | GET/POST | View orders and update fulfillment |
| `/api/shop/admin/docs` | GET | Serve this handbook and live catalog |

## 7. Storefront logic

`website/shop/shop.js` loads `/api/shop/products` and builds an editorial product grid: Type 660 is featured full-width, then Type 120, 490, and 28 sit in a two-column shop. Each card renders the API gallery, name, description, live price, next serial (`N° x of y`), and Add / Choose. Galleries use an explicit index and horizontal transforms for swipe, drag, and keyboard navigation. After a multi-image product is in view for 2.4 seconds, its first image gives one subtle horizontal peek and returns; interaction cancels the hint, and reduced-motion users never receive it. The homepage (`/`) is a product-first shop front in the same paper, Unica77 / Anonymous Pro, and sparse-header language. The launch video stays framed inside a Type 660 well — not a full-viewport cinematic hero. Newsletter and footer stay quiet: workshop notes, Humansize, EU-only shipping, German legal links.

On the first website entry of a browsing session, the teaser or shop opens with a short logo loader after its content and fonts are ready. The actual fixed-header logo starts centered, spins slowly, decelerates to exactly 90 degrees, and rises with the mask into its normal position without swapping elements. Both pages share one session flag, so later navigation skips the loader without a flash. The loader includes a reduced-motion fallback and a timeout that prevents stalled loading from trapping the page.

The cart is stored in `localStorage` as product quantities and paired with an opaque visitor ID. Malformed or unavailable browser storage falls back safely instead of stopping the shop. Every cart change synchronizes a 15-minute server-side reservation in `shop_cart_reservations`. The cart displays the exact held serials and a live countdown. Expired rows remain grayed out with “Reserve again” and “Remove” in black; checkout stays disabled until each row is renewed or removed. Public catalog responses exclude unexpired serials held by other visitors, while retaining the current visitor’s own serials. For an unselected product, the card and detail panel show the lowest available serial.

The header Selection control opens a right-hand cart drawer. Choose opens a matching product-information drawer. Both panels are semantic modal dialogs with keyboard focus trapping, Escape handling, and focus restoration. They slide with `cubic-bezier(0.53, 0, 0.12, 0.99)` and honor reduced motion. `lib/shop/product-metadata.js` is the single code-owned source for verified height, profile dimensions, and technical drawing paths. Types 120, 660, and 28 use their STEP geometry; Type 490 combines all four 90-degree STL quarters into the Ø80 mm assembly. The drawings live in `website/assets/shop/technical/` and use pure white faces/backgrounds with black linework. Dimension geometry shares the vase perspective while labels remain viewer-facing.

The public shop footer links Impressum, Widerruf, Versand, and Datenschutz. It does not link `/shop/admin/`. Admin remains reachable by URL for the operator.

Gallery order is stored per product in `gallery_images`. The storefront uses the API-provided gallery and falls back only to the product cover image.

## 8. Serial inventory and stock management

Inventory is an ordered list of available positive integer serial numbers, not a manually maintained stock count.

In `/shop/admin/`, edit a product and enter serials as either ranges or lists:

```text
1-8
1, 2, 5, 7-10
```

The server validates, deduplicates, and sorts the list. An empty list means sold out. The derived `inventory` value is always the list length. `edition_size` remembers the highest serial ever entered so the storefront can continue to show “N° x of y” after high serials sell.

Checkout behavior:

1. `/api/shop/checkout` locks the requested product rows in a database transaction.
2. It verifies the visitor’s unexpired cart reservations, removes those exact serials from inventory, and stores them in the checkout item JSON.
3. The serials remain unavailable after successful payment.
4. Failed or expired checkouts restore and sort the reserved serials.
5. Stripe webhook processing accepts only the matching pending checkout, paid session, currency, and subtotal.
6. If creating the local checkout record fails after Stripe Checkout exists, the Stripe session is expired before inventory is restored.

Do not reintroduce a separate editable stock count. Serial availability is the source of truth.

Product editors include a gallery manager. Upload JPEG, PNG, WebP, AVIF, or GIF files up to 2 MB, add them to the product, and reorder or remove them with the gallery controls. The first photo is the cover. Uploaded images are stored in `shop_images`; deletion is blocked while an image is assigned to any product gallery.

## 9. Database

Neon Postgres is accessed through `@neondatabase/serverless`. Interactive checkout transactions use the driver’s `Pool` interface.

Versioned SQL in `db/migrations/` creates and upgrades these tables:

- `shop_products`
- `shop_cart_reservations`
- `shop_checkouts`
- `shop_orders`
- `shop_images`

Core product fields include `available_serials INTEGER[]`, `edition_size`, `gallery_images TEXT[]`, price in cents, cover image path, and active state. Checkout and order line items are stored as JSONB snapshots so completed orders retain their serial assignments and purchase-time product details.

Run `npm run db:setup` during environment setup or before deploying a schema or counted-shelf data change. Request handlers never run DDL. Applied migrations are recorded in `shop_schema_migrations`. Data migration `003_counted_shelf_and_type28.sql` aligns live Type 120 / Type 490 editions and replaces the Type 28 workshop cover.

Never commit database credentials. Use Vercel environment variables and least-privilege database access.

## 10. Checkout and orders

Stripe Checkout is created server-side. Prices are always read from Postgres; the browser never supplies trusted prices. Product rows are locked before serial reservation to prevent two customers receiving the same serial.

The success page polls order status. Stripe webhook events create paid orders or restore inventory when a checkout expires. Product loading also reconciles overdue pending checkouts against Stripe, so a missed webhook cannot strand inventory. Live or unresolved payments are never released. Fulfillment status is managed in admin: `unfulfilled`, `packed`, `shipped`, or `cancelled`.

Before enabling real sales, verify:

- Stripe live keys and webhook signing secret are production values.
- The webhook URL points to `/api/shop/stripe-webhook`.
- Shipping countries, fixed shipping price, tax/VAT treatment, refund process, and legal pages are correct.
- A complete real-mode checkout is tested with a low-risk product.

Checkout shipping is a single source in `lib/shop/shipping.js`: €12 tracked, 3–7 business days, countries DE AT BE CZ DK ES FI FR IE IT LU NL PL PT SE. Do not add Japan, UK, or US there without an explicit decision. Public stub pages live at `/impressum/`, `/widerruf/`, `/versand/`, and `/datenschutz/`. They are short and factual (Humansize, Bischof-Vieter-Straße 2, 59379 Selm, VAT ID DE464031324, worksurface.co). They are not lawyer-reviewed policies.

## 11. Newsletter

The shop is public at `/shop/` and is linked from the homepage. Newsletter signup remains; do not claim the shop is unlaunched.

Both landing-page signup forms post to `/api/subscribe`. The Vercel function validates email and adds or updates contacts in the configured Brevo list. Before meaningful traffic, add server-side rate limiting and bot protection.

## 12. Admin and security

Admin requests use `SHOP_ADMIN_TOKEN` through the `X-Shop-Admin-Token` header. The token lives only in session storage in the browser and is checked with a timing-safe comparison on the server.

The staging site itself is public; admin data and this handbook require the token. Do not embed the token, Stripe secrets, database URLs, or Brevo keys in HTML, JavaScript bundles, documentation, screenshots, or git.

This is appropriate for the current tiny operation. Before giving access to multiple staff members, replace the shared token with named accounts, MFA, roles, and an audit trail.

## 13. Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` or `POSTGRES_URL` | Neon Postgres connection |
| `SHOP_ADMIN_TOKEN` | Admin and handbook authentication |
| `SHOP_SITE_URL` | Canonical origin used for checkout redirects |
| `SHOP_DEMO_MODE` | Enables demo checkout only when Stripe is unavailable |
| `STRIPE_SECRET_KEY` | Server-side Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `BREVO_API_KEY` | Newsletter API access |
| `BREVO_LIST_ID` | Destination Brevo contact list |

Other provider-generated Postgres/Stripe variables may exist in Vercel. Code should depend only on the variables listed above unless this table is updated.

## 14. Development and verification

Requirements: a current Node.js version compatible with the lockfile and Vercel project.

```bash
npm install
npm run db:setup
npm test
npm run build
```

`npm run db:setup` runs versioned migrations and then seed. For an existing live database, that is also the path that lowers Type 120 / Type 490 `edition_size` to 2, puts serials 1 and 2 on Type 490, and replaces the Type 28 workshop cover with `/assets/shop/technical/type-28.png`. `npm run db:align-shelf` runs only that data alignment. Request handlers never run DDL.

`npm run build` replaces `public/` with a copy of `website/`, then removes source-only deployment metadata. Never hand-edit `public/`.

For a local static preview, serve `public/` after building. Full checkout/admin testing also needs environment variables and Vercel-compatible functions; `npx vercel dev` is the closest local match.

When changing CSS or browser JavaScript, bump the relevant query-string version in HTML so Safari does not hold stale assets.

## 15. Deployment

Stable URLs:

- Production: `https://industrial-bloom.vercel.app`
- Custom production domain: `https://worksurface.co`
- Staging: `https://industrial-bloom-staging.vercel.app`

Preview/staging workflow from the repository root:

```bash
npm test
npx vercel deploy --yes
npx vercel alias set <generated-preview-domain> industrial-bloom-staging.vercel.app
```

Production workflow, only after explicit approval:

```bash
npm test
npx vercel deploy --prod --yes
```

After deployment, verify the page and relevant API, not only the build log. For shop changes verify `/api/shop/products`; for admin changes verify an authenticated admin request without printing the token.

Official references: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js), [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver), and [Stripe Checkout](https://docs.stripe.com/checkout/quickstart).

## 16. Asset workflow

- Keep editable masters and manufacturing files under `studio/`.
- Keep only web-ready, actually referenced assets under `website/assets/`.
- Prefer WebP for photographs, with correctly sized responsive variants where useful.
- Keep PNG/JPEG fallbacks only when used.
- Videos need a poster, mobile rendition, desktop rendition, `playsinline`, and conservative preload behavior.
- Before deleting an asset, search HTML, CSS, JavaScript, API/catalog data, progressive-loading attributes, and admin-managed database image paths.

## 17. Known gaps and next decisions

- Product 28 still needs a real single-vase photograph. The shop cover is the Type 28 technical drawing as a stopgap.
- Type 660 serial 1 is missing on the live shop; 7 vs 8 has not been counted. Leave that inventory alone until Johann counts the shelf.
- Japan (and UK/US) shipping is later. Current checkout countries are EU only, listed in `lib/shop/shipping.js`.
- Legal pages are short honest stubs. VAT/tax handling, a complete privacy policy, a complete Widerrufsbelehrung, terms, returns, and cookie requirements still need business/legal review before relying on them for real sales.
- Production currently trails the actively developed staging shop; promote only after launch readiness review.
- Admin uses a shared token rather than named users.
- Product copy and final retail pricing remain editable business decisions.
- Add monitoring/alerting before meaningful order volume.

## 18. Change checklist for future agents

- Preserve unrelated user changes in the dirty worktree.
- Prefer the smallest clean change; refactor if logic becomes tangled.
- Update tests and this handbook when behavior or architecture changes.
- Keep public prices server-controlled.
- Keep serial reservation transactional.
- Keep staging and production separate.
- Never print or commit secrets.
- Verify mobile Safari behavior for viewport, scrolling, fixed UI, and media changes.
- Confirm assets are truly unused before deleting them.
