const assert = require("node:assert/strict");
const test = require("node:test");
const { assertCheckoutCompletable } = require("../lib/shop/checkout-state");

const checkout = {
  status: "pending",
  stripe_session_id: "cs_test_safe",
  amount_total: 7000,
  currency: "eur",
};

const session = {
  id: "cs_test_safe",
  payment_status: "paid",
  amount_subtotal: 7000,
  currency: "eur",
};

test("paid Stripe sessions complete only their matching pending checkout", () => {
  assert.doesNotThrow(() => assertCheckoutCompletable(checkout, session));
  assert.throws(
    () => assertCheckoutCompletable({ ...checkout, status: "failed" }, session),
    /not pending/i,
  );
  assert.throws(
    () => assertCheckoutCompletable(checkout, { ...session, id: "cs_test_other" }),
    /session mismatch/i,
  );
});

test("checkout completion rejects altered totals, currencies, and unpaid sessions", () => {
  assert.throws(
    () => assertCheckoutCompletable(checkout, { ...session, amount_subtotal: 1 }),
    /amount mismatch/i,
  );
  assert.throws(
    () => assertCheckoutCompletable(checkout, { ...session, currency: "usd" }),
    /currency mismatch/i,
  );
  assert.throws(
    () => assertCheckoutCompletable(checkout, { ...session, payment_status: "unpaid" }),
    /not paid/i,
  );
});
