const assert = require("node:assert/strict");
const test = require("node:test");
const { readJson, writeJson } = require("../website/shop/shop-storage");

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
    value: (key) => values.get(key),
  };
}

test("shop storage recovers from malformed or invalid cart data", () => {
  const local = storage({ broken: "{", array: "[]" });
  assert.deepEqual(readJson(local, "broken", {}), {});
  assert.equal(local.value("broken"), undefined);
  assert.deepEqual(readJson(local, "array", {}), {});
});

test("shop storage writes JSON and tolerates unavailable storage", () => {
  const local = storage();
  writeJson(local, "cart", { vase: 1 });
  assert.equal(local.value("cart"), '{"vase":1}');
  assert.doesNotThrow(() => writeJson({ setItem: () => { throw new Error("blocked"); } }, "cart", {}));
});
