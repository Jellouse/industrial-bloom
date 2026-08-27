const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const handbook = fs.readFileSync(path.join(root, "PROJECT.md"), "utf8");
const admin = fs.readFileSync(path.join(root, "website/shop/admin/index.html"), "utf8");
const docsPage = fs.readFileSync(path.join(root, "website/shop/admin/docs/index.html"), "utf8");
const docsClient = fs.readFileSync(path.join(root, "website/shop/admin/docs/docs.js"), "utf8");
const docsApi = fs.readFileSync(path.join(root, "api/shop/admin/docs.js"), "utf8");
const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));

test("the project handbook covers the operational system", () => {
  for (const heading of ["Products", "Storefront logic", "Serial inventory", "Database", "Deployment", "Known gaps"]) {
    assert.match(handbook, new RegExp(`## .*${heading}`, "i"));
  }
});

test("admin and handbook assets use root-absolute URLs", () => {
  assert.match(admin, /href="\/shop\/admin\/admin\.css\?v=\d+"/);
  assert.match(admin, /src="\/shop\/admin\/admin\.js\?v=\d+"/);
  assert.match(docsPage, /href="\/shop\/admin\/docs\/docs\.css\?v=\d+"/);
  assert.match(docsPage, /src="\/shop\/admin\/docs\/docs\.js\?v=\d+"/);
  assert.doesNotMatch(admin, /href="admin\.css|src="admin\.js/);
  assert.doesNotMatch(docsPage, /href="docs\.css|src="docs\.js/);
  assert.deepEqual(
    vercel.redirects,
    [{ source: "/shop/admin", destination: "/shop/admin/" }]
  );
});

test("admin links to a separate protected handbook page", () => {
  assert.match(admin, /href="docs\/">Project docs/);
  assert.match(docsPage, /class="documentation"/);
  assert.match(docsClient, /localStorage\.getItem\("shop-admin-token"\)/);
  assert.match(docsClient, /"X-Shop-Admin-Token": token/);
});

test("the handbook API authenticates and reads the canonical local file", () => {
  assert.match(docsApi, /requireAdmin\(request, response\)/);
  assert.match(docsApi, /PROJECT\.md/);
  assert.match(docsApi, /Cache-Control", "no-store"/);
});
