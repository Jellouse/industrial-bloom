const assert = require("node:assert/strict");
const test = require("node:test");
const { restoreSerialNumbers } = require("../lib/shop/inventory");

test("serial restoration reads and updates the selected product atomically", async () => {
  let query;
  await restoreSerialNumbers(
    { query: async (text, values) => { query = { text, values }; } },
    { productId: "thorn-vase", serialNumbers: [2, 3] },
  );

  assert.match(query.text, /FROM shop_products[\s\S]*WHERE id = \$2/);
  assert.match(query.text, /COALESCE\(available_serials, '\{\}'\)/);
  assert.deepEqual(query.values, [[2, 3], "thorn-vase"]);
});
