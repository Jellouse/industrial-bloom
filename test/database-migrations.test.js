const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const database = fs.readFileSync(path.join(root, "lib/shop/database.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "db/migrations/001_initial.sql"), "utf8");
const reconciliationMigration = fs.readFileSync(
  path.join(root, "db/migrations/002_checkout_reconciliation.sql"),
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
