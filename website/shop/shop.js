const productGrid = document.querySelector(".product-grid");
const cartPanel = document.querySelector(".cart");
const infoPanel = document.querySelector(".product-info");
const infoMedia = document.querySelector(".product-info-media");
const cartBackdrop = document.querySelector(".cart-backdrop");
const cartItems = document.querySelector(".cart-items");
const cartCount = document.querySelector(".cart-count");
const cartError = document.querySelector(".cart-error");
const checkoutButton = document.querySelector(".checkout");
const modeNote = document.querySelector(".mode-note");
const infoTitle = document.querySelector(".info-title");
const infoDescription = document.querySelector(".info-description");
const infoPrice = document.querySelector(".info-price");
const infoEdition = document.querySelector(".info-edition");
const infoClaim = document.querySelector(".info-claim");
const infoClaimEdition = document.querySelector(".info-claim-edition");
const technicalImage = document.querySelector(".technical-image");
const cartToggle = document.querySelector(".cart-toggle");
const explore = document.querySelector(".explore");
const shopHeader = document.querySelector(".shop-header");
const shopLogo = document.querySelector(".shop-logo");
const collectionAdd = document.querySelector(".collection-add");
const collectionChoose = document.querySelector(".collection-choose");
const signupForm = document.querySelector(".signup");
const signupNote = document.querySelector(".signup-note");
const pageLoadStartedAt = Date.now();
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const supportsWebp = document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
const loaderSpinDuration = 4800;
const introHandoffDistance = 120;
const shouldRunPageLoader = document.documentElement.classList.contains("is-loading");
const reservationVisitorKey = "industrial-bloom-cart-visitor";
const reservationStorageKey = "industrial-bloom-cart-reservations";
const cartStorageKey = "industrial-bloom-cart";
const { readJson, writeJson } = window.ShopStorage;
const visitorId = localStorage.getItem(reservationVisitorKey)
  || (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
localStorage.setItem(reservationVisitorKey, visitorId);

let products = [];
let checkoutMode = "unavailable";
let cart = readJson(localStorage, cartStorageKey, {});
let reservations = readJson(localStorage, reservationStorageKey, {});
let activeProduct;
let addLock = false;
let closeTimer;
let loaderQueued = false;
let loaderSpinAnimation;
let loaderSettleAnimation;
let logoRotation = shouldRunPageLoader ? 0 : 90;
let reservationInterval;
let activeDialog;
let dialogReturnFocus;
let galleryNudgeTimer;
const nudgedProducts = new Set();
const galleryNudges = new WeakMap();
const galleryHeightSyncs = new WeakMap();
let progressiveImages = [];
let progressiveImageObserver;
const progressiveGalleryLadders = [
  {
    test: /\/assets\/responsive\/render-6(?:-|\.|$)/,
    src: "/assets/responsive/render-6-640.png",
    width: 3088,
    height: 4962,
    webpSrcset: "/assets/responsive/render-6-640.webp 398w, /assets/responsive/render-6-1280.webp 796w, /assets/responsive/render-6-1920.webp 1195w, /assets/responsive/render-6-full.webp 3088w",
    srcset: "/assets/responsive/render-6-640.png 398w, /assets/responsive/render-6-1280.png 796w, /assets/responsive/render-6-1920.png 1195w",
  },
  {
    test: /\/assets\/responsive\/render-3(?:-|\.|$)/,
    src: "/assets/responsive/render-3-900.png",
    width: 2334,
    height: 3486,
    webpSrcset: "/assets/responsive/render-3-900.webp 603w, /assets/responsive/render-3-1600.webp 1071w, /assets/responsive/render-3-full.webp 2334w",
    srcset: "/assets/responsive/render-3-900.png 603w, /assets/responsive/render-3-1600.png 1071w",
  },
  {
    test: /\/assets\/responsive\/round-vase(?:-|\.|$)/,
    src: "/assets/responsive/round-vase-900.png",
    width: 1517,
    height: 1799,
    webpSrcset: "/assets/responsive/round-vase-900.webp 759w, /assets/responsive/round-vase-1600.webp 1349w, /assets/responsive/round-vase-full.webp 1517w",
    srcset: "/assets/responsive/round-vase-900.png 759w, /assets/responsive/round-vase-1600.png 1349w",
  },
];
const galleryImageSizes = {
  "/assets/shop/660-vase-01.jpg": [1074, 1920],
  "/assets/shop/120-vase-01.jpg": [1607, 2400],
  "/assets/shop/120-vase-02.jpg": [2242, 2400],
  "/assets/shop/490-vase-01.jpg": [1080, 1920],
  "/assets/shop/490-vase-02.jpg": [1080, 1920],
};

function shopAssetUrl(source) {
  const url = String(source || "");
  if (!url) return "";
  return url.startsWith("/") ? `..${url}` : url;
}

function toShopSrcset(srcset) {
  return srcset.split(",").map((entry) => {
    const [src, width] = entry.trim().split(/\s+/);
    return `${shopAssetUrl(src)} ${width}`;
  }).join(", ");
}

function galleryImageHeight(image, displayWidth) {
  const width = displayWidth || image.getBoundingClientRect().width;
  const intrinsicWidth = image.naturalWidth || Number(image.getAttribute("width")) || 0;
  const intrinsicHeight = image.naturalHeight || Number(image.getAttribute("height")) || 0;
  if (width && intrinsicWidth && intrinsicHeight) {
    return Math.round(width * intrinsicHeight / intrinsicWidth);
  }
  return image.offsetHeight || 0;
}

function syncAllGalleryHeights() {
  document.querySelectorAll(".product-gallery").forEach((gallery) => {
    galleryHeightSyncs.get(gallery)?.();
  });
}

function applyGallerySource(image, source) {
  const path = String(source || "").split("?")[0];
  const ladder = progressiveGalleryLadders.find((item) => item.test.test(path));
  if (ladder) {
    image.src = shopAssetUrl(ladder.src);
    image.dataset.webpSrcset = toShopSrcset(ladder.webpSrcset);
    image.dataset.srcset = toShopSrcset(ladder.srcset);
    image.width = ladder.width;
    image.height = ladder.height;
    return;
  }

  image.src = shopAssetUrl(source);
  const size = galleryImageSizes[path];
  if (size) {
    image.width = size[0];
    image.height = size[1];
  }
}

function upgradeImage(image) {
  const srcset = supportsWebp ? image.dataset.webpSrcset : image.dataset.srcset;
  if (!srcset) return;

  const candidates = srcset.split(",").map((entry) => {
    const [src, width] = entry.trim().split(/\s+/);
    return { src, width: Number(width.replace("w", "")) };
  });
  const neededWidth = Math.ceil(image.getBoundingClientRect().width * window.devicePixelRatio);
  const target = candidates.find((candidate) => candidate.width >= neededWidth) || candidates.at(-1);

  if (image.dataset.loadedSrc === target.src) return;

  image.closest(".gallery-slide")?.classList.add("is-loading");
  image.dataset.loadedSrc = target.src;
  image.dataset.upgraded = "true";
  image.src = target.src;
}

function observeProgressiveImages() {
  progressiveImages = [...document.querySelectorAll(".gallery-slide img[data-srcset], .gallery-slide img[data-webp-srcset], .collection-frame img[data-srcset], .collection-frame img[data-webp-srcset]")];

  if ("IntersectionObserver" in window) {
    progressiveImageObserver?.disconnect();
    progressiveImageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        upgradeImage(entry.target);
        progressiveImageObserver.unobserve(entry.target);
      });
    }, { rootMargin: "800px 0px" });
    progressiveImages.forEach((image) => progressiveImageObserver.observe(image));
  } else {
    progressiveImages.forEach(upgradeImage);
  }
}

function finishPageLoader() {
  if (!shouldRunPageLoader || loaderQueued) return;
  loaderQueued = true;

  const minimumTime = prefersReducedMotion ? 0 : 650;
  const revealDuration = prefersReducedMotion ? 0 : 900;
  const fontsReady = document.fonts?.ready || Promise.resolve();
  const windowReady = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));

  Promise.all([fontsReady, windowReady]).then(() => {
    const delay = Math.max(0, minimumTime - (Date.now() - pageLoadStartedAt));
    setTimeout(() => {
      settleLoaderLogo(revealDuration);
      document.documentElement.classList.add("is-revealing");
      setTimeout(() => {
        loaderSettleAnimation?.cancel();
        logoRotation = 90;
        renderLogo();
        document.documentElement.classList.remove("is-loading", "is-revealing");
      }, revealDuration);
    }, delay);
  });
}

if (shouldRunPageLoader) setTimeout(finishPageLoader, 4000);

function renderLogo() {
  shopLogo.style.transform = `rotate(${logoRotation}deg)`;
}

function startLoaderLogo() {
  if (!shouldRunPageLoader || prefersReducedMotion || !shopLogo.animate) {
    logoRotation = 90;
    renderLogo();
    return;
  }

  loaderSpinAnimation = shopLogo.animate(
    [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
    { duration: loaderSpinDuration, iterations: Infinity },
  );
}

function settleLoaderLogo(duration) {
  if (!loaderSpinAnimation) return;

  const elapsed = Number(loaderSpinAnimation.currentTime) || 0;
  const currentAngle = (elapsed % loaderSpinDuration) / loaderSpinDuration * 360;
  const targetAngle = currentAngle <= 90 ? 90 : 450;

  loaderSpinAnimation.cancel();
  loaderSettleAnimation = shopLogo.animate(
    [
      { transform: `rotate(${currentAngle}deg)` },
      { transform: `rotate(${targetAngle}deg)` },
    ],
    {
      duration,
      easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      fill: "forwards",
    },
  );
}

startLoaderLogo();

shopLogo.addEventListener("mouseenter", () => {
  if (!shopLogo.animate || prefersReducedMotion) return;
  shopLogo.animate(
    [
      { transform: `rotate(${logoRotation}deg)` },
      { transform: `rotate(${logoRotation + 90}deg)` },
    ],
    { duration: 650, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "forwards" },
  );
  logoRotation += 90;
});

function updateIntroHandoff() {
  if (!explore) return;
  const progress = Math.max(0, Math.min(1, window.scrollY / introHandoffDistance));
  explore.style.opacity = 1 - progress;
  explore.style.pointerEvents = progress < 0.85 ? "auto" : "none";
}

updateIntroHandoff();

window.addEventListener("scroll", () => {
  shopHeader.classList.toggle("is-at-top", window.scrollY <= 0);
  updateIntroHandoff();
}, { passive: true });

function money(cents, currency = "eur") {
  return new Intl.NumberFormat("en-DE", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function shortMoney(cents, suffix = "€") {
  return `${new Intl.NumberFormat("en-DE", { maximumFractionDigits: 2 }).format(cents / 100)}${suffix}`;
}

function saveCart() {
  writeJson(localStorage, cartStorageKey, cart);
  writeJson(localStorage, reservationStorageKey, reservations);
}

function productById(id) {
  return products.find((product) => product.id === id);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function displayName(product) {
  return String(product?.name || "").replace(/^type\s+/i, "").replace(/ vase$/i, "").trim();
}

const editionOrder = ["660", "120", "490", "28"];

function typeCode(product) {
  return String(product?.technical?.type || displayName(product)).trim();
}

function sortCatalog(list) {
  return [...list].sort((left, right) => {
    const leftIndex = editionOrder.indexOf(typeCode(left));
    const rightIndex = editionOrder.indexOf(typeCode(right));
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
}

function nextSerial(product) {
  const selected = cart[product.id] || 0;
  return product.serialNumbers?.[selected];
}

function editionLabel(product) {
  const serialNumber = nextSerial(product);
  return serialNumber === undefined
    ? "Sold out"
    : `N° ${serialNumber} of ${product.editionSize}`;
}

function setActiveProduct(product) {
  if (!product) return;
  activeProduct = product;
  renderProductInfo();
}

function markGalleryInteracted(productId) {
  nudgedProducts.add(productId);
  clearTimeout(galleryNudgeTimer);
  galleryNudgeTimer = undefined;
}

function scheduleGalleryNudge(product) {
  if (prefersReducedMotion || !product || nudgedProducts.has(product.id) || galleryNudgeTimer) return;
  galleryNudgeTimer = setTimeout(() => {
    galleryNudgeTimer = undefined;
    if (document.visibilityState !== "visible") return;
    if (cartPanel.classList.contains("is-open") || infoPanel.classList.contains("is-open")) return;

    const card = [...document.querySelectorAll(".product-card")]
      .find((item) => item.dataset.productId === product.id);
    const rect = card?.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const visible = rect ? Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0) : 0;
    if (!rect || visible < Math.min(120, viewportHeight * 0.2)) return;

    const gallery = card.querySelector(".product-gallery");
    if (galleryNudges.get(gallery)?.()) nudgedProducts.add(product.id);
  }, 2400);
}

function renderProductInfo() {
  const technical = activeProduct?.technical;
  if (!activeProduct || !technical) return;
  const serialNumber = nextSerial(activeProduct);
  infoTitle.textContent = displayName(activeProduct);
  infoDescription.textContent = activeProduct.description;
  infoPrice.textContent = money(activeProduct.priceCents, activeProduct.currency);
  infoEdition.textContent = editionLabel(activeProduct);
  infoClaimEdition.textContent = editionLabel(activeProduct);
  infoClaim.disabled = serialNumber === undefined;
  technicalImage.src = `..${technical.imageUrl}`;
  technicalImage.alt = `${activeProduct.name} isometric technical line drawing`;
}

function createGallery(product) {
  const gallery = element("div", "product-gallery");
  const track = element("div", "gallery-track");
  const images = product.galleryImages?.length
    ? product.galleryImages
    : [product.imageUrl].filter(Boolean);
  let currentIndex = 0;

  function syncGalleryHeight(index = currentIndex) {
    const image = track.children[index]?.querySelector("img");
    if (!image) return;
    const height = galleryImageHeight(image, gallery.clientWidth);
    if (height > 0) gallery.style.height = `${height}px`;
  }

  images.forEach((source, index) => {
    const slide = element("figure", "gallery-slide is-loading");
    slide.setAttribute("aria-hidden", String(index !== 0));
    const image = document.createElement("img");
    applyGallerySource(image, source);
    image.alt = index ? `${product.name}, alternate view` : product.name;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("load", () => {
      slide.classList.remove("is-loading");
      if (index === currentIndex) syncGalleryHeight(index);
    });
    if (image.complete) slide.classList.remove("is-loading");
    slide.append(image);
    track.append(slide);
  });

  gallery.append(track);
  galleryHeightSyncs.set(gallery, syncGalleryHeight);

  if (images.length === 1) {
    return gallery;
  }

  const indexLabel = element("p", "gallery-index", `1/${images.length}`);
  gallery.append(indexLabel);

  gallery.tabIndex = 0;
  gallery.setAttribute("role", "region");
  gallery.setAttribute("aria-roledescription", "carousel");
  gallery.setAttribute("aria-label", `${product.name} image gallery`);

  let swipe;

  function updateGallery(index) {
    currentIndex = index;
    [...track.children].forEach((slide, slideIndex) => {
      slide.setAttribute("aria-hidden", String(slideIndex !== index));
    });
    const indexLabel = gallery.querySelector(".gallery-index");
    if (indexLabel) indexLabel.textContent = `${index + 1}/${images.length}`;
  }

  function showSlide(index) {
    const nextIndex = Math.max(0, Math.min(images.length - 1, index));
    track.style.transition = "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";
    track.style.transform = `translate3d(${-nextIndex * 100}%, 0, 0)`;
    updateGallery(nextIndex);
    syncGalleryHeight(nextIndex);
  }

  galleryNudges.set(gallery, () => {
    if (currentIndex !== 0 || !track.animate) return false;
    const distance = Math.min(32, Math.max(24, track.clientWidth * 0.03));
    const easing = "cubic-bezier(0.45, 0, 0.55, 1)";
    track.animate(
      [
        { transform: "translate3d(0, 0, 0)", easing },
        { transform: `translate3d(-${distance}px, 0, 0)`, offset: 0.5, easing },
        { transform: "translate3d(0, 0, 0)" },
      ],
      { duration: 1800 },
    );
    return true;
  });

  gallery.addEventListener("pointerdown", (event) => {
    markGalleryInteracted(product.id);
    track.style.transition = "none";
    gallery.classList.add("is-dragging");
    swipe = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      index: currentIndex,
      startedAt: performance.now(),
      horizontal: false,
    };
  });
  gallery.addEventListener("pointermove", (event) => {
    if (event.pointerId !== swipe?.id) return;
    const x = swipe.x - event.clientX;
    const y = swipe.y - event.clientY;
    if (!swipe.horizontal && Math.abs(x) > 6 && Math.abs(x) > Math.abs(y)) {
      swipe.horizontal = true;
      gallery.setPointerCapture(event.pointerId);
    }
    if (!swipe.horizontal) return;
    event.preventDefault();
    const offset = -swipe.index * track.clientWidth - x;
    const minimum = -(images.length - 1) * track.clientWidth;
    track.style.transform = `translate3d(${Math.max(minimum, Math.min(0, offset))}px, 0, 0)`;
  }, { passive: false });

  function finishSwipe(event, cancelled = false) {
    if (event.pointerId !== swipe?.id) return;
    gallery.classList.remove("is-dragging");
    if (swipe.horizontal) {
      const distance = swipe.x - event.clientX;
      const velocity = distance / Math.max(1, performance.now() - swipe.startedAt);
      const directional = !cancelled && (Math.abs(distance) > track.clientWidth * 0.12 || Math.abs(velocity) > 0.35);
      const index = directional
        ? swipe.index + Math.sign(distance)
        : swipe.index;
      showSlide(index);
    } else {
      showSlide(swipe.index);
    }
    swipe = undefined;
  }

  gallery.addEventListener("pointerup", finishSwipe);
  gallery.addEventListener("pointercancel", (event) => finishSwipe(event, true));
  gallery.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    markGalleryInteracted(product.id);
    showSlide(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
  });

  updateGallery(0);
  return gallery;
}

function renderEditionStates() {
  for (const card of document.querySelectorAll(".product-card")) {
    const product = productById(card.dataset.productId);
    if (!product) continue;
    const serialNumber = nextSerial(product);
    const add = card.querySelector(".card-add");
    const edition = card.querySelector(".product-edition");
    if (edition) edition.textContent = editionLabel(product);
    if (add) add.disabled = serialNumber === undefined;
  }
  if (collectionAdd) {
    collectionAdd.disabled = !products.some((product) => nextSerial(product) !== undefined);
  }
  if (activeProduct) renderProductInfo();
}

function renderCollectionMoment() {
  const media = document.querySelector(".collection-media");
  const types = document.querySelector(".collection-types");
  const seriesPrice = document.querySelector(".collection-price");
  if (!media || !types) return;

  media.replaceChildren();
  types.replaceChildren();
  let total = 0;
  let currency = products[0]?.currency || "eur";

  products.forEach((product) => {
    const source = product.galleryImages?.[0] || product.imageUrl;
    if (source) {
      const frame = element("figure", "collection-frame");
      const image = document.createElement("img");
      applyGallerySource(image, source);
      image.alt = displayName(product);
      image.loading = "lazy";
      image.decoding = "async";
      frame.append(image);
      media.append(frame);
    }

    const row = element("li", "collection-type");
    row.append(element("span", "collection-type-name", typeCode(product)));
    row.append(element("span", "collection-type-price", money(product.priceCents, product.currency)));
    types.append(row);

    if (nextSerial(product) !== undefined) {
      total += product.priceCents;
      currency = product.currency;
    }
  });

  media.hidden = media.childElementCount === 0;
  types.hidden = types.childElementCount === 0;
  if (seriesPrice) {
    seriesPrice.hidden = total <= 0;
    seriesPrice.textContent = total ? money(total, currency) : "";
  }
}

function renderProducts() {
  products = sortCatalog(products);
  productGrid.replaceChildren();
  productGrid.setAttribute("aria-busy", "false");
  products.forEach((product, index) => {
    const card = element("article", index === 0 ? "product-card is-featured" : "product-card");
    card.dataset.productId = product.id;
    const meta = element("div", "product-meta");
    meta.append(element("p", "product-kicker", "Type"));
    meta.append(element("h2", "product-name", displayName(product)));
    meta.append(element("p", "product-edition", editionLabel(product)));
    const footer = element("div", "product-footer");
    footer.append(element("p", "product-price", money(product.priceCents, product.currency)));
    const actions = element("div", "product-actions");
    const add = element("button", "card-add", "Add");
    add.type = "button";
    add.disabled = nextSerial(product) === undefined;
    add.addEventListener("click", () => addProduct(product));
    const choose = element("button", "card-choose", "Choose");
    choose.type = "button";
    choose.addEventListener("click", () => openInfo(product));
    actions.append(add, choose);
    footer.append(actions);
    meta.append(footer);
    card.append(createGallery(product), meta);
    productGrid.append(card);
  });

  renderCollectionMoment();
  setActiveProduct(products[0]);
  observeProgressiveImages();
  requestAnimationFrame(syncAllGalleryHeights);
  products.forEach((product) => scheduleGalleryNudge(product));
}

function renderCart() {
  cartItems.replaceChildren();
  let count = 0;
  let total = 0;

  for (const [productId, quantity] of Object.entries(cart)) {
    const product = productById(productId);
    if (!product || quantity < 1) {
      delete cart[productId];
      continue;
    }

    count += quantity;
    total += product.priceCents * quantity;
    const item = element("article", "cart-item");
    const details = element("div", "cart-item-details");
    details.append(element("h3", "", displayName(product)));
    const reservation = reservations[productId];
    const serialNumbers = reservation?.serialNumbers || [];
    details.append(element("span", "quantity", serialNumbers
      .map((serial) => `N° ${serial}`)
      .join(" · ")));
    const price = element("p", "cart-item-price", shortMoney(product.priceCents * quantity, " €"));
    const remove = element("button", "remove", "Remove");
    remove.type = "button";
    remove.dataset.action = "remove";
    remove.dataset.productId = product.id;
    const actions = element("div", "cart-item-actions");
    const separator = element("span", "action-separator", "|");
    const timer = element("button", "reservation-timer");
    timer.type = "button";
    timer.tabIndex = -1;
    timer.dataset.productId = product.id;
    timer.dataset.expiresAt = reservation?.expiresAt || "";
    actions.append(timer, separator, remove);
    item.append(details, price, actions);
    cartItems.append(item);
  }

  if (!count) cartItems.append(element("p", "empty-cart", "Your cart is empty."));
  cartCount.textContent = count;
  checkoutButton.dataset.total = money(total);
  checkoutButton.disabled = count === 0
    || checkoutMode === "unavailable"
    || Object.keys(cart).some((productId) => reservationExpired(productId));
  saveCart();
  renderEditionStates();
  updateReservationTimers();
}

function cartItemsPayload(value = cart) {
  return Object.entries(value).map(([productId, quantity]) => ({ productId, quantity }));
}

function reservationExpired(productId, now = Date.now()) {
  const expiresAt = reservations[productId]?.expiresAt;
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= now);
}

function reservableCart(nextCart, forcedProductId) {
  return Object.fromEntries(
    Object.entries(nextCart).filter(([productId]) => (
      productId === forcedProductId
      || !reservations[productId]
      || !reservationExpired(productId)
    )),
  );
}

async function syncCartReservations(nextCart, forcedProductId) {
  const requestedCart = reservableCart(nextCart, forcedProductId);
  const response = await fetch("/api/shop/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, items: cartItemsPayload(requestedCart) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The cart could not be reserved.");
  const syncedReservations = Object.fromEntries(
    result.reservations.map((reservation) => [reservation.productId, reservation]),
  );
  return Object.fromEntries(
    Object.keys(nextCart).flatMap((productId) => {
      const reservation = syncedReservations[productId] || reservations[productId];
      return reservation ? [[productId, reservation]] : [];
    }),
  );
}

function formatReservationTime(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

async function reserveAgain(productId, button) {
  button.disabled = true;
  button.textContent = "Reserving…";
  cartError.textContent = "";
  try {
    reservations = await syncCartReservations(cart, productId);
    renderCart();
  } catch (error) {
    cartError.textContent = error.message;
    button.disabled = false;
    button.textContent = "Reserve again";
  }
}

function updateReservationTimers() {
  const now = Date.now();
  let hasExpiredReservation = false;
  for (const timer of document.querySelectorAll(".reservation-timer")) {
    const remaining = new Date(timer.dataset.expiresAt).getTime() - now;
    const expired = timer.dataset.expiresAt && remaining <= 0;
    timer.closest(".cart-item").classList.toggle("is-expired", Boolean(expired));
    timer.textContent = expired
      ? "Reserve again"
      : timer.dataset.expiresAt
        ? `Reserved for ${formatReservationTime(remaining)} min`
        : "Reserving…";
    if (expired) {
      timer.dataset.action = "reserve-again";
      timer.tabIndex = 0;
    } else {
      delete timer.dataset.action;
      timer.tabIndex = -1;
    }
    hasExpiredReservation ||= Boolean(expired);
  }
  if (hasExpiredReservation) checkoutButton.disabled = true;
}

function activateDialog(panel, trigger) {
  activeDialog = panel;
  dialogReturnFocus = trigger;
  requestAnimationFrame(() => panel.focus({ preventScroll: true }));
}

function deactivateDialog(panel) {
  if (activeDialog !== panel) return undefined;
  activeDialog = undefined;
  const target = dialogReturnFocus;
  dialogReturnFocus = undefined;
  return target;
}

function restoreDialogFocus(target) {
  requestAnimationFrame(() => {
    const next = target?.isConnected && !target.disabled && target.getClientRects().length
      ? target
      : cartToggle;
    next?.focus({ preventScroll: true });
  });
}

function handleDialogKeydown(event) {
  if (event.key === "Escape") {
    closeOpenPanel();
    return;
  }
  if (event.key !== "Tab" || !activeDialog) return;
  const focusable = [...activeDialog.querySelectorAll(
    'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )].filter((node) => node.getClientRects().length);
  if (!focusable.length) {
    event.preventDefault();
    activeDialog.focus({ preventScroll: true });
    return;
  }
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openCart() {
  clearTimeout(closeTimer);
  closeTimer = undefined;
  cartPanel.classList.add("is-open");
  cartPanel.classList.add("is-cart-open");
  cartBackdrop.hidden = false;
  cartPanel.setAttribute("aria-hidden", "false");
  cartToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("is-panel-open");
  activateDialog(cartPanel, cartToggle);
}

function openInfo(product) {
  setActiveProduct(product);
  infoMedia.replaceChildren(createGallery(product));
  observeProgressiveImages();
  requestAnimationFrame(syncAllGalleryHeights);
  clearTimeout(closeTimer);
  closeTimer = undefined;
  infoPanel.classList.add("is-open");
  infoPanel.classList.add("is-info-open");
  cartBackdrop.hidden = false;
  infoPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-panel-open");
  activateDialog(infoPanel, document.activeElement);
}

function closeCart(onClosed) {
  if (!cartPanel.classList.contains("is-open")) return;
  const focusTarget = deactivateDialog(cartPanel);
  clearTimeout(closeTimer);
  cartPanel.classList.add("is-cart-closing");
  cartPanel.classList.remove("is-open", "is-cart-open");
  cartPanel.setAttribute("aria-hidden", "true");
  cartToggle.setAttribute("aria-expanded", "false");
  if (!infoPanel.classList.contains("is-open")) {
    cartBackdrop.hidden = true;
    document.body.classList.remove("is-panel-open");
  }
  closeTimer = setTimeout(() => {
    cartPanel.classList.remove("is-cart-closing");
    closeTimer = undefined;
    if (typeof onClosed === "function") onClosed();
    restoreDialogFocus(focusTarget);
  }, 420);
}

function closeInfo(onClosed) {
  if (!infoPanel.classList.contains("is-open")) return;
  const focusTarget = deactivateDialog(infoPanel);
  clearTimeout(closeTimer);
  infoPanel.classList.add("is-info-closing");
  infoPanel.classList.remove("is-open", "is-info-open");
  infoPanel.setAttribute("aria-hidden", "true");
  if (!cartPanel.classList.contains("is-open")) {
    cartBackdrop.hidden = true;
    document.body.classList.remove("is-panel-open");
  }
  closeTimer = setTimeout(() => {
    infoPanel.classList.remove("is-info-closing");
    closeTimer = undefined;
    if (typeof onClosed === "function") onClosed();
    restoreDialogFocus(focusTarget);
  }, 420);
}

function closeOpenPanel() {
  if (cartPanel.classList.contains("is-open")) closeCart();
  else if (infoPanel.classList.contains("is-open")) closeInfo();
}

async function changeQuantity(productId, change) {
  const product = productById(productId);
  const nextCart = { ...cart };
  const quantity = Math.max(0, Math.min(product?.inventory || 0, (nextCart[productId] || 0) + change));
  if (quantity) nextCart[productId] = quantity;
  else delete nextCart[productId];

  try {
    const nextReservations = await syncCartReservations(nextCart);
    cart = nextCart;
    reservations = nextReservations;
  } catch (error) {
    cartError.textContent = error.message;
    return;
  }

  if (!Object.keys(cart).length && cartPanel.classList.contains("is-open")) {
    saveCart();
    closeCart(renderCart);
    return;
  }

  renderCart();
}

async function addProduct(product) {
  if (!product || addLock || nextSerial(product) === undefined) return false;
  addLock = true;
  cartError.textContent = "";
  const nextCart = { ...cart, [product.id]: (cart[product.id] || 0) + 1 };
  try {
    const nextReservations = await syncCartReservations(nextCart);
    cart = nextCart;
    reservations = nextReservations;
    renderCart();
    return true;
  } catch (error) {
    cartError.textContent = error.message;
    openCart();
    return false;
  } finally {
    addLock = false;
  }
}

async function addSeries() {
  if (addLock) return;
  addLock = true;
  cartError.textContent = "";
  const nextCart = { ...cart };
  for (const product of products) {
    const selected = nextCart[product.id] || 0;
    if (product.serialNumbers?.[selected] !== undefined) {
      nextCart[product.id] = selected + 1;
    }
  }
  try {
    const nextReservations = await syncCartReservations(nextCart);
    cart = nextCart;
    reservations = nextReservations;
    renderCart();
    openCart();
  } catch (error) {
    cartError.textContent = error.message;
    openCart();
  } finally {
    addLock = false;
  }
}

async function startCheckout() {
  cartError.textContent = "";
  checkoutButton.disabled = true;
  checkoutButton.textContent = checkoutMode === "demo" ? "Placing order…" : "Opening checkout…";
  try {
    const response = await fetch("/api/shop/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        customerEmail: "",
        items: cartItemsPayload(),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Checkout could not be started.");
    window.location.assign(result.url);
  } catch (error) {
    cartError.textContent = error.message;
    try {
      reservations = await syncCartReservations(cart);
      renderCart();
    } catch {}
    checkoutButton.disabled = false;
    checkoutButton.textContent = "Check out";
  }
}

async function handleSignup(form) {
  const button = form.querySelector("button");
  const input = form.querySelector("input");
  const originalText = button.textContent;
  if (button.disabled) return;
  if (!input.validity.valid) {
    signupNote.textContent = "Enter a valid email.";
    input.focus();
    return;
  }
  button.disabled = true;
  button.textContent = "Sending";
  try {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: input.value }),
    });
    if (!response.ok) throw new Error("Could not subscribe. Try again.");
    signupNote.textContent = "We will be in touch.";
    form.classList.add("is-submitted");
  } catch (error) {
    button.disabled = false;
    button.textContent = originalText;
    signupNote.textContent = error.message;
    input.focus();
  }
}

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "reserve-again") {
    reserveAgain(button.dataset.productId, button);
  } else {
    changeQuantity(button.dataset.productId, -(cart[button.dataset.productId] || 0));
  }
});

window.addEventListener("resize", () => {
  progressiveImages.forEach((image) => {
    if (image.dataset.upgraded === "true") upgradeImage(image);
  });
  syncAllGalleryHeights();
});

cartToggle.addEventListener("click", openCart);
document.querySelector(".cart-close").addEventListener("click", () => closeCart());
document.querySelector(".info-close").addEventListener("click", () => closeInfo());
infoClaim.addEventListener("click", () => closeInfo(() => addProduct(activeProduct)));
cartBackdrop.addEventListener("click", () => closeOpenPanel());
checkoutButton.addEventListener("click", startCheckout);
collectionAdd.addEventListener("click", addSeries);
collectionChoose.addEventListener("click", () => {
  document.getElementById("editions")?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
});
signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleSignup(signupForm);
});
document.addEventListener("keydown", handleDialogKeydown);

reservationInterval = setInterval(updateReservationTimers, 1000);

fetch(`/api/shop/products?visitorId=${encodeURIComponent(visitorId)}`)
  .then(async (response) => {
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    products = result.products;
    checkoutMode = result.checkoutMode;
    if (checkoutMode === "demo") {
      modeNote.hidden = false;
      modeNote.textContent = "Staging · demo checkout";
    } else if (checkoutMode === "unavailable") {
      modeNote.hidden = false;
      modeNote.textContent = "Checkout setup in progress";
    }
    try {
      reservations = await syncCartReservations(cart);
    } catch (error) {
      cart = {};
      reservations = {};
      await syncCartReservations(cart).catch(() => {});
      cartError.textContent = error.message;
    }
    renderProducts();
    renderCart();
  })
  .catch(() => {
    productGrid.setAttribute("aria-busy", "false");
    productGrid.replaceChildren(element("p", "loading", "The collection could not be loaded."));
  })
  .finally(finishPageLoader);
