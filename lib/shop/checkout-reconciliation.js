const Stripe = require("stripe");
const { getPool } = require("./database");
const { completeCheckout, expireCheckout } = require("./checkout-lifecycle");

let lastRun = 0;
let running;

function reconciliationAction(checkout, session, error) {
  if (!checkout.stripe_session_id) return "expire";
  if (error?.code === "resource_missing") return "expire";
  if (session?.status === "expired") return "expire";
  if (session?.status === "complete" && session.payment_status === "paid") return "complete";
  return null;
}

async function runReconciliation() {
  const db = getPool();
  const result = await db.query(
    `SELECT id, stripe_session_id
     FROM shop_checkouts
     WHERE status = 'pending' AND expires_at <= NOW()
     ORDER BY expires_at
     LIMIT 50`,
  );
  if (!result.rows.length) return { completed: 0, expired: 0 };

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
  const reconciled = { completed: 0, expired: 0 };

  for (const checkout of result.rows) {
    let session;
    let retrievalError;
    if (checkout.stripe_session_id && stripe) {
      try {
        session = await stripe.checkout.sessions.retrieve(checkout.stripe_session_id);
      } catch (error) {
        retrievalError = error;
      }
    }

    const action = reconciliationAction(checkout, session, retrievalError);
    if (action === "complete" && await completeCheckout(session)) reconciled.completed += 1;
    if (action === "expire" && await expireCheckout(checkout.id)) reconciled.expired += 1;
  }

  return reconciled;
}

async function reconcileExpiredCheckouts() {
  if (Date.now() - lastRun < 30_000) return { completed: 0, expired: 0 };
  if (!running) {
    running = runReconciliation().finally(() => {
      lastRun = Date.now();
      running = undefined;
    });
  }
  return running;
}

module.exports = { reconcileExpiredCheckouts, reconciliationAction };
