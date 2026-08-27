function assertCheckoutCompletable(checkout, session) {
  if (!checkout) throw new Error("Checkout not found.");
  if (checkout.status !== "pending") throw new Error("Checkout is not pending.");
  if (!checkout.stripe_session_id || checkout.stripe_session_id !== session.id) {
    throw new Error("Checkout session mismatch.");
  }
  if (session.payment_status !== "paid") throw new Error("Checkout is not paid.");
  if (session.currency?.toLowerCase() !== checkout.currency?.toLowerCase()) {
    throw new Error("Checkout currency mismatch.");
  }
  if (session.amount_subtotal !== checkout.amount_total) {
    throw new Error("Checkout amount mismatch.");
  }
}

module.exports = { assertCheckoutCompletable };
