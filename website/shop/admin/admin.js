const loginPanel = document.querySelector(".login-panel");
const dashboard = document.querySelector(".dashboard");
const loginForm = document.querySelector(".login-form");
const logoutButton = document.querySelector(".logout");
const productList = document.querySelector(".product-list");
const orderList = document.querySelector(".order-list");
const productDialog = document.querySelector(".product-dialog");
const productForm = document.querySelector(".product-form");
const imageDialog = document.querySelector(".image-dialog");
const imageForm = document.querySelector(".image-upload-form");
const imageList = document.querySelector(".image-list");
const imagePreview = document.querySelector(".product-image-preview");
const galleryImageList = document.querySelector(".gallery-image-list");
let token = localStorage.getItem("shop-admin-token") || "";
let products = [];
let editingGallery = [];

function money(cents, currency = "eur") {
  return new Intl.NumberFormat("en-DE", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function node(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function imageSource(path) {
  return path ? `../..${path}` : "";
}

function updateImagePreview() {
  imagePreview.src = imageSource(productForm.elements.imageUrl.value.trim());
}

function renderGalleryEditor() {
  galleryImageList.replaceChildren();
  editingGallery.forEach((source, index) => {
    const item = node("article", "gallery-image");
    const preview = document.createElement("img");
    preview.src = imageSource(source);
    preview.alt = "";
    const controls = node("div", "gallery-image-controls");
    for (const [label, action, disabled] of [
      ["←", "left", index === 0],
      ["Remove", "remove", false],
      ["→", "right", index === editingGallery.length - 1],
    ]) {
      const button = node("button", "", label);
      button.type = "button";
      button.dataset.galleryAction = action;
      button.dataset.galleryIndex = index;
      button.disabled = disabled;
      controls.append(button);
    }
    item.append(preview, controls);
    galleryImageList.append(item);
  });
  productForm.elements.imageUrl.value = editingGallery[0] || "";
  updateImagePreview();
}

async function api(path, options = {}) {
  const response = await fetch(`/api/shop/admin/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Shop-Admin-Token": token, ...options.headers },
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) showLogin();
    throw new Error(result.error || "Request failed.");
  }
  return result;
}

function showLogin() {
  token = "";
  localStorage.removeItem("shop-admin-token");
  loginPanel.hidden = false;
  dashboard.hidden = true;
  logoutButton.hidden = true;
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  logoutButton.hidden = false;
}

async function loadProducts() {
  const result = await api("products");
  products = result.products;
  productList.replaceChildren();
  for (const product of products) {
    const row = node("article", "product-row");
    const image = document.createElement("img");
    image.src = imageSource(product.imageUrl);
    image.alt = "";
    const title = node("div");
    title.append(node("strong", "", product.name), node("span", "muted", product.slug));
    const price = node("span", "", money(product.priceCents, product.currency));
    const stock = node("span", "", product.inventory
      ? `${product.inventory} available · next N° ${product.serialNumbers[0]}`
      : "Sold out");
    const status = node("span", "status", product.active ? "Active" : "Hidden");
    const edit = node("button", "", "Edit");
    edit.type = "button";
    edit.dataset.productId = product.id;
    row.append(image, title, price, stock, status, edit);
    productList.append(row);
  }
}

async function loadImages() {
  const result = await api("images");
  imageList.replaceChildren();
  if (!result.images.length) {
    imageList.append(node("p", "empty", "No uploaded images yet."));
    return;
  }

  for (const image of result.images) {
    const item = node("article", "image-item");
    const preview = document.createElement("img");
    preview.src = imageSource(image.url);
    preview.alt = "";
    const name = node("span", "image-name", image.filename);
    const use = node("button", "use-image", "Add");
    use.type = "button";
    use.dataset.imageUrl = image.url;
    const remove = node("button", "delete-image", "Delete");
    remove.type = "button";
    remove.dataset.imageId = image.id;
    item.append(preview, name, use, remove);
    imageList.append(item);
  }
}

async function loadOrders() {
  const result = await api("orders");
  orderList.replaceChildren();
  if (!result.orders.length) {
    orderList.append(node("p", "empty", "No orders yet."));
    return;
  }
  for (const order of result.orders) {
    const row = node("article", "order-row");
    const identity = node("div");
    identity.append(node("strong", "", order.customer_name || order.customer_email || "Customer"), node("span", "muted", order.id));
    const date = node("span", "", new Date(order.created_at).toLocaleDateString());
    const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const items = node("span", "", `${count} item${count === 1 ? "" : "s"}`);
    const total = node("span", "", money(order.amount_total, order.currency));
    const select = document.createElement("select");
    select.dataset.orderId = order.id;
    for (const status of ["unfulfilled", "packed", "shipped", "cancelled"]) {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status[0].toUpperCase() + status.slice(1);
      option.selected = status === order.fulfillment_status;
      select.append(option);
    }
    const address = order.shipping_address || {};
    const details = node("div", "order-details");
    details.append(
      node("span", "", order.items.map((item) => {
        const serials = item.serialNumbers?.map((serial) => `N° ${serial}`).join(", ");
        return `${item.quantity} × ${item.name}${serials ? ` (${serials})` : ""}`;
      }).join(" · ")),
      node("span", "", [
        order.customer_email,
        address.line1,
        address.line2,
        [address.postal_code, address.city].filter(Boolean).join(" "),
        address.country,
      ].filter(Boolean).join(" · ")),
    );
    row.append(identity, date, items, total, select, details);
    orderList.append(row);
  }
}

function openProduct(product = {}) {
  productForm.reset();
  productForm.elements.name.value = product.name || "";
  productForm.elements.slug.value = product.slug || "";
  productForm.elements.description.value = product.description || "";
  productForm.elements.price.value = product.priceCents === undefined ? "" : (product.priceCents / 100).toFixed(2);
  productForm.elements.serialNumbers.value = (product.serialNumbers || []).join(", ");
  productForm.elements.imageUrl.value = product.imageUrl || "/assets/responsive/";
  editingGallery = [...(product.galleryImages?.length ? product.galleryImages : product.imageUrl ? [product.imageUrl] : [])];
  renderGalleryEditor();
  productForm.elements.active.checked = product.active !== false;
  productForm.dataset.productId = product.id || "";
  productForm.querySelector(".form-error").textContent = "";
  productDialog.showModal();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  token = loginForm.elements.token.value.trim();
  try {
    await loadProducts();
    localStorage.setItem("shop-admin-token", token);
    showDashboard();
  } catch (error) {
    loginForm.querySelector(".login-error").textContent = error.message;
  }
});

logoutButton.addEventListener("click", showLogin);
document.querySelector(".new-product").addEventListener("click", () => openProduct());
document.querySelector(".close-dialog").addEventListener("click", () => productDialog.close());
document.querySelector(".close-images").addEventListener("click", () => imageDialog.close());
document.querySelector(".refresh-orders").addEventListener("click", () => loadOrders());

productForm.elements.imageUrl.addEventListener("input", () => {
  const source = productForm.elements.imageUrl.value.trim();
  if (editingGallery.length) editingGallery[0] = source;
  else if (source) editingGallery.push(source);
  updateImagePreview();
});
galleryImageList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-gallery-action]");
  if (!button) return;
  const index = Number(button.dataset.galleryIndex);
  if (button.dataset.galleryAction === "remove") editingGallery.splice(index, 1);
  else {
    const target = button.dataset.galleryAction === "left" ? index - 1 : index + 1;
    [editingGallery[index], editingGallery[target]] = [editingGallery[target], editingGallery[index]];
  }
  renderGalleryEditor();
});
document.querySelector(".manage-images").addEventListener("click", async () => {
  imageDialog.showModal();
  imageDialog.querySelector(".image-error").textContent = "";
  try {
    await loadImages();
  } catch (error) {
    imageDialog.querySelector(".image-error").textContent = error.message;
  }
});

imageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = imageForm.elements.image.files[0];
  const submit = imageForm.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error("Images must be smaller than 2 MB.");
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read image."));
      reader.readAsDataURL(file);
    });
    await api("images", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, type: file.type, data }),
    });
    imageForm.reset();
    await loadImages();
  } catch (error) {
    imageDialog.querySelector(".image-error").textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});

imageList.addEventListener("click", async (event) => {
  const use = event.target.closest("button[data-image-url]");
  if (use) {
    if (!editingGallery.includes(use.dataset.imageUrl)) editingGallery.push(use.dataset.imageUrl);
    renderGalleryEditor();
    imageDialog.close();
    return;
  }

  const remove = event.target.closest("button[data-image-id]");
  if (!remove || !confirm("Delete this image?")) return;
  try {
    await api("images", { method: "DELETE", body: JSON.stringify({ id: remove.dataset.imageId }) });
    await loadImages();
  } catch (error) {
    imageDialog.querySelector(".image-error").textContent = error.message;
  }
});

productList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-product-id]");
  if (button) openProduct(products.find((product) => product.id === button.dataset.productId));
});

productForm.elements.name.addEventListener("input", () => {
  if (productForm.dataset.productId || productForm.elements.slug.value) return;
  productForm.elements.slug.value = productForm.elements.name.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = productForm.querySelector(".save-product");
  submit.disabled = true;
  try {
    await api("products", {
      method: "POST",
      body: JSON.stringify({
        id: productForm.dataset.productId || productForm.elements.slug.value,
        slug: productForm.elements.slug.value,
        name: productForm.elements.name.value,
        description: productForm.elements.description.value,
        priceCents: Math.round(Number(productForm.elements.price.value) * 100),
        serialNumbers: productForm.elements.serialNumbers.value,
        currency: "eur",
        imageUrl: productForm.elements.imageUrl.value,
        galleryImages: editingGallery,
        active: productForm.elements.active.checked,
      }),
    });
    productDialog.close();
    await loadProducts();
  } catch (error) {
    productForm.querySelector(".form-error").textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});

orderList.addEventListener("change", async (event) => {
  if (!event.target.matches("select[data-order-id]")) return;
  event.target.disabled = true;
  try {
    await api("orders", {
      method: "POST",
      body: JSON.stringify({ orderId: event.target.dataset.orderId, fulfillmentStatus: event.target.value }),
    });
  } catch (error) {
    alert(error.message);
    await loadOrders();
  } finally {
    event.target.disabled = false;
  }
});

document.querySelector(".tabs").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-tab]");
  if (!button) return;
  document.querySelectorAll(".tabs button").forEach((tab) => tab.classList.toggle("is-active", tab === button));
  document.querySelector(".products-panel").hidden = button.dataset.tab !== "products";
  document.querySelector(".orders-panel").hidden = button.dataset.tab !== "orders";
  if (button.dataset.tab === "orders") await loadOrders();
});

if (token) {
  loadProducts().then(showDashboard).catch(showLogin);
}
