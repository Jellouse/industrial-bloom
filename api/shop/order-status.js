const { getPool, setupDatabase } = require("../../lib/shop/database");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const sessionId = String(request.query.session_id || "");
  const orderId = String(request.query.order_id || "");
  if (!sessionId && !orderId) return response.status(400).json({ error: "Missing order reference." });

  try {
    if (!(await setupDatabase())) return response.status(503).json({ error: "Database is not configured." });
    const result = await getPool().query(
      `SELECT id, payment_status, fulfillment_status, amount_total, currency, customer_email, created_at
       FROM shop_orders
       WHERE stripe_session_id = $1 OR id = $2
       LIMIT 1`,
      [sessionId || null, orderId || null],
    );
    if (!result.rowCount) return response.status(202).json({ status: "processing" });
    return response.status(200).json({ status: "confirmed", order: result.rows[0] });
  } catch (error) {
    return response.status(500).json({ error: "Could not load the order." });
  }
};
