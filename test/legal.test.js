const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { shippingAmountCents, shippingCountries, shippingCountryCodes } = require("../lib/shop/shipping");

const root = path.join(__dirname, "..");
const checkout = fs.readFileSync(path.join(root, "api/shop/checkout.js"), "utf8");
const pages = {
  impressum: fs.readFileSync(path.join(root, "website/impressum/index.html"), "utf8"),
  widerruf: fs.readFileSync(path.join(root, "website/widerruf/index.html"), "utf8"),
  versand: fs.readFileSync(path.join(root, "website/versand/index.html"), "utf8"),
  datenschutz: fs.readFileSync(path.join(root, "website/datenschutz/index.html"), "utf8"),
};

test("German legal stubs exist with the known business facts", () => {
  assert.match(pages.impressum, /Humansize/);
  assert.match(pages.impressum, /Bischof-Vieter-Straße 2/);
  assert.match(pages.impressum, /59379 Selm/);
  assert.match(pages.impressum, /DE464031324/);
  assert.match(pages.impressum, /worksurface\.co/);
  assert.doesNotMatch(pages.impressum, /\bHRB\b|Amtsgericht/i);
  assert.match(pages.widerruf, /14 Tagen/);
  assert.match(pages.datenschutz, /Brevo/);
  assert.match(pages.datenschutz, /Stripe/);
});

test("Versand and Stripe checkout share the same country list and tracked rate", () => {
  assert.equal(shippingAmountCents, 1200);
  assert.deepEqual(shippingCountryCodes(), [
    "DE", "AT", "BE", "CZ", "DK", "ES", "FI", "FR", "IE", "IT", "LU", "NL", "PL", "PT", "SE",
  ]);
  assert.match(checkout, /shippingCountryCodes\(\)/);
  assert.match(checkout, /shippingAmountCents/);
  assert.doesNotMatch(checkout, /allowed_countries:\s*\["/);
  for (const country of shippingCountries) {
    assert.match(pages.versand, new RegExp(country.de));
  }
  assert.match(pages.versand, /12/);
  assert.match(pages.versand, /3–7 Werktage/);
  for (const extra of ["JP", "GB", "US", "UK", "Japan"]) {
    assert.equal(shippingCountryCodes().includes(extra), false);
    assert.doesNotMatch(checkout, new RegExp(`"${extra}"`));
  }
});
