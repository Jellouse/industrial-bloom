const crypto = require("crypto");

function isAdmin(request) {
  const expected = process.env.SHOP_ADMIN_TOKEN;
  const token = String(
    request.headers["x-shop-admin-token"]
      || request.headers.authorization
      || "",
  ).replace(/^Bearer\s+/i, "");
  if (!expected || !token) return false;

  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);
  return expectedBuffer.length === tokenBuffer.length && crypto.timingSafeEqual(expectedBuffer, tokenBuffer);
}

function requireAdmin(request, response) {
  if (isAdmin(request)) return true;
  response.status(401).json({ error: "Unauthorized" });
  return false;
}

module.exports = { requireAdmin };
