const Stripe = require("stripe");
const { setupDatabase } = require("../../lib/shop/database");
const { completeCheckout, expireCheckout } = require("../../lib/shop/checkout-lifecycle");

module.exports.config = { api: { bodyParser: false } };

async function rawBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).send("Method not allowed");
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return response.status(503).send("Stripe is not configured");
  }

  try {
    await setupDatabase();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await rawBody(request);
    const event = stripe.webhooks.constructEvent(
      body,
      request.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await completeCheckout(event.data.object);
    } else if (event.type === "checkout.session.expired") {
      await expireCheckout(event.data.object.metadata?.checkoutId);
    }

    return response.status(200).json({ received: true });
  } catch (error) {
    return response.status(400).send(`Webhook error: ${error.message}`);
  }
};
