const test = require("node:test");
const assert = require("node:assert/strict");
const { decodeImageUpload, MAX_IMAGE_BYTES } = require("../lib/shop/images");

test("image uploads accept small supported data URLs", () => {
  const image = decodeImageUpload({
    filename: "vase?.png",
    type: "image/png",
    data: `data:image/png;base64,${Buffer.from("image").toString("base64")}`,
  });
  assert.equal(image.filename, "vase.png");
  assert.equal(image.mimeType, "image/png");
  assert.equal(image.data.toString(), "image");
});

test("image uploads reject unsupported and oversized files", () => {
  assert.throws(() => decodeImageUpload({ type: "image/svg+xml", data: "data:image/svg+xml;base64,PHN2Zz4=" }), /choose/i);
  const oversized = Buffer.alloc(MAX_IMAGE_BYTES + 1).toString("base64");
  assert.throws(() => decodeImageUpload({ type: "image/jpeg", data: `data:image/jpeg;base64,${oversized}` }), /smaller/i);
});
