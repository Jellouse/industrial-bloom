const { requireAdmin } = require("../../../lib/shop/auth");
const { getPool, mapProduct, setupDatabase } = require("../../../lib/shop/database");
const { parseSerialNumbers } = require("../../../lib/shop/serials");

function cleanProduct(value) {
  const product = {
    id: String(value.id || value.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    slug: String(value.slug || value.id || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: String(value.name || "").trim(),
    description: String(value.description || "").trim(),
    priceCents: Number(value.priceCents),
    currency: String(value.currency || "eur").trim().toLowerCase(),
    imageUrl: String(value.imageUrl || "").trim(),
    galleryImages: [...new Set((Array.isArray(value.galleryImages) ? value.galleryImages : [])
      .map((image) => String(image).trim()).filter(Boolean))],
    serialNumbers: parseSerialNumbers(value.serialNumbers),
    active: value.active !== false,
  };

  if (!product.id || !product.slug || !product.name) throw new Error("Name and slug are required.");
  if (!Number.isInteger(product.priceCents) || product.priceCents < 0) throw new Error("Invalid price.");
  if (!product.galleryImages.length && product.imageUrl) product.galleryImages = [product.imageUrl];
  product.imageUrl = product.galleryImages[0] || product.imageUrl;
  return product;
}

module.exports = async function handler(request, response) {
  if (!requireAdmin(request, response)) return;

  try {
    if (!(await setupDatabase())) {
      return response.status(503).json({ error: "Database is not configured." });
    }

    const db = getPool();
    if (request.method === "GET") {
      const result = await db.query("SELECT * FROM shop_products ORDER BY created_at, name");
      return response.status(200).json({ products: result.rows.map(mapProduct) });
    }

    if (request.method === "POST") {
      const product = cleanProduct(request.body || {});
      const result = await db.query(
        `INSERT INTO shop_products
          (id, slug, name, description, price_cents, currency, image_url, gallery_images,
           inventory, available_serials, edition_size, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price_cents = EXCLUDED.price_cents,
           currency = EXCLUDED.currency,
           image_url = EXCLUDED.image_url,
           gallery_images = EXCLUDED.gallery_images,
           inventory = EXCLUDED.inventory,
           available_serials = EXCLUDED.available_serials,
           edition_size = GREATEST(shop_products.edition_size, EXCLUDED.edition_size),
           active = EXCLUDED.active,
           updated_at = NOW()
         RETURNING *`,
        [
          product.id,
          product.slug,
          product.name,
          product.description,
          product.priceCents,
          product.currency,
          product.imageUrl,
          product.galleryImages,
          product.serialNumbers.length,
          product.serialNumbers,
          Math.max(0, ...product.serialNumbers),
          product.active,
        ],
      );
      return response.status(200).json({ product: mapProduct(result.rows[0]) });
    }

    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const status = /required|invalid/i.test(error.message) ? 400 : 500;
    return response.status(status).json({ error: status === 400 ? error.message : "Could not save product." });
  }
};
