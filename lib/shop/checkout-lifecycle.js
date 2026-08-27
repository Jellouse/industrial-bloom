const { id } = require("./helpers");
const { getPool } = require("./database");
const { restoreSerialNumbers } = require("./inventory");
const { assertCheckoutCompletable } = require("./checkout-state");

async function completeCheckout(session) {
  if (session.payment_status !== "paid") return false;
  const checkoutId = session.metadata?.checkoutId;
  if (!checkoutId) return false;

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM shop_checkouts WHERE id = $1 FOR UPDATE",
      [checkoutId],
    );
    const checkout = result.rows[0];
    if (checkout?.status === "paid") {
      await client.query("COMMIT");
      return true;
    }
    assertCheckoutCompletable(checkout, session);

    const shipping = session.collected_information?.shipping_details || session.shipping_details;
    await client.query(
      `INSERT INTO shop_orders
        (id, checkout_id, stripe_session_id, payment_status, items, amount_total, currency,
         customer_email, customer_name, shipping_address)
       VALUES ($1, $2, $3, 'paid', $4::jsonb, $5, $6, $7, $8, $9::jsonb)
       ON CONFLICT (checkout_id) DO NOTHING`,
      [
        id("order"),
        checkout.id,
        session.id,
        JSON.stringify(checkout.items),
        session.amount_total || checkout.amount_total,
        session.currency || checkout.currency,
        session.customer_details?.email || checkout.customer_email,
        shipping?.name || session.customer_details?.name || null,
        JSON.stringify(shipping?.address || null),
      ],
    );
    await client.query(
      "UPDATE shop_checkouts SET status = 'paid', updated_at = NOW() WHERE id = $1",
      [checkout.id],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function expireCheckout(checkoutId) {
  if (!checkoutId) return false;

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM shop_checkouts WHERE id = $1 FOR UPDATE",
      [checkoutId],
    );
    const checkout = result.rows[0];
    if (!checkout || checkout.status !== "pending") {
      await client.query("COMMIT");
      return false;
    }

    for (const item of checkout.items) {
      await restoreSerialNumbers(client, item);
    }
    await client.query(
      "UPDATE shop_checkouts SET status = 'expired', updated_at = NOW() WHERE id = $1",
      [checkout.id],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { completeCheckout, expireCheckout };
