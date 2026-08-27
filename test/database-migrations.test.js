const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const database = fs.readFileSync(path.join(root, "lib/shop/database.js"), "utf8");
const seed = fs.readFileSync(path.join(root, "scripts/seed-shop.js"), "utf8");
const align = fs.readFileSync(path.join(root, "scripts/align-counted-shelf.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "db/migrations/001_initial.sql"), "utf8");
const reconciliationMigration = fs.readFileSync(
  path.join(root, "db/migrations/002_checkout_reconciliation.sql"),
  "utf8",
);
const countedShelfMigration = fs.readFileSync(
  path.join(root, "db/migrations/003_counted_shelf_and_type28.sql"),
  "utf8",
);

test("database schema changes live in versioned migrations, not request startup", () => {
  assert.doesNotMatch(database, /CREATE TABLE|ALTER TABLE|seedProducts/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS shop_products/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS shop_cart_reservations/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS shop_checkouts/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS shop_orders/);
  assert.match(reconciliationMigration, /shop_checkouts_pending_expiry_idx/);
});

test("counted-shelf alignment can run through migrate, seed, or the data script", () => {
  assert.match(countedShelfMigration, /WHERE id = 'column-vase'/);
  assert.match(countedShelfMigration, /edition_size = 2/);
  assert.match(countedShelfMigration, /WHERE id = 'round-vase'/);
  assert.match(countedShelfMigration, /ARRAY\[1, 2\]/);
  assert.match(countedShelfMigration, /type-28\.png/);
  assert.doesNotMatch(countedShelfMigration, /thorn-vase/);
  assert.match(seed, /alignCountedShelf/);
  assert.match(align, /WHERE id = 'column-vase'/);
  assert.match(align, /WHERE id = 'round-vase'/);
  assert.match(align, /f00d8bc6-972c-4c88-9bbe-8652b66e5f13/);
  assert.doesNotMatch(align, /thorn-vase/);
});
