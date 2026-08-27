const { getPool, setupDatabase } = require("../../lib/shop/database");
const {
  normalizeReservationCart,
  normalizeVisitorId,
  syncReservations,
} = require("../../lib/shop/reservations");

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!(await setupDatabase())) {
      return response.status(503).json({ error: "The shop database is not configured." });
    }

    const visitorId = normalizeVisitorId(request.body?.visitorId);
    const cart = normalizeReservationCart(request.body?.items);
    const reservations = await syncReservations(getPool(), visitorId, cart);
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json({ reservations });
  } catch (error) {
    const status = /cart|available|stock|session/i.test(error.message) ? 400 : 500;
    return response.status(status).json({
      error: status === 400 ? error.message : "The cart could not be reserved.",
    });
  }
};
