const crypto = require("crypto");

function id(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

function checkoutMode() {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) return "stripe";
  if (process.env.SHOP_DEMO_MODE === "true") return "demo";
  return "unavailable";
}

function siteOrigin(request) {
  if (process.env.SHOP_SITE_URL) return process.env.SHOP_SITE_URL.replace(/\/$/, "");
  const host = request.headers["x-forwarded-host"] || request.headers.host;
  const protocol = request.headers["x-forwarded-proto"] || "https";
  return `${protocol}://${host}`;
}

function normalizeCart(items) {
  if (!Array.isArray(items) || !items.length || items.length > 10) {
    throw new Error("Your cart is empty.");
  }

  const quantities = new Map();
  for (const item of items) {
    const productId = String(item?.productId || "");
    const quantity = Number(item?.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error("Invalid cart.");
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

module.exports = { checkoutMode, id, normalizeCart, siteOrigin };
