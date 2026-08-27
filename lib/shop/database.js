const { Pool } = require("@neondatabase/serverless");
const { metadataForProduct } = require("./product-metadata");
const { serialRange } = require("./serials");

let pool;

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL });
  }
  return pool;
}

async function setupDatabase() {
  return hasDatabase();
}

function mapProduct(row) {
  const serialNumbers = row.available_serials || serialRange(row.inventory);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    imageUrl: row.image_url,
    galleryImages: row.gallery_images?.length ? row.gallery_images : [row.image_url],
    inventory: serialNumbers.length,
    serialNumbers,
    editionSize: row.edition_size || Math.max(0, ...serialNumbers),
    active: row.active,
    ...metadataForProduct(row.id),
  };
}

module.exports = { getPool, hasDatabase, mapProduct, setupDatabase };
