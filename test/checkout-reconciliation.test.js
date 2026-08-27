const assert = require("node:assert/strict");
const test = require("node:test");
const { reconciliationAction } = require("../lib/shop/checkout-reconciliation");

test("expired checkout reconciliation restores only confirmed dead sessions", () => {
  assert.equal(reconciliationAction({ stripe_session_id: null }), "expire");
  assert.equal(
    reconciliationAction({ stripe_session_id: "cs_old" }, null, { code: "resource_missing" }),
    "expire",
  );
  assert.equal(
    reconciliationAction({ stripe_session_id: "cs_expired" }, { status: "expired" }),
    "expire",
  );
});

test("reconciliation preserves live and unresolved payments", () => {
  const checkout = { stripe_session_id: "cs_live" };
  assert.equal(reconciliationAction(checkout, { status: "open", payment_status: "unpaid" }), null);
  assert.equal(reconciliationAction(checkout, { status: "complete", payment_status: "unpaid" }), null);
  assert.equal(reconciliationAction(checkout, null, { code: "api_connection_error" }), null);
  assert.equal(
    reconciliationAction(checkout, { status: "complete", payment_status: "paid" }),
    "complete",
  );
});
