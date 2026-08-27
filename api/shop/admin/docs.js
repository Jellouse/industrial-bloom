const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it");
const { requireAdmin } = require("../../../lib/shop/auth");
const { getPool, mapProduct, setupDatabase } = require("../../../lib/shop/database");

const markdown = new MarkdownIt({ html: false, linkify: true });

module.exports = async function handler(request, response) {
  if (!requireAdmin(request, response)) return;
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const source = fs.readFileSync(path.join(__dirname, "../../../PROJECT.md"), "utf8");
    const configured = await setupDatabase();
    const products = configured
      ? (await getPool().query("SELECT * FROM shop_products ORDER BY created_at, name")).rows.map(mapProduct)
      : [];

    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json({ html: markdown.render(source), products });
  } catch (error) {
    return response.status(500).json({ error: "Could not load project documentation." });
  }
};
