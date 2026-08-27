const crypto = require("crypto");
const { requireAdmin } = require("../../../lib/shop/auth");
const { getPool, setupDatabase } = require("../../../lib/shop/database");
const { decodeImageUpload } = require("../../../lib/shop/images");

module.exports = async function handler(request, response) {
  if (!requireAdmin(request, response)) return;

  try {
    if (!(await setupDatabase())) return response.status(503).json({ error: "Database is not configured." });
    const db = getPool();

    if (request.method === "GET") {
      const result = await db.query(
        "SELECT id, filename, mime_type, created_at FROM shop_images ORDER BY created_at DESC",
      );
      return response.status(200).json({
        images: result.rows.map((image) => ({
          id: image.id,
          filename: image.filename,
          type: image.mime_type,
          createdAt: image.created_at,
          url: `/api/shop/image?id=${encodeURIComponent(image.id)}`,
        })),
      });
    }

    if (request.method === "POST") {
      const image = decodeImageUpload(request.body);
      const id = crypto.randomUUID();
      await db.query(
        "INSERT INTO shop_images (id, filename, mime_type, data) VALUES ($1, $2, $3, $4)",
        [id, image.filename, image.mimeType, image.data],
      );
      return response.status(201).json({
        image: { id, filename: image.filename, type: image.mimeType, url: `/api/shop/image?id=${id}` },
      });
    }

    if (request.method === "DELETE") {
      const id = String(request.body?.id || "");
      const url = `/api/shop/image?id=${encodeURIComponent(id)}`;
      const used = await db.query(
        "SELECT 1 FROM shop_products WHERE image_url = $1 OR $1 = ANY(gallery_images) LIMIT 1",
        [url],
      );
      if (used.rowCount) return response.status(409).json({ error: "This image is assigned to a product." });
      await db.query("DELETE FROM shop_images WHERE id = $1", [id]);
      return response.status(200).json({ deleted: true });
    }

    response.setHeader("Allow", "GET, POST, DELETE");
    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const status = /choose|smaller/i.test(error.message) ? 400 : 500;
    return response.status(status).json({ error: status === 400 ? error.message : "Could not manage images." });
  }
};
