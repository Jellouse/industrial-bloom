const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

function decodeImageUpload(value = {}) {
  const filename = String(value.filename || "image").replace(/[^a-z0-9._ -]/gi, "").trim() || "image";
  const mimeType = String(value.type || "").toLowerCase();
  const match = String(value.data || "").match(/^data:([^;]+);base64,([a-z0-9+/]+={0,2})$/i);

  if (!IMAGE_TYPES.has(mimeType) || match?.[1].toLowerCase() !== mimeType) {
    throw new Error("Choose a JPEG, PNG, WebP, AVIF, or GIF image.");
  }

  const data = Buffer.from(match[2], "base64");
  if (!data.length || data.length > MAX_IMAGE_BYTES) throw new Error("Images must be smaller than 2 MB.");
  return { filename, mimeType, data };
}

module.exports = { decodeImageUpload, MAX_IMAGE_BYTES };
