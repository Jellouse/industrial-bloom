const productMetadata = {
  "thorn-vase": {
    technical: {
      type: "660",
      height: "200 mm",
      profile: "60 × 60 mm extrusion",
      imageUrl: "/assets/shop/technical/type-660.png?v=8",
    },
  },
  "column-vase": {
    technical: {
      type: "120",
      height: "250 mm",
      profile: "120 × 120 mm · 45° corners · Ø87 core",
      imageUrl: "/assets/shop/technical/type-120.png?v=8",
    },
  },
  "round-vase": {
    technical: {
      type: "490",
      height: "250 mm",
      profile: "4 × 90° quarter extrusions · Ø80 mm assembled",
      imageUrl: "/assets/shop/technical/type-490.png?v=8",
    },
  },
  28: {
    technical: {
      type: "28",
      height: "250 mm",
      profile: "Ø28 mm round extrusion",
      imageUrl: "/assets/shop/technical/type-28.png?v=8",
    },
  },
};

function metadataForProduct(id) {
  return productMetadata[id] || {};
}

module.exports = { metadataForProduct, productMetadata };
