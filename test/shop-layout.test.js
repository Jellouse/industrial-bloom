const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "website/shop/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "website/shop/shop.css"), "utf8");
const js = fs.readFileSync(path.join(root, "website/shop/shop.js"), "utf8");
const admin = fs.readFileSync(path.join(root, "website/shop/admin/index.html"), "utf8");
const adminJs = fs.readFileSync(path.join(root, "website/shop/admin/admin.js"), "utf8");
const adminCss = fs.readFileSync(path.join(root, "website/shop/admin/admin.css"), "utf8");
const landingHtml = fs.readFileSync(path.join(root, "website/index.html"), "utf8");
const landingCss = fs.readFileSync(path.join(root, "website/styles.css"), "utf8");
const docsCss = fs.readFileSync(path.join(root, "website/shop/admin/docs/docs.css"), "utf8");
const metadata = fs.readFileSync(path.join(root, "lib/shop/product-metadata.js"), "utf8");
const catalog = fs.readFileSync(path.join(root, "lib/shop/catalog.js"), "utf8");

test("major responsive type and spacing scale fluidly", () => {
  assert.match(landingCss, /\.bottom-signup\s*{[\s\S]*padding:\s*clamp\(/);
  assert.match(css, /\.shop-intro\s*{[\s\S]*padding:\s*clamp\(/);
  assert.match(css, /\.shop-footer\s*{[^}]*padding:\s*clamp\(/);
  assert.match(adminCss, /\.panel-heading h1\s*{[^}]*font-size:clamp\(/);
  assert.match(docsCss, /\.documentation h2\s*{[^}]*font-size:clamp\(/);
});

test("the old bottom gradient and root image mirror are removed", () => {
  assert.doesNotMatch(html, /bottom-gradient/);
  assert.doesNotMatch(css, /\.bottom-gradient|--active-product-image/);
  assert.doesNotMatch(js, /--active-product-image|mirroredProductId/);
});

test("the editorial shop uses a sparse header instead of a floating claim dock", () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /class="shop-header is-at-top"/);
  assert.match(html, /class="wordmark">Industrial Bloom/);
  assert.match(html, /class="cart-toggle"[\s\S]*aria-controls="cart"/);
  assert.match(css, /\.shop-header\s*{[\s\S]*position:\s*fixed;[\s\S]*z-index:\s*100;/);
  assert.match(css, /\.product-grid\s*{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*1fr 1fr;/);
  assert.doesNotMatch(html, /shop-dock|dock-scrim|dock-morph|dock-add/);
  assert.doesNotMatch(css, /\.shop-dock-positioner|\.dock-scrim|\.dock-morph/);
  assert.doesNotMatch(js, /visualViewport|syncVisualViewport|syncMorphOrigin|setMorphOrigin/);
});

test("live Type-prefixed catalog names do not double the Type kicker", () => {
  assert.match(js, /replace\(\/\^type\\s\+\/i, ""\)/);
});

test("product cards expose price plus Add and Choose", () => {
  assert.match(js, /element\("article", index === 0 \? "product-card is-featured" : "product-card"\)/);
  assert.match(js, /element\("p", "product-price", money\(product\.priceCents/);
  assert.match(js, /element\("button", "card-add", "Add"\)/);
  assert.match(js, /element\("button", "card-choose", "Choose"\)/);
  assert.match(js, /add\.addEventListener\("click", \(\) => addProduct\(product\)\)/);
  assert.match(js, /choose\.addEventListener\("click", \(\) => openInfo\(product\)\)/);
  assert.match(js, /infoClaim\.addEventListener\("click", \(\) => claimProduct\(activeProduct\)\)/);
});

test("the series pack can add available editions or return to the grid", () => {
  assert.match(html, /id="series" class="collection"/);
  assert.match(html, /class="collection-add"[\s\S]*Add/);
  assert.match(html, /class="collection-choose"[\s\S]*Choose/);
  assert.match(js, /async function addSeries\(\)/);
  assert.match(js, /collectionChoose\.addEventListener\("click"/);
  assert.match(js, /getElementById\("editions"\)\?\.scrollIntoView/);
});

test("the shop newsletter posts to Brevo through the existing subscribe API", () => {
  assert.match(html, /id="newsletter" class="shop-newsletter"/);
  assert.match(html, /class="signup"/);
  assert.match(js, /fetch\("\/api\/subscribe"/);
});

test("Choose opens a side panel with verified product drawings", () => {
  assert.match(html, /id="product-info"[\s\S]*role="dialog"/);
  assert.match(html, /class="technical-image"/);
  assert.match(html, /class="info-claim"[\s\S]*info-claim-edition/);
  assert.match(css, /\.product-info\s*{[\s\S]*position:\s*fixed;/);
  assert.match(js, /function openInfo\(product\)/);
  assert.match(js, /const technical = activeProduct\?\.technical/);
  assert.match(js, /technicalImage\.src = `\.\.\$\{technical\.imageUrl\}`/);
  assert.doesNotMatch(html, /dimension-height|dimension-width|technical-caption/);
  assert.doesNotMatch(js, /Isometric line drawing · source STEP/);
  assert.match(metadata, /"round-vase":\s*{[\s\S]*profile:\s*"4 × 90° quarter extrusions · Ø80 mm assembled"/);
  assert.match(metadata, /"thorn-vase":\s*{[\s\S]*height:\s*"200 mm"/);
  for (const type of ["120", "660", "490", "28"]) {
    assert.equal(fs.existsSync(path.join(root, `website/assets/shop/technical/type-${type}.png`)), true);
  }
});

test("the cart is a side drawer with checkout, not a morphing pill", () => {
  assert.match(html, /id="cart"[\s\S]*role="dialog"/);
  assert.match(css, /\.cart,[\s\S]*\.product-info\s*{[\s\S]*position:\s*fixed;[\s\S]*transform:\s*translateX\(100%\)/);
  assert.match(css, /\.cart\.is-open,[\s\S]*\.product-info\.is-open\s*{[\s\S]*transform:\s*translateX\(0\)/);
  assert.match(css, /\.checkout\s*{[\s\S]*height:\s*48px;[\s\S]*font-size:\s*15px;/);
  assert.match(css, /--checkout-radius:\s*3px;/);
  assert.match(js, /function openCart\(\)/);
  assert.match(js, /function closeCart\(onClosed\)/);
  assert.match(js, /cartBackdrop\.addEventListener\("click", \(\) => closeOpenPanel\(\)\)/);
});

test("the logo has a stable top state during elastic scrolling", () => {
  assert.match(html, /shop-header is-at-top/);
  assert.match(js, /shopHeader\.classList\.toggle\("is-at-top", window\.scrollY <= 0\)/);
});

test("the shop opens with a short logo-led mask reveal", () => {
  assert.match(html, /document\.documentElement\.classList\.add\("is-loading"\)/);
  assert.doesNotMatch(html, /Loading objects/);
  assert.match(html, /class="product-grid" aria-live="polite" aria-busy="true"/);
  assert.match(html, /<body>/);
  assert.match(html, /class="site-loader"[\s\S]*class="loader-mask"/);
  assert.doesNotMatch(html, /loader-mark|loader-logo/);
  assert.match(css, /html\.is-revealing \.loader-mask\s*{[\s\S]*translateY\(-100%\)[\s\S]*900ms cubic-bezier\(0\.53, 0, 0\.12, 0\.99\)/);
  assert.match(css, /html\.is-loading \.shop-header \.brand\s*{[\s\S]*top:\s*50%;[\s\S]*translate\(-50%, -50%\)/);
  assert.match(js, /const loaderSpinDuration = 4800/);
  assert.match(js, /const shouldRunPageLoader = document\.documentElement\.classList\.contains\("is-loading"\)/);
  assert.match(js, /const targetAngle = currentAngle <= 90 \? 90 : 450/);
  assert.match(js, /logoRotation = 90;\s*renderLogo\(\);/);
  assert.match(js, /const minimumTime = prefersReducedMotion \? 0 : 650/);
  assert.match(js, /document\.documentElement\.classList\.remove\("is-loading", "is-revealing"\)/);
  assert.match(js, /\.finally\(finishPageLoader\)/);
});

test("the landing page treats the shop as open", () => {
  assert.doesNotMatch(landingHtml, /when we launch|coming soon/i);
  assert.match(landingHtml, /class="shop-link" href="shop\/">Shop<\/a>/);
  assert.match(landingHtml, /class="launch-note"><a href="shop\/">The shop is open<\/a>/);
  assert.match(landingHtml, /class="launch-note launch-note-bottom"><a href="shop\/">The shop is open<\/a>/);
  assert.match(landingHtml, /href="impressum\/">Impressum/);
  assert.match(landingHtml, /href="widerruf\/">Widerruf/);
  assert.match(landingHtml, /href="versand\/">Versand/);
  assert.match(landingHtml, /href="datenschutz\/">Datenschutz/);
});

test("the public shop footer hides admin and links legal stubs", () => {
  assert.doesNotMatch(html, /Manage shop|href="admin\/"/);
  assert.match(html, /href="\.\.\/impressum\/">Impressum/);
  assert.match(html, /href="\.\.\/widerruf\/">Widerruf/);
  assert.match(html, /href="\.\.\/versand\/">Versand/);
  assert.match(html, /href="\.\.\/datenschutz\/">Datenschutz/);
  assert.match(html, /Part of Humansize CORP/);
  assert.match(html, /No shipping to the UK, US, or Japan/);
});

test("the teaser shares the one-time logo loader", () => {
  assert.match(landingHtml, /industrial-bloom-loader-seen/);
  assert.match(landingHtml, /class="site-loader"[\s\S]*class="loader-mask"/);
  assert.match(landingHtml, /class="logo-anchor"[\s\S]*class="logo"/);
  assert.match(landingCss, /html\.is-loading \.logo-anchor\s*{[\s\S]*top:\s*50%;[\s\S]*translate\(-50%, -50%\)/);
  assert.match(landingHtml, /const loaderSpinDuration = 4800/);
  assert.match(landingHtml, /logoRotation = 90;[\s\S]*renderLogoRotation\(\);[\s\S]*classList\.remove\("is-loading", "is-revealing"\)/);
});

test("cart rows align prices and keep reservation actions", () => {
  assert.match(css, /\.cart-item\s*{[\s\S]*padding:\s*16px 0;/);
  assert.match(css, /\.cart-item\s*{[\s\S]*gap:\s*5px 16px;/);
  assert.match(css, /\.cart-item:first-child\s*{\s*padding-top:\s*8px;/);
  assert.match(css, /\.cart-item-details\s*{\s*grid-row:\s*1;\s*grid-column:\s*1;/);
  assert.match(css, /\.cart-item-price\s*{\s*grid-row:\s*1 \/ 3;\s*grid-column:\s*2;[\s\S]*justify-self:\s*end;/);
  assert.match(js, /cart-item-price", shortMoney\(product\.priceCents \* quantity, " €"\)\)/);
  assert.doesNotMatch(js, /" Euro"/);
});

test("cart rows only expose removal, not quantity controls", () => {
  assert.doesNotMatch(js, /data-action = "decrease"|data-action = "increase"|Decrease .* quantity|Increase .* quantity/);
  assert.match(js, /details\.append\(element\("span", "quantity"/);
  assert.match(js, /const remove = element\("button", "remove", "Remove"\)/);
});

test("removing the final cart item closes the cart", () => {
  assert.match(js, /if \(!Object\.keys\(cart\)\.length && cartPanel\.classList\.contains\("is-open"\)\) \{[\s\S]*closeCart\(renderCart\);[\s\S]*return;/);
  assert.match(js, /function closeCart\(onClosed\)[\s\S]*classList\.add\("is-cart-closing"\);/);
  assert.match(js, /cartCloseTimer = setTimeout\(\(\) => \{[\s\S]*\}, 420\)/);
  assert.match(js, /infoCloseTimer = setTimeout\(\(\) => \{[\s\S]*\}, 420\)/);
  assert.match(js, /cartBackdrop\.hidden = true;/);
});

test("the shop displays the lowest available product serial number", () => {
  assert.match(js, /const selected = cart\[product\.id\] \|\| 0;/);
  assert.match(js, /return product\.serialNumbers\?\.\[selected\];/);
  assert.match(js, /`N° \$\{serialNumber\} of \$\{product\.editionSize\}`/);
});

test("cart rows show a minimal live reservation timer beside remove", () => {
  assert.match(js, /actions\.append\(timer, separator, remove\)/);
  assert.match(js, /`Reserved for \$\{formatReservationTime\(remaining\)\} min`/);
  assert.match(js, /timer\.closest\("\.cart-item"\)\.classList\.toggle\("is-expired"/);
  assert.match(js, /timer\.dataset\.action = "reserve-again"/);
  assert.match(js, /syncCartReservations\(cart, productId\)/);
  assert.match(js, /setInterval\(updateReservationTimers, 1000\)/);
  assert.match(css, /\.cart-item-actions\s*{[\s\S]*display:\s*flex;[\s\S]*font-size:\s*10px;/);
  assert.match(css, /\.reservation-timer\s*{[\s\S]*color:\s*#000;[\s\S]*font-variant-numeric:\s*tabular-nums;/);
  assert.match(css, /\.cart-item\.is-expired \.cart-item-actions > :not\(\.reservation-timer\):not\(\.remove\)\s*{[\s\S]*opacity:\s*0\.24;[\s\S]*grayscale\(1\)/);
  assert.match(css, /\.cart-item\.is-expired \.reservation-timer\s*{\s*color:\s*#000;\s*cursor:\s*pointer;/);
  assert.match(css, /\.cart-item\.is-expired \.remove\s*{\s*color:\s*#000;\s*opacity:\s*1;\s*filter:\s*none;/);
});

test("Choose Add reserves immediately, then opens the cart for checkout", () => {
  assert.match(js, /async function claimProduct\(product\)/);
  assert.match(js, /const added = await addProduct\(product\);/);
  assert.match(js, /if \(!added\) return false;\s*openCart\(\);/);
  assert.doesNotMatch(js, /closeInfo\(\(\) => addProduct/);
});

test("closed and closing drawers cannot steal clicks from Add or Choose", () => {
  assert.match(css, /\.cart,[\s\S]*\.product-info\s*{[\s\S]*pointer-events:\s*none;/);
  assert.match(css, /\.cart\.is-open,[\s\S]*\.product-info\.is-open\s*{[\s\S]*pointer-events:\s*auto;/);
  assert.match(css, /\.cart\.is-cart-closing,[\s\S]*\.product-info\.is-info-closing\s*{[\s\S]*pointer-events:\s*none;/);
  assert.match(css, /\.cart-backdrop\[hidden\]\s*{[\s\S]*pointer-events:\s*none;/);
  assert.match(js, /function hideBackdropIfIdle\(\)/);
  assert.match(js, /if \(cartPanel\.classList\.contains\("is-open"\) \|\| infoPanel\.classList\.contains\("is-open"\)\) return;/);
});

test("cart and product-info drawers trap focus, restore it, and stay mutually exclusive", () => {
  assert.match(html, /id="product-info"[\s\S]*role="dialog"[\s\S]*inert/);
  assert.match(html, /id="cart"[\s\S]*role="dialog"[\s\S]*inert/);
  assert.match(js, /function setDialogOpen\(panel, open\)[\s\S]*panel\.inert = !open;/);
  assert.match(js, /if \(infoPanel\.classList\.contains\("is-open"\)\) closeInfo\(\);/);
  assert.match(js, /if \(cartPanel\.classList\.contains\("is-open"\)\) closeCart\(\);/);
  assert.match(js, /if \(activeDialog\) return;/);
  assert.match(js, /if \(event\.key === "Escape"\) \{\s*closeOpenPanel\(\);/);
  assert.match(js, /activeDialog\.querySelectorAll\(\s*'button:not\(:disabled\), \[href\], input:not\(:disabled\), \[tabindex\]:not\(\[tabindex="-1"\]\)'/);
});

test("checkout posts the reserved cart without changing the payload shape", () => {
  assert.match(js, /async function startCheckout\(\) \{\s*if \(addLock \|\| checkoutLock\) return;/);
  assert.match(js, /body: JSON\.stringify\(\{\s*visitorId,\s*customerEmail: "",\s*items: cartItemsPayload\(\),\s*\}\)/);
  assert.match(js, /fetch\("\/api\/shop\/checkout"/);
});

test("drawer buttons darken subtly on hover", () => {
  assert.match(css, /@media \(hover: hover\)[\s\S]*\.checkout:hover,[\s\S]*\.info-claim:not\(:disabled\):hover\s*{[\s\S]*filter:\s*brightness\(0\.9\)/);
});

test("product imagery uses understated horizontal galleries", () => {
  assert.doesNotMatch(css, /scroll-snap-type/);
  assert.doesNotMatch(js, /productGalleryImages/);
  assert.match(js, /product\.galleryImages\?\.length/);
  assert.doesNotMatch(js, /gallery-arrow|gallery-dots|gallery-controls|gallery-navigation/);
  assert.doesNotMatch(css, /\.gallery-arrow|\.gallery-dot|\.gallery-controls|\.gallery-navigation/);
  assert.match(js, /transform 260ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  assert.match(js, /translate3d\(\$\{-nextIndex \* 100\}%, 0, 0\)/);
  assert.match(js, /gallery\.addEventListener\("pointerup", finishSwipe\)/);
  assert.match(js, /gallery\.setPointerCapture\(event\.pointerId\)/);
  assert.match(css, /\.product-gallery\s*{[\s\S]*touch-action:\s*pan-y;/);
  assert.match(css, /\.gallery-track\s*{[\s\S]*will-change:\s*transform;/);
  assert.match(js, /aria-roledescription", "carousel"/);
  assert.match(js, /galleryNudges\.set\(gallery/);
  assert.match(js, /\}, 2400\)/);
  assert.match(js, /track\.animate\([\s\S]*translate3d\(-\$\{distance\}px/);
  assert.match(js, /Math\.min\(32, Math\.max\(24, track\.clientWidth \* 0\.03\)\)/);
  assert.match(js, /cubic-bezier\(0\.45, 0, 0\.55, 1\)/);
  assert.match(js, /duration:\s*1800/);
  assert.match(js, /prefersReducedMotion[\s\S]*nudgedProducts\.has\(product\.id\)/);
  assert.match(js, /event\.key !== "ArrowLeft" && event\.key !== "ArrowRight"/);
  assert.match(css, /\.product-card\s*{[\s\S]*overflow:\s*clip;/);
  assert.doesNotMatch(js, /positionGalleryControls|scheduleGalleryControls|galleryControlFrame/);
  assert.match(catalog, /"thorn-vase"[\s\S]*galleryImages:\s*\[[\s\S]*"\/assets\/shop\/660-vase-01\.jpg"/);
  assert.match(catalog, /"column-vase"[\s\S]*galleryImages:\s*\[[\s\S]*"\/assets\/shop\/120-vase-01\.jpg",[\s\S]*"\/assets\/shop\/120-vase-02\.jpg"/);
  assert.match(catalog, /"round-vase"[\s\S]*galleryImages:\s*\[[\s\S]*"\/assets\/shop\/490-vase-01\.jpg",[\s\S]*"\/assets\/shop\/490-vase-02\.jpg"/);
  assert.doesNotMatch(js, /vase-alt\.jpg/);
});

test("shop galleries keep intrinsic photo ratios and reuse launch progressive upgrades", () => {
  assert.doesNotMatch(css, /\.product-card\s*{[^}]*height:\s*100vh/);
  assert.doesNotMatch(css, /\.product-card\s*{[^}]*height:\s*100svh/);
  assert.match(css, /\.gallery-slide img\s*{[\s\S]*width:\s*100%;[\s\S]*height:\s*auto;/);
  assert.doesNotMatch(css, /\.gallery-slide img\s*{[^}]*object-fit:\s*cover/);
  assert.match(css, /\.gallery-track\s*{[\s\S]*align-items:\s*flex-start;/);
  assert.match(js, /function upgradeImage\(image\)/);
  assert.match(js, /neededWidth = Math\.ceil\(image\.getBoundingClientRect\(\)\.width \* window\.devicePixelRatio\)/);
  assert.match(js, /rootMargin:\s*"800px 0px"/);
  assert.match(js, /image\.dataset\.webpSrcset = toShopSrcset\(ladder\.webpSrcset\)/);
  assert.match(js, /image\.dataset\.srcset = toShopSrcset\(ladder\.srcset\)/);
  assert.match(landingHtml, /render-6-640\.webp 398w/);
  assert.match(js, /render-6-640\.webp 398w, \/assets\/responsive\/render-6-1280\.webp 796w, \/assets\/responsive\/render-6-1920\.webp 1195w, \/assets\/responsive\/render-6-full\.webp 3088w/);
  assert.match(js, /render-3-900\.webp 603w, \/assets\/responsive\/render-3-1600\.webp 1071w, \/assets\/responsive\/render-3-full\.webp 2334w/);
  assert.match(js, /round-vase-900\.webp 759w, \/assets\/responsive\/round-vase-1600\.webp 1349w, \/assets\/responsive\/round-vase-full\.webp 1517w/);
  assert.match(js, /"\/assets\/shop\/660-vase-01\.jpg": \[1074, 1920\]/);
  assert.match(js, /"\/assets\/shop\/120-vase-01\.jpg": \[1607, 2400\]/);
  assert.match(js, /"\/assets\/shop\/120-vase-02\.jpg": \[2242, 2400\]/);
  assert.match(js, /"\/assets\/shop\/490-vase-01\.jpg": \[1080, 1920\]/);
  assert.match(js, /"\/assets\/shop\/490-vase-02\.jpg": \[1080, 1920\]/);
  assert.doesNotMatch(js, /test: \/\\\/assets\\\/shop/);
  assert.match(js, /function syncGalleryHeight/);
  assert.match(js, /gallery\.style\.height = `\$\{height\}px`/);
  assert.match(js, /width \* intrinsicHeight \/ intrinsicWidth/);
  assert.match(js, /syncGalleryHeight\(nextIndex\)/);
});

test("the intro reuses the landing-page explore callout", () => {
  assert.match(html, /class="explore" href="#editions">Explore more below<\/a>/);
  assert.match(css, /\.explore\s*{[\s\S]*position:\s*fixed;[\s\S]*bottom:\s*clamp\(32px, 4svh, 42px\)/);
  assert.match(js, /const progress = Math\.max\(0, Math\.min\(1, window\.scrollY \/ introHandoffDistance\)\)/);
  assert.match(js, /explore\.style\.opacity = 1 - progress/);
});

test("explore callouts share a subtle motion-safe shimmer", () => {
  for (const stylesheet of [landingCss, css]) {
    assert.match(stylesheet, /\.explore\s*{[\s\S]*linear-gradient\(110deg,[\s\S]*animation:\s*explore-shimmer 5s ease-in-out infinite;/);
    assert.match(stylesheet, /@keyframes explore-shimmer\s*{[\s\S]*background-position:\s*-100% 50%;/);
    assert.match(stylesheet, /@media \(prefers-reduced-motion:\s*reduce\)\s*{[\s\S]*\.explore\s*{\s*animation:\s*none;/);
  }
});

test("the desktop collection heading uses the requested light weight", () => {
  assert.match(css, /@media \(min-width: 801px\)\s*{[\s\S]*\.shop-intro h1\s*{[\s\S]*font-weight:\s*200;/);
});

test("the editorial grid collapses to one column on small screens", () => {
  assert.match(css, /@media \(max-width: 800px\)\s*{[\s\S]*\.product-grid\s*{[\s\S]*grid-template-columns:\s*1fr;/);
  assert.match(css, /@media \(max-width: 800px\)\s*{[\s\S]*\.cart,[\s\S]*\.product-info\s*{[\s\S]*width:\s*100vw;/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test("admin login and dashboard honor hidden state", () => {
  assert.match(adminCss, /\[hidden\]\s*{\s*display:\s*none !important;/);
});

test("admin product editing includes image upload and management", () => {
  assert.match(admin, /class="manage-images"/);
  assert.match(admin, /class="image-dialog"/);
  assert.match(admin, /type="file"[^>]*accept="image\/jpeg,image\/png,image\/webp,image\/avif,image\/gif"/);
  assert.match(adminJs, /await api\("images"/);
  assert.match(adminJs, /dataset\.imageUrl/);
  assert.match(adminCss, /\.image-list\s*{[^}]*grid-template-columns:repeat\(3/);
  assert.match(admin, /class="gallery-image-list"/);
  assert.match(adminJs, /dataset\.galleryAction/);
  assert.match(adminJs, /galleryImages:\s*editingGallery/);
  assert.match(adminJs, /\[editingGallery\[index\], editingGallery\[target\]\]/);
});
