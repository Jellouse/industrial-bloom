const assert = require("node:assert/strict");
const { readFileSync, readdirSync } = require("node:fs");
const test = require("node:test");

const html = readFileSync("website/kit/index.html", "utf8");
const script = readFileSync("website/kit/kit.js", "utf8");

test("curated products use unique direct Amazon links", () => {
  const asins = [...script.matchAll(/asin: "([A-Z0-9]{10})"/g)].map((match) => match[1]);

  assert.equal(asins.length, 7);
  assert.equal(new Set(asins).size, asins.length);
  assert.match(script, /amazon\.de\/dp\/\$\{asin\}\/ref=nosim/);
  assert.doesNotMatch(script, /amazon\.de\/s|query:/);
});

test("affiliate attribution and disclosure are ready", () => {
  assert.match(script, /const AMAZON_TAG = "";/);
  assert.match(script, /searchParams\.set\("tag", AMAZON_TAG\)/);
  assert.match(script, /rel="sponsored noopener noreferrer"/);
  assert.match(html, /Als Amazon-Partner verdiene ich an qualifizierten Verkäufen\./);
});

test("every kit image is used", () => {
  const images = readdirSync("website/kit/images").filter((name) => name.endsWith(".jpg"));

  for (const image of images) assert.match(script, new RegExp(`images/${image}`));
});
