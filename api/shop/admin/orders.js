const { requireAdmin } = require("../../../lib/shop/auth");
const { getPool, setupDatabase } = require("../../../lib/shop/database");

const fulfillmentStatuses = new Set(["unfulfilled", "packed", "shipped", "cancelled"]);

module.exports = async function handler(request, response) {
  if (!requireAdmin(request, response)) return;

  try {
    if (!(await setupDatabase())) {
      return response.status(503).json({ error: "Database is not configured." });
    }

    const db = getPool();
    if (request.method === "GET") {
      const result = await db.query("SELECT * FROM shop_orders ORDER BY created_at DESC LIMIT 200");
      return response.status(200).json({ orders: result.rows });
    }

    if (request.method === "POST") {
      const orderId = String(request.body?.orderId || "");
      const status = String(request.body?.fulfillmentStatus || "");
      if (!orderId || !fulfillmentStatuses.has(status)) {
        return response.status(400).json({ error: "Invalid order update." });
      }
      const result = await db.query(
        `UPDATE shop_orders
         SET fulfillment_status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, orderId],
      );
      if (!result.rowCount) return response.status(404).json({ error: "Order not found." });
      return response.status(200).json({ order: result.rows[0] });
    }

    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return response.status(500).json({ error: "Could not load orders." });
  }
};
