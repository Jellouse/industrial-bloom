const { Pool } = require("@neondatabase/serverless");

const TYPE_28_COVER = "/assets/shop/technical/type-28.png";
const WORKSHOP_IMAGE_ID = "f00d8bc6-972c-4c88-9bbe-8652b66e5f13";

async function alignCountedShelf(pool) {
  await pool.query(
    `UPDATE shop_products
     SET edition_size = 2, updated_at = NOW()
     WHERE id = 'column-vase'`,
  );

  await pool.query(
    `UPDATE shop_products
     SET available_serials = CASE
           WHEN edition_size > 2 THEN ARRAY[1, 2]
           ELSE available_serials
         END,
         inventory = CASE
           WHEN edition_size > 2 THEN 2
           ELSE inventory
         END,
         edition_size = 2,
         updated_at = NOW()
     WHERE id = 'round-vase'`,
  );

  await pool.query(
    `UPDATE shop_products
     SET image_url = $1,
         gallery_images = ARRAY[$1],
         updated_at = NOW()
     WHERE id = '28' AND image_url LIKE '%' || $2 || '%'`,
    [TYPE_28_COVER, WORKSHOP_IMAGE_ID],
  );
}

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");

  const pool = new Pool({ connectionString });
  try {
    await alignCountedShelf(pool);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { TYPE_28_COVER, WORKSHOP_IMAGE_ID, alignCountedShelf };
