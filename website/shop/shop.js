const productGrid = document.querySelector(".product-grid");
const shopDock = document.querySelector(".shop-dock");
const cartPanel = document.querySelector(".cart");
const infoPanel = document.querySelector(".product-info");
const cartBackdrop = document.querySelector(".cart-backdrop");
const cartItems = document.querySelector(".cart-items");
const cartCount = document.querySelector(".cart-count");
const dockOutlineShape = document.querySelector(".dock-outline-shape");
const dockOutlineMask = document.querySelector("#dock-outline-mask");
const dockOutlineMaskBase = document.querySelector(".dock-outline-mask-base");
const dockOutlineMaskHole = document.querySelector(".dock-outline-mask-hole");
const dockFillShape = document.querySelector(".dock-fill-shape");
const selectionSurfaceShape = document.querySelector(".selection-surface-shape");
const selectionSurfaceMask = document.querySelector("#selection-surface-mask");
const selectionSurfaceMaskBase = document.querySelector(".selection-surface-mask-base");
const selectionSurfaceMaskHole = document.querySelector(".selection-surface-mask-hole");
const cartError = document.querySelector(".cart-error");
const checkoutButton = document.querySelector(".checkout");
const modeNote = document.querySelector(".mode-note");
const dockName = document.querySelector(".dock-product-name");
const dockDescription = document.querySelector(".dock-product-description");
const dockPrimary = document.querySelector(".dock-primary");
const dockAdd = document.querySelector(".dock-add");
const dockEdition = document.querySelector(".dock-edition");
const infoToggle = document.querySelector(".info-toggle");
const infoTitle = document.querySelector(".info-title");
const infoDescription = document.querySelector(".info-description");
const infoClaim = document.querySelector(".info-claim");
const infoEdition = document.querySelector(".info-edition");
const technicalImage = document.querySelector(".technical-image");
const cartToggle = document.querySelector(".cart-toggle");
const selectionLabel = document.querySelector(".selection-label");
const selectionPrefix = document.querySelector(".selection-prefix");
const selectionText = document.querySelector(".selection-text");
const explore = document.querySelector(".explore");
const shopHeader = document.querySelector(".shop-header");
const shopLogo = document.querySelector(".shop-logo");
const shopIntro = document.querySelector(".shop-intro");
const pageLoadStartedAt = Date.now();
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
let productFrame;
let addTimer;
let confirmationTimer;
let closeTimer;
let selectionWidthAnimation;
let loaderQueued = false;
let loaderSpinAnimation;
let loaderSettleAnimation;
let logoRotation = shouldRunPageLoader ? 0 : 90;
let logoTargetRotation = logoRotation;
let lastScrollY = window.scrollY;
let logoFrame;
let logoTimer;
let reservationInterval;
let activeDialog;
let dialogReturnFocus;
let galleryNudgeTimer;
const nudgedProducts = new Set();
const galleryNudges = new WeakMap();

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
        logoTargetRotation = 90;
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
    logoTargetRotation = 90;
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

function animateLogo() {
  logoRotation += (logoTargetRotation - logoRotation) * 0.22;

  if (Math.abs(logoTargetRotation - logoRotation) < 0.02) {
    logoRotation = logoTargetRotation;
    logoFrame = undefined;
  } else {
    logoFrame = requestAnimationFrame(animateLogo);
  }

  renderLogo();
}

function startLogoAnimation() {
  if (!logoFrame) logoFrame = requestAnimationFrame(animateLogo);
}

shopLogo.addEventListener("mouseenter", () => {
  logoTargetRotation += 90;
  startLogoAnimation();
});

function updateIntroHandoff() {
  const progress = Math.max(0, Math.min(1, window.scrollY / introHandoffDistance));
  explore.style.opacity = 1 - progress;
  explore.style.pointerEvents = progress < 0.85 ? "auto" : "none";
}

updateIntroHandoff();

window.addEventListener("scroll", () => {
  const delta = window.scrollY - lastScrollY;
  lastScrollY = window.scrollY;
  shopHeader.classList.toggle("is-at-top", window.scrollY <= 0);
  logoTargetRotation += delta * 0.18;
  updateIntroHandoff();
  startLogoAnimation();
  clearTimeout(logoTimer);
  logoTimer = setTimeout(() => {
    logoTargetRotation = Math.round(logoTargetRotation / 90) * 90;
    startLogoAnimation();
  }, 180);
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

function setActiveProduct(product) {
  if (!product) return;
  if (product.id === activeProduct?.id) {
    if (shopDock.hidden) renderDock();
    scheduleGalleryNudge(product);
    return;
  }
  clearTimeout(galleryNudgeTimer);
  galleryNudgeTimer = undefined;
  activeProduct = product;
  renderDock();
  scheduleGalleryNudge(product);
}

function markGalleryInteracted(productId) {
  nudgedProducts.add(productId);
  if (activeProduct?.id !== productId) return;
  clearTimeout(galleryNudgeTimer);
  galleryNudgeTimer = undefined;
}

function scheduleGalleryNudge(product) {
  if (prefersReducedMotion || !product || nudgedProducts.has(product.id) || galleryNudgeTimer) return;
  galleryNudgeTimer = setTimeout(() => {
    galleryNudgeTimer = undefined;
    if (document.visibilityState !== "visible" || activeProduct?.id !== product.id) return;
    if (shopDock.classList.contains("is-cart-open") || shopDock.classList.contains("is-info-open")) return;

    const card = [...document.querySelectorAll(".product-card")]
      .find((item) => item.dataset.productId === product.id);
    const rect = card?.getBoundingClientRect();
    const centerY = window.innerHeight / 2;
    if (!rect || rect.top > centerY || rect.bottom <= centerY) return;

    const gallery = card.querySelector(".product-gallery");
    if (galleryNudges.get(gallery)?.()) nudgedProducts.add(product.id);
  }, 2400);
}

function renderProductInfo() {
  const technical = activeProduct?.technical;
  if (!activeProduct || !technical) return;
  infoTitle.textContent = activeProduct.name;
  infoDescription.textContent = activeProduct.description;
  infoEdition.textContent = dockEdition.textContent;
  infoClaim.disabled = dockAdd.disabled;
  technicalImage.src = `..${technical.imageUrl}`;
  technicalImage.alt = `${activeProduct.name} isometric technical line drawing`;
}

function updateDockVisibility() {
  if (shopDock.hidden) return;
  const clearance = shopDock.getBoundingClientRect().top - shopIntro.getBoundingClientRect().bottom;
  const clearanceProgress = Math.max(0, Math.min(1, clearance / 48));
  const introProgress = Math.max(0, Math.min(1, window.scrollY / introHandoffDistance));
  const opacity = Math.min(clearanceProgress, introProgress);
  document.documentElement.style.setProperty("--dock-opacity", opacity.toFixed(3));
  shopDock.classList.toggle("is-dock-interactive", opacity >= 0.98);
}

function createGallery(product) {
  const gallery = element("div", "product-gallery");
  const track = element("div", "gallery-track");
  const images = product.galleryImages?.length
    ? product.galleryImages
    : [product.imageUrl].filter(Boolean);

  images.forEach((source, index) => {
    const slide = element("figure", "gallery-slide");
    slide.setAttribute("aria-hidden", String(index !== 0));
    const image = document.createElement("img");
    image.src = `..${source}`;
    image.alt = index ? `${product.name}, alternate view` : product.name;
    image.loading = "lazy";
    slide.append(image);
    track.append(slide);
  });

  if (images.length === 1) {
    gallery.append(track);
    return gallery;
  }

  gallery.tabIndex = 0;
  gallery.setAttribute("role", "region");
  gallery.setAttribute("aria-roledescription", "carousel");
  gallery.setAttribute("aria-label", `${product.name} image gallery`);

  let currentIndex = 0;
  let swipe;

  function updateGallery(index) {
    currentIndex = index;
    [...track.children].forEach((slide, slideIndex) => {
      slide.setAttribute("aria-hidden", String(slideIndex !== index));
    });
  }

  function showSlide(index) {
    const nextIndex = Math.max(0, Math.min(images.length - 1, index));
    track.style.transition = "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";
    track.style.transform = `translate3d(${-nextIndex * 100}%, 0, 0)`;
    updateGallery(nextIndex);
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
  gallery.append(track);
  return gallery;
}

function renderProducts() {
  productGrid.replaceChildren();
  productGrid.setAttribute("aria-busy", "false");
  for (const product of products) {
    const card = element("article", "product-card");
    card.dataset.productId = product.id;
    card.append(createGallery(product));
    productGrid.append(card);
  }

  setActiveProduct(products[0]);
  observeProducts();
}

function renderDock() {
  if (!activeProduct) return;
  const selected = cart[activeProduct.id] || 0;
  const count = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const serialNumber = activeProduct.serialNumbers?.[selected];
  dockName.textContent = activeProduct.name.replace(/ vase$/i, "");
  dockDescription.textContent = activeProduct.description;
  dockEdition.textContent = serialNumber === undefined
    ? "Sold out"
    : `N° ${serialNumber} of ${activeProduct.editionSize}`;
  dockAdd.disabled = serialNumber === undefined;
  shopDock.classList.toggle("has-cart", count > 0);
  shopDock.classList.toggle("has-current-selection", selected > 0);
  shopDock.hidden = false;
  renderProductInfo();
  requestAnimationFrame(() => {
    syncDockControls();
    updateDockVisibility();
  });
}

function selectionButtonWidth(includePrefix = false) {
  const text = selectionLabel.lastElementChild.getBoundingClientRect().width;
  const style = getComputedStyle(cartToggle);
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  return Math.ceil(text + padding + (includePrefix ? selectionPrefix.scrollWidth : 0));
}

function sizePillShape(shape, width, height, inset = 0) {
  const shapeWidth = Math.max(0, width - inset * 2);
  const shapeHeight = Math.max(0, height - inset * 2);
  shape.setAttribute("x", inset);
  shape.setAttribute("y", inset);
  shape.setAttribute("width", shapeWidth);
  shape.setAttribute("height", shapeHeight);
  shape.setAttribute("rx", shapeHeight / 2);
  shape.setAttribute("ry", shapeHeight / 2);
}

function sizeCircularMask(mask, base, hole, width, height, centerX, centerY, radius) {
  const bleed = Math.ceil(radius + 1);
  for (const element of [mask, base]) {
    element.setAttribute("x", -bleed);
    element.setAttribute("y", -bleed);
    element.setAttribute("width", width + bleed * 2);
    element.setAttribute("height", height + bleed * 2);
  }
  hole.setAttribute("cx", centerX);
  hole.setAttribute("cy", centerY);
  hole.setAttribute("r", radius);
}

function syncButtonArtwork() {
  const dockWidth = dockAdd.offsetWidth;
  const dockHeight = dockAdd.offsetHeight;
  const selectionWidth = cartToggle.offsetWidth;
  const selectionHeight = cartToggle.offsetHeight;
  const visibleWidth = shopDock.classList.contains("has-current-selection")
    ? selectionWidth
    : dockWidth;
  dockPrimary.style.setProperty("--dock-button-width", `${dockWidth}px`);
  shopDock.style.setProperty("--dock-button-width", `${visibleWidth}px`);

  sizePillShape(dockFillShape, dockWidth, dockHeight);
  sizePillShape(selectionSurfaceShape, selectionWidth, selectionHeight);
  sizePillShape(dockOutlineShape, dockWidth, dockHeight, 0.5);

  const countGap = parseFloat(
    getComputedStyle(cartCount).getPropertyValue("--cart-count-gap"),
  ) || 0;
  const countRadius = cartCount.offsetWidth / 2 + countGap;
  const countCenterX = cartCount.offsetLeft + cartCount.offsetWidth / 2;
  const countCenterY = cartCount.offsetTop + cartCount.offsetHeight / 2;
  sizeCircularMask(
    selectionSurfaceMask,
    selectionSurfaceMaskBase,
    selectionSurfaceMaskHole,
    selectionWidth,
    selectionHeight,
    countCenterX,
    countCenterY,
    countRadius,
  );

  const hasCountGap = shopDock.classList.contains("has-cart")
    && !shopDock.classList.contains("has-current-selection");
  sizeCircularMask(
    dockOutlineMask,
    dockOutlineMaskBase,
    dockOutlineMaskHole,
    dockWidth,
    dockHeight,
    countCenterX + (dockWidth - selectionWidth) / 2,
    countCenterY + (dockHeight - selectionHeight) / 2,
    hasCountGap ? countRadius : 0,
  );
}

function syncDockControls() {
  const locked = ["is-adding", "is-preparing-add", "is-confirming-add", "is-cart-open"];
  locked.push("is-info-open");
  const isLocked = locked.some((state) => shopDock.classList.contains(state));
  if (!isLocked) {
    const hasCurrentSelection = shopDock.classList.contains("has-current-selection");
    if (!hasCurrentSelection && selectionWidthAnimation) {
      selectionWidthAnimation.cancel();
      selectionWidthAnimation = undefined;
    }
    const width = hasCurrentSelection
      ? selectionButtonWidth()
      : dockAdd.getBoundingClientRect().width;
    cartToggle.style.width = `${width}px`;
  }
  syncButtonArtwork();
  syncMorphOrigin();
}

function animateSelectionWidth(targetWidth) {
  const startWidth = cartToggle.getBoundingClientRect().width;
  selectionWidthAnimation?.cancel();
  cartToggle.style.width = `${targetWidth}px`;
  if (Math.abs(startWidth - targetWidth) < 1) return;

  const animation = cartToggle.animate(
    [{ width: `${startWidth}px` }, { width: `${targetWidth}px` }],
    { duration: 420, easing: "cubic-bezier(0.53, 0, 0.12, 0.99)", fill: "both" },
  );
  selectionWidthAnimation = animation;
  animation.finished.then(() => {
    if (selectionWidthAnimation !== animation) return;
    animation.cancel();
    selectionWidthAnimation = undefined;
  }).catch(() => {});
}

function observeProducts() {
  const update = () => {
    productFrame = undefined;
    updateDockVisibility();
    const centerY = window.innerHeight / 2;
    const card = [...document.querySelectorAll(".product-card")].find((item) => {
      const rect = item.getBoundingClientRect();
      return rect.top <= centerY && rect.bottom > centerY;
    });
    setActiveProduct(productById(card?.dataset.productId));
  };

  const schedule = () => {
    if (!productFrame) productFrame = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();
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
    details.append(element("h3", "", product.name.replace(/ vase$/i, "")));
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
  renderDock();
  updateReservationTimers();
  if (shopDock.classList.contains("is-cart-open")) sizeCart();
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

function sizeCart() {
  const errorHeight = cartError.textContent ? 38 : 0;
  const itemsHeight = [...cartItems.querySelectorAll(".cart-item")]
    .reduce((height, item) => height + item.offsetHeight, 0);
  const style = getComputedStyle(cartPanel);
  const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const contentHeight = itemsHeight + checkoutButton.offsetHeight + errorHeight
    + cartPanel.offsetTop * 2 + verticalPadding + 4;
  const height = Math.min(contentHeight, window.innerHeight * 0.7);
  shopDock.style.setProperty("--cart-height", `${height}px`);
}

function setMorphOrigin(rect) {
  const dockRect = shopDock.getBoundingClientRect();
  shopDock.style.setProperty("--morph-top", `${rect.top - dockRect.top}px`);
  shopDock.style.setProperty("--morph-left", `${rect.left - dockRect.left}px`);
  shopDock.style.setProperty("--morph-width", `${rect.width}px`);
  shopDock.style.setProperty("--morph-height", `${rect.height}px`);
  shopDock.style.setProperty("--morph-radius", `${rect.height / 2}px`);
}

function syncMorphOrigin() {
  if (
    !shopDock.classList.contains("has-cart")
    || shopDock.classList.contains("is-cart-open")
    || shopDock.classList.contains("is-info-open")
  ) return;
  setMorphOrigin(cartToggle.getBoundingClientRect());
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
    const fallback = shopDock.classList.contains("has-cart") ? cartToggle : dockAdd;
    const next = target?.isConnected && !target.disabled && target.getClientRects().length
      ? target
      : fallback;
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
  )].filter((element) => element.getClientRects().length);
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

new ResizeObserver(syncDockControls).observe(cartToggle);
new ResizeObserver(syncDockControls).observe(dockAdd);
new ResizeObserver(() => {
  if (shopDock.classList.contains("is-cart-open")) sizeCart();
}).observe(cartItems);

function openCart() {
  clearTimeout(closeTimer);
  closeTimer = undefined;
  shopDock.classList.remove("is-cart-closing");
  syncMorphOrigin();
  void shopDock.offsetWidth;
  sizeCart();
  shopDock.classList.add("is-cart-open");
  cartBackdrop.hidden = false;
  cartPanel.setAttribute("aria-hidden", "false");
  document.querySelector(".cart-toggle").setAttribute("aria-expanded", "true");
  activateDialog(cartPanel, cartToggle);
}

function openInfo() {
  clearTimeout(closeTimer);
  closeTimer = undefined;
  shopDock.classList.remove("is-info-closing");
  renderProductInfo();
  setMorphOrigin(infoToggle.getBoundingClientRect());
  void shopDock.offsetWidth;
  shopDock.classList.add("is-info-open");
  cartBackdrop.hidden = false;
  infoPanel.setAttribute("aria-hidden", "false");
  infoToggle.setAttribute("aria-expanded", "true");
  activateDialog(infoPanel, infoToggle);
}

function closeCart(onClosed) {
  if (!shopDock.classList.contains("is-cart-open")) return;
  const focusTarget = deactivateDialog(cartPanel);
  clearTimeout(closeTimer);
  shopDock.classList.add("is-cart-closing");
  shopDock.classList.remove("is-cart-open");
  cartPanel.setAttribute("aria-hidden", "true");
  document.querySelector(".cart-toggle").setAttribute("aria-expanded", "false");
  closeTimer = setTimeout(() => {
    shopDock.classList.remove("is-cart-closing");
    cartBackdrop.hidden = true;
      closeTimer = undefined;
      if (typeof onClosed === "function") onClosed();
      restoreDialogFocus(focusTarget);
  }, 520);
}

function closeInfo(onClosed) {
  if (!shopDock.classList.contains("is-info-open")) return;
  const focusTarget = deactivateDialog(infoPanel);
  clearTimeout(closeTimer);
  shopDock.classList.add("is-info-closing");
  shopDock.classList.remove("is-info-open");
  infoPanel.setAttribute("aria-hidden", "true");
  infoToggle.setAttribute("aria-expanded", "false");
  closeTimer = setTimeout(() => {
    shopDock.classList.remove("is-info-closing");
    cartBackdrop.hidden = true;
    closeTimer = undefined;
    syncDockControls();
    if (typeof onClosed === "function") onClosed();
    restoreDialogFocus(focusTarget);
  }, 520);
}

function closeOpenPanel() {
  if (shopDock.classList.contains("is-cart-open")) closeCart();
  else if (shopDock.classList.contains("is-info-open")) closeInfo();
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

  if (!Object.keys(cart).length && shopDock.classList.contains("is-cart-open")) {
    saveCart();
    closeCart(renderCart);
    return;
  }

  renderCart();
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

dockAdd.addEventListener("click", async () => {
  if (!activeProduct || addTimer || confirmationTimer) return;
  const productId = activeProduct.id;
  const nextCart = { ...cart, [productId]: (cart[productId] || 0) + 1 };
  shopDock.classList.add("is-adding");

  const animationDelay = new Promise((resolve) => {
    addTimer = setTimeout(resolve, 1500);
  });

  try {
    const [nextReservations] = await Promise.all([
      syncCartReservations(nextCart),
      animationDelay,
    ]);
    cart = nextCart;
    reservations = nextReservations;
    cartToggle.style.width = `${dockAdd.getBoundingClientRect().width}px`;
    shopDock.classList.add("is-preparing-add");
    shopDock.classList.remove("is-adding");
    renderCart();
    addTimer = undefined;

    clearTimeout(confirmationTimer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      shopDock.classList.remove("is-preparing-add");
      selectionText.textContent = "your selection";
      shopDock.classList.add("is-confirming-add");
      animateSelectionWidth(selectionButtonWidth(true));
      confirmationTimer = setTimeout(() => {
        shopDock.classList.remove("is-confirming-add");
        selectionText.textContent = "Your selection";
        confirmationTimer = undefined;
        if (shopDock.classList.contains("has-current-selection")) {
          animateSelectionWidth(selectionButtonWidth());
        } else {
          syncDockControls();
        }
      }, 1400);
    }));
  } catch (error) {
    clearTimeout(addTimer);
    addTimer = undefined;
    shopDock.classList.remove("is-adding");
    cartError.textContent = error.message;
  }
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "reserve-again") {
    reserveAgain(button.dataset.productId, button);
  } else {
    changeQuantity(button.dataset.productId, -(cart[button.dataset.productId] || 0));
  }
});

cartToggle.addEventListener("click", openCart);
infoToggle.addEventListener("click", openInfo);
document.querySelector(".cart-close").addEventListener("click", closeCart);
document.querySelector(".info-close").addEventListener("click", closeInfo);
infoClaim.addEventListener("click", () => closeInfo(() => dockAdd.click()));
cartBackdrop.addEventListener("click", () => closeCart());
cartBackdrop.addEventListener("click", closeInfo);
checkoutButton.addEventListener("click", startCheckout);
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
