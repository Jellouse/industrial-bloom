const { getPool, setupDatabase } = require("../../lib/shop/database");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).end();
  }

  try {
    if (!(await setupDatabase())) return response.status(404).end();
    const id = String(request.query.id || "");
    const result = await getPool().query("SELECT mime_type, data FROM shop_images WHERE id = $1", [id]);
    if (!result.rowCount) return response.status(404).end();
    response.setHeader("Content-Type", result.rows[0].mime_type);
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return response.status(200).send(result.rows[0].data);
  } catch {
    return response.status(500).end();
  }
};
