const { serialRange } = require("./serials");

function availableSerialNumbers(product) {
  return product.available_serials || serialRange(product.inventory);
}

async function restoreSerialNumbers(db, item) {
  if (!item.serialNumbers?.length) return;
  await db.query(
    `WITH restored AS (
       SELECT id,
         ARRAY(
           SELECT DISTINCT serial
           FROM unnest(COALESCE(available_serials, '{}') || $1::integer[]) serial
           ORDER BY serial
         ) serials
       FROM shop_products
       WHERE id = $2
     )
     UPDATE shop_products product
     SET available_serials = restored.serials,
         inventory = cardinality(restored.serials),
         updated_at = NOW()
     FROM restored
     WHERE product.id = restored.id`,
    [item.serialNumbers, item.productId],
  );
}

module.exports = { availableSerialNumbers, restoreSerialNumbers };
