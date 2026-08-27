(function createShopStorage(global) {
  function readJson(storage, key, fallback) {
    try {
      const value = JSON.parse(storage.getItem(key) || "null");
      return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
    } catch {
      storage.removeItem(key);
      return fallback;
    }
  }

  function writeJson(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // The cart remains usable for this page when storage is unavailable.
    }
  }

  const api = { readJson, writeJson };
  global.ShopStorage = api;
  if (typeof module !== "undefined") module.exports = api;
}(typeof window === "undefined" ? globalThis : window));
