const test = require("node:test");
const assert = require("node:assert/strict");
const { products } = require("../lib/shop/catalog");
const { metadataForProduct } = require("../lib/shop/product-metadata");
const { normalizeCart } = require("../lib/shop/helpers");
const { requireAdmin } = require("../lib/shop/auth");
const { parseSerialNumbers } = require("../lib/shop/serials");
const {
  normalizeReservationCart,
  normalizeVisitorId,
  reservationsByProduct,
} = require("../lib/shop/reservations");

test("mock catalog has unique, purchasable products", () => {
  assert.equal(products.length, 4);
  assert.equal(new Set(products.map((product) => product.id)).size, products.length);
  assert.ok(products.every((product) => product.priceCents > 0 && product.inventory === product.serialNumbers.length));
});

test("catalog uses product numbers as names", () => {
  assert.deepEqual(products.map((product) => product.name), ["660", "120", "490", "28"]);
});

test("fallback catalog uses the launch prices", () => {
  assert.deepEqual(Object.fromEntries(products.map((product) => [product.name, product.priceCents])), {
    660: 7000,
    120: 15000,
    490: 25000,
    28: 5500,
  });
});

test("counted shelf editions match two assembled 120 and 490 pieces", () => {
  const byId = Object.fromEntries(products.map((product) => [product.id, product]));
  assert.deepEqual(byId["column-vase"].serialNumbers, [1, 2]);
  assert.equal(byId["column-vase"].editionSize, 2);
  assert.deepEqual(byId["round-vase"].serialNumbers, [1, 2]);
  assert.equal(byId["round-vase"].editionSize, 2);
  assert.deepEqual(byId["thorn-vase"].serialNumbers, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(byId["thorn-vase"].editionSize, 8);
});

test("Type 28 fallback cover is the technical drawing, not the workshop photo", () => {
  const type28 = products.find((product) => product.id === "28");
  assert.equal(type28.imageUrl, "/assets/shop/technical/type-28.png");
  assert.deepEqual(type28.galleryImages, ["/assets/shop/technical/type-28.png"]);
  assert.doesNotMatch(JSON.stringify(type28), /f00d8bc6-972c-4c88-9bbe-8652b66e5f13/);
});

test("technical product metadata has one backend-owned source", () => {
  assert.equal(products[0].technical, metadataForProduct("thorn-vase").technical);
  assert.equal(metadataForProduct("28").technical.height, "250 mm");
  assert.match(metadataForProduct("round-vase").technical.imageUrl, /type-490\.png/);
});

test("serial-number input accepts lists and ranges in ascending unique order", () => {
  assert.deepEqual(parseSerialNumbers("5, 1-3, 3"), [1, 2, 3, 5]);
  assert.deepEqual(parseSerialNumbers(""), []);
  assert.throws(() => parseSerialNumbers("3-1"), /invalid/i);
});

test("cart normalization merges duplicate line items", () => {
  assert.deepEqual(
    normalizeCart([
      { productId: "thorn-vase", quantity: 1 },
      { productId: "thorn-vase", quantity: 2 },
    ]),
    [{ productId: "thorn-vase", quantity: 3 }],
  );
});

test("cart normalization rejects empty or invalid carts", () => {
  assert.throws(() => normalizeCart([]), /empty/i);
  assert.throws(() => normalizeCart([{ productId: "thorn-vase", quantity: 0 }]), /invalid/i);
  assert.throws(() => normalizeCart([{ productId: "thorn-vase", quantity: 11 }]), /invalid/i);
});

test("cart reservations accept empty carts and validate visitor sessions", () => {
  assert.deepEqual(normalizeReservationCart([]), []);
  assert.deepEqual(
    normalizeReservationCart([{ productId: "thorn-vase", quantity: 2 }]),
    [{ productId: "thorn-vase", quantity: 2 }],
  );
  assert.equal(normalizeVisitorId("visitor_1234567890"), "visitor_1234567890");
  assert.throws(() => normalizeVisitorId("short"), /session/i);
});

test("public inventory hides reservations belonging to other visitors", () => {
  const held = reservationsByProduct([
    { visitor_id: "current", product_id: "vase", serial_numbers: [1] },
    { visitor_id: "other", product_id: "vase", serial_numbers: [2, 3] },
  ], "current");
  assert.deepEqual([...held.get("vase")], [2, 3]);
});

test("admin authentication accepts the dedicated shop token header", () => {
  const previousToken = process.env.SHOP_ADMIN_TOKEN;
  process.env.SHOP_ADMIN_TOKEN = "test-token";
  const response = { status: () => response, json: () => {} };
  assert.equal(requireAdmin({ headers: { "x-shop-admin-token": "test-token" } }, response), true);
  if (previousToken === undefined) delete process.env.SHOP_ADMIN_TOKEN;
  else process.env.SHOP_ADMIN_TOKEN = previousToken;
});
