const { Pool } = require("@neondatabase/serverless");
const { products } = require("../lib/shop/catalog");
const { serialRange } = require("../lib/shop/serials");

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

async function seed() {
  const pool = new Pool({ connectionString });
  try {
    for (const product of products) {
      await pool.query(
        `INSERT INTO shop_products
          (id, slug, name, description, price_cents, currency, image_url, gallery_images,
           inventory, available_serials, edition_size, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [
          product.id,
          product.slug,
          product.name,
          product.description,
          product.priceCents,
          product.currency,
          product.imageUrl,
          product.galleryImages || [product.imageUrl],
          product.inventory,
          product.serialNumbers || serialRange(product.inventory),
          product.editionSize || product.inventory,
          product.active,
        ],
      );
    }
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
