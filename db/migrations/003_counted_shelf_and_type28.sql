UPDATE shop_products
SET edition_size = 2,
    updated_at = NOW()
WHERE id = 'column-vase';

UPDATE shop_products
SET edition_size = 2,
    available_serials = ARRAY[1, 2],
    inventory = 2,
    updated_at = NOW()
WHERE id = 'round-vase';

UPDATE shop_products
SET image_url = '/assets/shop/technical/type-28.png',
    gallery_images = ARRAY['/assets/shop/technical/type-28.png'],
    updated_at = NOW()
WHERE id = '28';
