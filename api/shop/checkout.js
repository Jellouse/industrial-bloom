const Stripe = require("stripe");
const { getPool, setupDatabase } = require("../../lib/shop/database");
const { checkoutMode, id, normalizeCart, siteOrigin } = require("../../lib/shop/helpers");
const { availableSerialNumbers, restoreSerialNumbers } = require("../../lib/shop/inventory");
const { normalizeVisitorId } = require("../../lib/shop/reservations");

async function releaseCheckout(checkoutId) {
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM shop_checkouts WHERE id = $1 FOR UPDATE", [checkoutId]);
    const checkout = result.rows[0];
    if (!checkout || checkout.status !== "pending") {
      await client.query("COMMIT");
      return;
    }
    for (const item of checkout.items) {
      await restoreSerialNumbers(client, item);
    }
    await client.query("UPDATE shop_checkouts SET status = 'failed', updated_at = NOW() WHERE id = $1", [checkoutId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function reserveCart(cart, customerEmail, visitorId) {
  const db = getPool();
  const client = await db.connect();
  const checkoutId = id("checkout");
  const expiresAt = new Date(Date.now() + 31 * 60 * 1000);

  try {
    await client.query("BEGIN");
    const ids = cart.map((item) => item.productId);
    const result = await client.query(
      `SELECT * FROM shop_products
       WHERE id = ANY($1::text[]) AND active = TRUE
       ORDER BY id
       FOR UPDATE`,
      [ids],
    );
    const products = new Map(result.rows.map((product) => [product.id, product]));
    const reservationResult = await client.query(
      `SELECT * FROM shop_cart_reservations
       WHERE visitor_id = $1
         AND product_id = ANY($2::text[])
         AND expires_at > NOW()
       FOR UPDATE`,
      [visitorId, ids],
    );
    const reservations = new Map(
      reservationResult.rows.map((reservation) => [reservation.product_id, reservation]),
    );
    const items = [];

    for (const cartItem of cart) {
      const product = products.get(cartItem.productId);
      if (!product) throw new Error("A product is no longer available.");
      const reservation = reservations.get(product.id);
      const reservedSerialNumbers = reservation?.serial_numbers || [];
      if (reservedSerialNumbers.length !== cartItem.quantity) {
        throw new Error(`${product.name} is no longer reserved.`);
      }
      const serialNumbers = availableSerialNumbers(product);
      if (!reservedSerialNumbers.every((serial) => serialNumbers.includes(serial))) {
        throw new Error(`${product.name} is no longer available.`);
      }
      const remainingSerialNumbers = serialNumbers
        .filter((serial) => !reservedSerialNumbers.includes(serial));

      items.push({
        productId: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.image_url,
        quantity: cartItem.quantity,
        serialNumbers: reservedSerialNumbers,
        editionSize: product.edition_size,
        unitAmount: product.price_cents,
      });
      await client.query(
        `UPDATE shop_products
         SET available_serials = $1,
             inventory = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [remainingSerialNumbers, remainingSerialNumbers.length, product.id],
      );
      await client.query(
        "DELETE FROM shop_cart_reservations WHERE visitor_id = $1 AND product_id = $2",
        [visitorId, product.id],
      );
    }

    const amountTotal = items.reduce((total, item) => total + item.unitAmount * item.quantity, 0);
    await client.query(
      `INSERT INTO shop_checkouts
        (id, status, items, amount_total, currency, customer_email, expires_at)
       VALUES ($1, 'pending', $2::jsonb, $3, 'eur', $4, $5)`,
      [checkoutId, JSON.stringify(items), amountTotal, customerEmail || null, expiresAt],
    );
    await client.query("COMMIT");
    return { checkoutId, expiresAt, items, amountTotal };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function completeDemoCheckout(checkout) {
  const orderId = id("order");
  const email = checkout.customerEmail || "staging@industrialbloom.test";
  await getPool().query(
    `WITH updated AS (
       UPDATE shop_checkouts
       SET status = 'paid', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *
     )
     INSERT INTO shop_orders
       (id, checkout_id, payment_status, items, amount_total, currency, customer_email, customer_name, shipping_address)
     SELECT $2, id, 'paid_demo', items, amount_total, currency, $3, 'Staging customer',
       '{"line1":"Demo address","city":"Berlin","postal_code":"10115","country":"DE"}'::jsonb
     FROM updated`,
    [checkout.checkoutId, orderId, email],
  );
  return orderId;
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  let checkout;
  let stripe;
  let stripeSession;
  try {
    if (!(await setupDatabase())) {
      return response.status(503).json({ error: "The shop database is not configured." });
    }

    const cart = normalizeCart(request.body?.items);
    const visitorId = normalizeVisitorId(request.body?.visitorId);
    const customerEmail = String(request.body?.customerEmail || "").trim().toLowerCase();
    checkout = await reserveCart(cart, customerEmail, visitorId);
    checkout.customerEmail = customerEmail;
    const mode = checkoutMode();
    const origin = siteOrigin(request);

    if (mode === "demo") {
      const orderId = await completeDemoCheckout(checkout);
      return response.status(200).json({ mode, url: `${origin}/shop/success.html?order_id=${orderId}` });
    }

    if (mode !== "stripe") {
      await releaseCheckout(checkout.checkoutId);
      return response.status(503).json({ error: "Stripe is not configured." });
    }

    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: checkout.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: item.unitAmount,
          product_data: {
            name: item.name,
            description: item.description,
            images: item.imageUrl ? [`${origin}${item.imageUrl}`] : [],
          },
        },
      })),
      customer_email: customerEmail || undefined,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["DE", "AT", "BE", "CZ", "DK", "ES", "FI", "FR", "IE", "IT", "LU", "NL", "PL", "PT", "SE"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 1200, currency: "eur" },
            display_name: "Tracked shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ],
      expires_at: Math.floor(checkout.expiresAt.getTime() / 1000),
      metadata: { checkoutId: checkout.checkoutId },
      success_url: `${origin}/shop/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/`,
    }, { idempotencyKey: checkout.checkoutId });

    await getPool().query(
      "UPDATE shop_checkouts SET stripe_session_id = $1, updated_at = NOW() WHERE id = $2",
      [stripeSession.id, checkout.checkoutId],
    );
    return response.status(200).json({ mode, url: stripeSession.url });
  } catch (error) {
    console.error("Checkout failed", {
      type: error.type,
      code: error.code,
      message: error.message,
    });
    let safeToRelease = !stripeSession;
    if (stripeSession && stripe) {
      safeToRelease = await stripe.checkout.sessions.expire(stripeSession.id)
        .then(() => true)
        .catch(() => false);
    }
    if (safeToRelease && checkout?.checkoutId) {
      await releaseCheckout(checkout.checkoutId).catch(() => {});
    }
    const status = /cart|available|stock|reserved|session/i.test(error.message) ? 400 : 500;
    return response.status(status).json({ error: status === 400 ? error.message : "Checkout could not be started." });
  }
};
