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

test("product controls use a root-level Safari-safe readability scrim", () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /class="dock-scrim" aria-hidden="true"/);
  assert.match(html, /class="shop-dock-positioner"[\s\S]*class="shop-dock"/);
  assert.match(css, /\.dock-scrim\s*{[\s\S]*position:\s*fixed;[\s\S]*z-index:\s*28;[\s\S]*height:\s*calc\(var\(--scrim-viewport-height\) \+ 180px\);[\s\S]*radial-gradient\(/);
  assert.match(css, /ellipse 360px 300px at 50% calc\(var\(--scrim-viewport-height\) - var\(--dock-bottom\) - 98px\)/);
  assert.match(css, /@supports \(height:\s*100lvh\)\s*{[\s\S]*--scrim-viewport-height:\s*100lvh;/);
  assert.match(css, /\.shop-dock-positioner\s*{[\s\S]*position:\s*fixed;[\s\S]*bottom:\s*var\(--dock-bottom\);[\s\S]*left:\s*50%;[\s\S]*width:\s*0;[\s\S]*height:\s*0;/);
  assert.doesNotMatch(js, /visualViewport|syncVisualViewport/);
  assert.match(css, /\.shop-dock\s*{[\s\S]*position:\s*absolute;[\s\S]*top:\s*0;[\s\S]*left:\s*0;[\s\S]*width:\s*330px;/);
  assert.match(css, /\.shop-dock\s*{[\s\S]*translate:\s*-50% -100%;/);
  assert.match(css, /\.shop-dock:is\(\.is-cart-open, \.is-info-open\)\s*{\s*translate:\s*-50% calc\(-50dvh \+ var\(--dock-bottom\) - 50%\);/);
  assert.match(css, /\.info-toggle\s*{[\s\S]*position:\s*absolute;/);
  assert.doesNotMatch(css, /\.shop-dock\s*{[^}]*translate3d\(-50%, -50%, 0\)/);
  assert.doesNotMatch(css, /\.shop-dock-positioner::before|--dock-gradient-clearance/);
  assert.doesNotMatch(css, /\.shop-dock::(?:before|after)/);
  assert.doesNotMatch(css, /bottom:\s*calc\(-240px - env\(safe-area-inset-bottom\)\)/);
  assert.match(js, /document\.documentElement\.style\.setProperty\("--dock-opacity", opacity\.toFixed\(3\)\)/);
  assert.doesNotMatch(css, /is-switching/);
  assert.match(css, /\.shop-header\s*{[\s\S]*z-index:\s*100;[\s\S]*mix-blend-mode:\s*difference;/);
});

test("product metadata does not duplicate the Type prefix", () => {
  assert.doesNotMatch(html, /<span>Type <strong class="dock-product-name"/);
  assert.match(html, /class="dock-product-copy"[\s\S]*class="dock-product-name"[\s\S]*class="dock-product-description"/);
  assert.match(js, /dockDescription\.textContent = activeProduct\.description/);
  assert.match(css, /\.dock-product-copy\s*{[\s\S]*text-align:\s*center;/);
  assert.match(css, /--ui-shadow:\s*0 6px 24px rgba\(0, 0, 0, 0\.12\)/);
  assert.doesNotMatch(css, /--button-shadow|--button-backdrop|\.dock-product-copy\s*{[^}]*text-shadow/);
  assert.match(css, /\.dock-morph\s*{[\s\S]*box-shadow:\s*var\(--ui-shadow\)/);
});

test("the dock crossfades with the intro prompt", () => {
  assert.match(css, /\.shop-intro\s*{[\s\S]*z-index:\s*35;/);
  assert.match(css, /\.shop-dock-positioner\s*{[\s\S]*z-index:\s*30;/);
  assert.match(css, /\.shop-dock\s*{[\s\S]*opacity:\s*var\(--dock-opacity, 0\);[\s\S]*pointer-events:\s*none;/);
  assert.match(js, /const clearance = shopDock\.getBoundingClientRect\(\)\.top - shopIntro\.getBoundingClientRect\(\)\.bottom/);
  assert.match(js, /const clearanceProgress = Math\.max\(0, Math\.min\(1, clearance \/ 48\)\)/);
  assert.match(js, /const introHandoffDistance = 120;/);
  assert.match(js, /const introProgress = Math\.max\(0, Math\.min\(1, window\.scrollY \/ introHandoffDistance\)\)/);
  assert.match(js, /const opacity = Math\.min\(clearanceProgress, introProgress\)/);
  assert.match(js, /classList\.toggle\("is-dock-interactive", opacity >= 0\.98\)/);
  assert.doesNotMatch(js, /dockHideTimer|isOverPictures|is-visible/);
});

test("the logo has a stable top state during elastic scrolling", () => {
  assert.match(html, /shop-header is-at-top/);
  assert.match(css, /\.shop-header\.is-at-top\s*{\s*mix-blend-mode:\s*normal;/);
  assert.match(css, /\.shop-header\.is-at-top \.shop-logo\s*{\s*filter:\s*none;/);
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
  assert.match(css, /html\.is-loading \.shop-header\s*{[\s\S]*top:\s*50%;[\s\S]*translate\(-50%, -50%\)/);
  assert.match(css, /html\.is-revealing \.shop-header\s*{[\s\S]*top:\s*clamp\(24px, 4svh, 34px\);[\s\S]*translateX\(-50%\)/);
  assert.match(js, /const loaderSpinDuration = 4800/);
  assert.match(js, /const shouldRunPageLoader = document\.documentElement\.classList\.contains\("is-loading"\)/);
  assert.match(js, /const targetAngle = currentAngle <= 90 \? 90 : 450/);
  assert.match(js, /logoRotation = 90;\s*logoTargetRotation = 90;\s*renderLogo\(\);/);
  assert.match(js, /const minimumTime = prefersReducedMotion \? 0 : 650/);
  assert.match(js, /document\.documentElement\.classList\.remove\("is-loading", "is-revealing"\)/);
  assert.match(js, /\.finally\(finishPageLoader\)/);
});

test("the teaser shares the one-time logo loader", () => {
  assert.match(landingHtml, /industrial-bloom-loader-seen/);
  assert.match(landingHtml, /class="site-loader"[\s\S]*class="loader-mask"/);
  assert.match(landingHtml, /class="logo-anchor"[\s\S]*class="logo"/);
  assert.match(landingCss, /\.logo-anchor\s*{[\s\S]*mix-blend-mode:\s*difference;/);
  assert.match(landingCss, /html\.is-loading \.logo-anchor\s*{[\s\S]*top:\s*50%;[\s\S]*translate\(-50%, -50%\)/);
  assert.match(landingHtml, /const loaderSpinDuration = 4800/);
  assert.match(landingHtml, /logoRotation = 90;[\s\S]*renderLogoRotation\(\);[\s\S]*classList\.remove\("is-loading", "is-revealing"\)/);
});

test("the cart count sits on the Claim button corner", () => {
  assert.match(html, /dock-primary[\s\S]*dock-add[\s\S]*cart-toggle/);
  assert.match(css, /\.dock-actions\s*{[\s\S]*position:\s*relative;/);
  assert.match(css, /--info-group-offset:\s*23\.5px;/);
  assert.match(css, /\.dock-actions\s*{[\s\S]*transform:\s*translateX\(var\(--info-group-offset\)\);/);
  assert.match(css, /\.dock-primary\s*{[\s\S]*position:\s*static;/);
  assert.match(css, /\.cart-count\s*{[\s\S]*top:\s*-9px;[\s\S]*right:\s*-9px;[\s\S]*place-items:\s*center;/);
  assert.match(html, /mask id="dock-outline-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse"/);
  assert.match(html, /rect class="dock-outline-shape" mask="url\(#dock-outline-mask\)"/);
  assert.match(html, /mask id="selection-surface-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse"/);
  assert.match(html, /rect class="selection-surface-shape" fill="white" mask="url\(#selection-surface-mask\)"/);
  assert.match(css, /shop-dock:not\(\.is-cart-open\) \.dock-morph\s*{\s*opacity:\s*0;/);
  assert.match(css, /\.cart-count\s*{[\s\S]*background:\s*#fff;[\s\S]*text-align:\s*center;/);
  assert.match(css, /\.cart-count\s*{[\s\S]*border:\s*0;/);
  assert.doesNotMatch(html, /dock-fill-mask/);
  assert.match(js, /dockPrimary\.style\.setProperty\("--dock-button-width", `\$\{dockWidth\}px`\)/);
  assert.match(js, /sizePillShape\(dockOutlineShape, dockWidth, dockHeight, 0\.5\)/);
  assert.match(js, /const countCenterX = cartCount\.offsetLeft \+ cartCount\.offsetWidth \/ 2/);
  assert.match(js, /const countCenterY = cartCount\.offsetTop \+ cartCount\.offsetHeight \/ 2/);
  assert.match(js, /selectionSurfaceMask,[\s\S]*countCenterX,[\s\S]*countCenterY,[\s\S]*countRadius/);
  assert.match(js, /dockOutlineMask,[\s\S]*countCenterY \+ \(dockHeight - selectionHeight\) \/ 2,[\s\S]*hasCountGap \? countRadius : 0/);
});

test("the selection pill has balanced generous side padding", () => {
  assert.match(css, /\.cart-toggle\s*{[\s\S]*padding-inline:\s*18px;/);
  assert.match(css, /\.dock-add,\s*\.cart-toggle\s*{[\s\S]*height:\s*38px;/);
  assert.match(html, /class="cart-toggle-slot">[\s\S]*class="cart-toggle"/);
  assert.match(css, /\.cart-toggle-slot\s*{[\s\S]*position:\s*absolute;[\s\S]*inset:\s*0;[\s\S]*display:\s*grid;[\s\S]*place-items:\s*center;/);
  assert.match(css, /\.cart-toggle\s*{[\s\S]*position:\s*relative;[\s\S]*transform:\s*scale\(0\.94\);/);
  assert.doesNotMatch(css, /\.cart-toggle\s*{[^}]*translate:/);
  assert.match(css, /\.shop-dock\.has-current-selection \.cart-toggle\s*{[\s\S]*transform:\s*scale\(1\);/);
});

test("adding to cart fills, confirms, and settles into the selection pill", () => {
  assert.match(html, /selection-prefix">Added to/);
  assert.match(html, /selection-text">Your selection/);
  assert.match(css, /\.dock-add\s*{[\s\S]*overflow:\s*hidden;[\s\S]*contain:\s*paint;/);
  assert.match(html, /class="dock-fill" aria-hidden="true"/);
  assert.match(css, /\.dock-fill\s*{[\s\S]*overflow:\s*hidden;[\s\S]*border-radius:\s*inherit;[\s\S]*clip-path:\s*inset\(0 100% 0 0\);[\s\S]*transition:\s*none;/);
  assert.match(html, /class="dock-fill-svg"[\s\S]*class="dock-fill-shape" fill="white"/);
  assert.match(css, /\.shop-dock\.is-adding \.dock-fill\s*{\s*clip-path:\s*inset\(0\);\s*transition:\s*clip-path 1500ms cubic-bezier\(0\.7, 0, 0\.15, 1\)/);
  assert.match(css, /\.shop-dock\.is-preparing-add \.dock-fill,[\s\S]*\.shop-dock\.is-confirming-add \.dock-fill\s*{\s*clip-path:\s*inset\(0\);/);
  assert.match(css, /\.cart-toggle\s*{[\s\S]*background:\s*transparent;/);
  assert.match(css, /\.shop-dock\.has-cart:not\(\.has-current-selection\) \.cart-toggle\s*{[\s\S]*width:\s*var\(--dock-button-width\) !important;/);
  assert.match(css, /\.selection-prefix\s*{[\s\S]*max-width:\s*0;[\s\S]*transition:/);
  assert.match(css, /\.shop-dock\.is-confirming-add \.selection-prefix\s*{[\s\S]*max-width:\s*72px;/);
  assert.match(js, /addTimer = setTimeout\(resolve, 1500\)[\s\S]*Promise\.all\(\[[\s\S]*syncCartReservations\(nextCart\),[\s\S]*animationDelay/);
  assert.match(js, /cart = nextCart;\s*reservations = nextReservations;[\s\S]*renderCart\(\);/);
  assert.doesNotMatch(js, /setMorphOrigin\(dockAdd\.getBoundingClientRect\(\)\)/);
  assert.match(js, /requestAnimationFrame\(\(\) => requestAnimationFrame\(\(\) => \{[\s\S]*classList\.add\("is-confirming-add"\)/);
  assert.match(js, /cartToggle\.style\.width = `\$\{dockAdd\.getBoundingClientRect\(\)\.width\}px`/);
  assert.match(js, /animateSelectionWidth\(selectionButtonWidth\(true\)\)/);
  assert.match(css, /\.cart-toggle\s*{[\s\S]*transition:\s*width 420ms cubic-bezier\(0\.53, 0, 0\.12, 0\.99\)/);
  assert.match(js, /shopDock\.classList\.remove\("is-confirming-add"\)[\s\S]*\}, 1400\)/);
  assert.match(js, /if \(shopDock\.classList\.contains\("has-current-selection"\)\) \{\s*animateSelectionWidth\(selectionButtonWidth\(\)\);\s*\} else \{\s*syncDockControls\(\);/);
  assert.match(js, /selectionText\.textContent = "your selection"[\s\S]*selectionText\.textContent = "Your selection"/);
  assert.match(js, /new ResizeObserver\(syncDockControls\)\.observe\(cartToggle\)/);
  assert.match(js, /new ResizeObserver\(syncDockControls\)\.observe\(dockAdd\)/);
  assert.match(js, /if \(!hasCurrentSelection && selectionWidthAnimation\) \{\s*selectionWidthAnimation\.cancel\(\);\s*selectionWidthAnimation = undefined;/);
  assert.match(js, /\["is-adding", "is-preparing-add", "is-confirming-add", "is-cart-open"\]/);
  assert.match(js, /cartToggle\.animate\([\s\S]*duration:\s*420[\s\S]*cubic-bezier\(0\.53, 0, 0\.12, 0\.99\)/);
});

test("the pill morphs smoothly into the cart", () => {
  assert.match(html, /class="dock-morph">[\s\S]*<aside id="cart"/);
  assert.match(css, /width 520ms cubic-bezier\(0\.53, 0, 0\.12, 0\.99\)/);
  assert.match(css, /height:\s*var\(--cart-height, 220px\)/);
  assert.match(css, /\.shop-dock\.is-cart-open \.dock-morph\s*{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;/);
  assert.match(css, /\.shop-dock\.is-cart-open \.dock-morph\s*{[\s\S]*opacity:\s*1;/);
  assert.match(css, /\.dock-morph\s*{[\s\S]*border-radius:\s*var\(--morph-radius, 19px\)/);
  assert.match(css, /\.dock-morph\s*{[\s\S]*overflow:\s*hidden;/);
  assert.match(css, /\.shop-dock\.is-cart-open \.cart\s*{[\s\S]*opacity:\s*1;/);
  assert.match(js, /function sizeCart\(\)/);
  assert.match(js, /function syncMorphOrigin\(\)/);
  assert.match(js, /"--morph-radius", `\$\{rect\.height \/ 2\}px`/);
  assert.match(css, /transition-delay:\s*520ms, 0ms, 0ms/);
  assert.match(css, /\.shop-dock\.is-cart-closing \.cart\s*{[\s\S]*opacity:\s*0;[\s\S]*transition-delay:\s*0ms, 0ms, 220ms;/);
  assert.match(css, /\.shop-dock\.is-cart-closing \.dock-summary\s*{[\s\S]*opacity:\s*1;[\s\S]*transform:\s*scale\(1\);/);
});

test("the info control morphs into verified product drawings", () => {
  assert.match(html, /class="info-toggle"[\s\S]*aria-controls="product-info"/);
  assert.match(html, /id="product-info"[\s\S]*class="technical-image"/);
  assert.match(html, /class="info-claim"[\s\S]*class="info-edition"/);
  assert.match(css, /\.info-toggle\s*{[\s\S]*border:\s*1px solid #fff;[\s\S]*border-radius:\s*50%;/);
  assert.match(css, /\.shop-dock\.is-info-open \.dock-morph\s*{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;/);
  assert.match(css, /\.shop-dock\.is-info-open\s*{[\s\S]*width:\s*min\(calc\(100vw - 44px\), 480px\);[\s\S]*height:\s*min\(calc\(100dvh - 44px\), 350px\);/);
  assert.match(css, /\.product-info\s*{[\s\S]*grid-template-areas:\s*"copy drawing"\s*"claim claim";/);
  assert.match(css, /\.info-description\s*{[\s\S]*align-self:\s*end;[\s\S]*max-width:\s*17ch;/);
  assert.match(css, /\.info-claim\s*{[\s\S]*height:\s*42px;[\s\S]*grid-area:\s*claim;/);
  assert.match(css, /\.shop-dock\.is-cart-open\s*{[\s\S]*width:\s*min\(calc\(100vw - 44px\), 570px\);/);
  assert.doesNotMatch(html, /dimension-height|dimension-width/);
  assert.doesNotMatch(css, /\.dimension-height|\.dimension-width/);
  assert.doesNotMatch(html, /technical-caption/);
  assert.doesNotMatch(js, /Isometric line drawing · source STEP/);
  assert.match(metadata, /"round-vase":\s*{[\s\S]*profile:\s*"4 × 90° quarter extrusions · Ø80 mm assembled"/);
  assert.match(metadata, /"thorn-vase":\s*{[\s\S]*height:\s*"200 mm"/);
  assert.match(js, /const technical = activeProduct\?\.technical/);
  assert.match(js, /infoClaim\.addEventListener\("click", \(\) => closeInfo\(\(\) => dockAdd\.click\(\)\)\)/);
  assert.match(js, /setMorphOrigin\(infoToggle\.getBoundingClientRect\(\)\)/);
  assert.match(css, /\.shop-dock\.is-info-closing \.dock-summary\s*{[\s\S]*opacity:\s*1;[\s\S]*transform:\s*scale\(1\);/);
  for (const type of ["120", "660", "490", "28"]) {
    assert.equal(fs.existsSync(path.join(root, `website/assets/shop/technical/type-${type}.png`)), true);
  }
});

test("checkout has balanced inset spacing and rounded corners", () => {
  assert.match(css, /--cart-padding:\s*10px;/);
  assert.match(css, /--checkout-radius:\s*3px;/);
  assert.match(css, /\.cart\s*{[\s\S]*top:\s*var\(--cart-padding\);[\s\S]*bottom:\s*auto;[\s\S]*grid-template-rows:\s*minmax\(0, 1fr\) auto auto;/);
  assert.match(css, /\.cart\s*{[\s\S]*padding:\s*20px;/);
  assert.match(css, /\.checkout\s*{[\s\S]*align-self:\s*end;[\s\S]*border-radius:\s*var\(--checkout-radius\);/);
  assert.match(css, /border-radius:\s*calc\(var\(--checkout-radius\) \+ var\(--cart-padding\)\)/);
  assert.match(css, /\.checkout\s*{[\s\S]*height:\s*48px;[\s\S]*font-size:\s*15px;/);
  assert.match(js, /const verticalPadding = parseFloat\(style\.paddingTop\) \+ parseFloat\(style\.paddingBottom\)/);
  assert.match(js, /itemsHeight \+ checkoutButton\.offsetHeight \+ errorHeight[\s\S]*cartPanel\.offsetTop \* 2 \+ verticalPadding \+ 4/);
  assert.match(js, /new ResizeObserver\(\(\) => \{\s*if \(shopDock\.classList\.contains\("is-cart-open"\)\) sizeCart\(\);\s*\}\)\.observe\(cartItems\)/);
});

test("cart rows align to checkout and vertically center prices", () => {
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
  assert.match(js, /if \(!Object\.keys\(cart\)\.length && shopDock\.classList\.contains\("is-cart-open"\)\) \{[\s\S]*closeCart\(renderCart\);[\s\S]*return;/);
  assert.match(js, /function closeCart\(onClosed\)[\s\S]*classList\.add\("is-cart-closing"\);\s*shopDock\.classList\.remove\("is-cart-open"\)/);
  assert.match(js, /closeTimer = setTimeout\(\(\) => \{[\s\S]*cartBackdrop\.hidden = true;[\s\S]*\}, 520\)/);
  assert.match(css, /\.shop-dock\.is-cart-closing \.dock-morph\s*{\s*opacity:\s*1;/);
});

test("clicking outside uses the animated cart close", () => {
  assert.match(js, /cartBackdrop\.addEventListener\("click", \(\) => closeCart\(\)\)/);
});

test("the shop displays the lowest available product serial number", () => {
  assert.match(js, /const serialNumber = activeProduct\.serialNumbers\?\.\[selected\]/);
  assert.match(js, /`N° \$\{serialNumber\} of \$\{activeProduct\.editionSize\}`/);
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

test("modal buttons darken subtly on hover", () => {
  assert.match(css, /@media \(hover: hover\)[\s\S]*\.dock-add:hover\s*{\s*background-color:\s*rgba\(0, 0, 0, 0\.1\)/);
  assert.match(css, /\.cart-toggle:hover,[\s\S]*\.checkout:hover\s*{\s*filter:\s*brightness\(0\.9\)/);
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
  assert.match(js, /containsCenter \? viewportHeight : 0\) \+ visible/);
  assert.match(js, /function syncGalleryHeight/);
  assert.match(js, /gallery\.style\.height = `\$\{height\}px`/);
  assert.match(js, /width \* intrinsicHeight \/ intrinsicWidth/);
  assert.match(js, /syncGalleryHeight\(nextIndex\)/);
});

test("the intro reuses the landing-page explore callout", () => {
  assert.match(html, /class="explore" href="#products">Explore more below<\/a>/);
  assert.match(css, /\.explore\s*{[\s\S]*position:\s*fixed;[\s\S]*bottom:\s*clamp\(32px, 4svh, 42px\)/);
  assert.match(js, /const progress = Math\.max\(0, Math\.min\(1, window\.scrollY \/ introHandoffDistance\)\)/);
  assert.match(js, /explore\.style\.opacity = 1 - progress/);
  assert.doesNotMatch(js, /--first-gallery-controls-opacity/);
});

test("explore callouts share a subtle motion-safe shimmer", () => {
  for (const stylesheet of [landingCss, css]) {
    assert.match(stylesheet, /\.explore\s*{[\s\S]*linear-gradient\(110deg,[\s\S]*animation:\s*explore-shimmer 5s ease-in-out infinite;/);
    assert.match(stylesheet, /@keyframes explore-shimmer\s*{[\s\S]*background-position:\s*-100% 50%;/);
    assert.match(stylesheet, /@media \(prefers-reduced-motion:\s*reduce\)\s*{[\s\S]*\.explore\s*{\s*animation:\s*none;/);
  }
});

test("the desktop collection heading uses the requested light weight", () => {
  assert.match(css, /@media \(min-width: 801px\)\s*{[\s\S]*\.shop-intro h1\s*{\s*font-weight:\s*200;/);
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
