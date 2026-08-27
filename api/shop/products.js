const { products: fallbackProducts } = require("../../lib/shop/catalog");
const { checkoutMode } = require("../../lib/shop/helpers");
const { getPool, mapProduct, setupDatabase } = require("../../lib/shop/database");
const { reconcileExpiredCheckouts } = require("../../lib/shop/checkout-reconciliation");
const { normalizeVisitorId, reservationsByProduct } = require("../../lib/shop/reservations");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const configured = await setupDatabase();
    let products = fallbackProducts;

    if (configured) {
      const db = getPool();
      await reconcileExpiredCheckouts();
      const visitorId = request.query?.visitorId
        ? normalizeVisitorId(request.query.visitorId)
        : "";
      const [productResult, reservationResult] = await Promise.all([
        db.query("SELECT * FROM shop_products WHERE active = TRUE ORDER BY created_at, name"),
        db.query(
          `SELECT visitor_id, product_id, serial_numbers
           FROM shop_cart_reservations
           WHERE expires_at > NOW()`,
        ),
      ]);
      const heldSerials = reservationsByProduct(reservationResult.rows, visitorId);
      products = productResult.rows.map((row) => {
        const product = mapProduct(row);
        const held = heldSerials.get(product.id) || new Set();
        const serialNumbers = product.serialNumbers.filter((serial) => !held.has(serial));
        return { ...product, inventory: serialNumbers.length, serialNumbers };
      });
    }

    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json({ products, checkoutMode: checkoutMode() });
  } catch (error) {
    const status = /session/i.test(error.message) ? 400 : 500;
    return response.status(status).json({ error: status === 400 ? error.message : "Could not load products." });
  }
};
