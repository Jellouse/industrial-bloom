CREATE INDEX IF NOT EXISTS shop_checkouts_pending_expiry_idx
ON shop_checkouts (expires_at)
WHERE status = 'pending';
