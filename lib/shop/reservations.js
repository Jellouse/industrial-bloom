const { availableSerialNumbers } = require("./inventory");

const RESERVATION_MINUTES = 15;

function normalizeVisitorId(value) {
  const visitorId = String(value || "").trim();
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(visitorId)) throw new Error("Invalid cart session.");
  return visitorId;
}

function normalizeReservationCart(items) {
  if (!Array.isArray(items) || items.length > 10) throw new Error("Invalid cart.");

  const quantities = new Map();
  for (const item of items) {
    const productId = String(item?.productId || "");
    const quantity = Number(item?.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error("Invalid cart.");
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const cart = [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
  if (cart.some((item) => item.quantity > 10)) throw new Error("Invalid cart.");
  return cart;
}

function reservationsByProduct(rows, visitorId) {
  const reserved = new Map();
  for (const row of rows) {
    if (row.visitor_id === visitorId) continue;
    const serials = reserved.get(row.product_id) || new Set();
    for (const serial of row.serial_numbers || []) serials.add(serial);
    reserved.set(row.product_id, serials);
  }
  return reserved;
}

async function syncReservations(db, visitorId, cart) {
  const client = await db.connect();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM shop_cart_reservations WHERE expires_at <= NOW()");

    const productIds = cart.map((item) => item.productId).sort();
    const productResult = productIds.length
      ? await client.query(
        `SELECT * FROM shop_products
         WHERE id = ANY($1::text[]) AND active = TRUE
         ORDER BY id
         FOR UPDATE`,
        [productIds],
      )
      : { rows: [] };
    const products = new Map(productResult.rows.map((product) => [product.id, product]));

    await client.query(
      `DELETE FROM shop_cart_reservations
       WHERE visitor_id = $1
         AND NOT (product_id = ANY($2::text[]))`,
      [visitorId, productIds],
    );

    const reservations = [];
    for (const item of cart) {
      const product = products.get(item.productId);
      if (!product) throw new Error("A product is no longer available.");

      const reservationResult = await client.query(
        `SELECT * FROM shop_cart_reservations
         WHERE product_id = $1 AND expires_at > NOW()
         FOR UPDATE`,
        [product.id],
      );
      const own = reservationResult.rows.find((row) => row.visitor_id === visitorId);
      const reservedByOthers = new Set(
        reservationResult.rows
          .filter((row) => row.visitor_id !== visitorId)
          .flatMap((row) => row.serial_numbers || []),
      );
      const available = availableSerialNumbers(product)
        .filter((serial) => !reservedByOthers.has(serial));
      const ownSerials = (own?.serial_numbers || []).filter((serial) => available.includes(serial));
      const serialNumbers = [
        ...ownSerials.slice(0, item.quantity),
        ...available.filter((serial) => !ownSerials.includes(serial)),
      ].slice(0, item.quantity);

      if (serialNumbers.length < item.quantity) {
        throw new Error(`${product.name} does not have enough stock.`);
      }

      const unchanged = own
        && ownSerials.length === item.quantity
        && ownSerials.every((serial, index) => serial === serialNumbers[index]);
      const reservationExpiresAt = unchanged ? own.expires_at : expiresAt;

      await client.query(
        `INSERT INTO shop_cart_reservations
          (visitor_id, product_id, serial_numbers, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (visitor_id, product_id) DO UPDATE SET
           serial_numbers = EXCLUDED.serial_numbers,
           expires_at = EXCLUDED.expires_at,
           updated_at = NOW()`,
        [visitorId, product.id, serialNumbers, reservationExpiresAt],
      );
      reservations.push({
        productId: product.id,
        serialNumbers,
        expiresAt: new Date(reservationExpiresAt).toISOString(),
      });
    }

    await client.query("COMMIT");
    return reservations;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  RESERVATION_MINUTES,
  normalizeReservationCart,
  normalizeVisitorId,
  reservationsByProduct,
  syncReservations,
};
