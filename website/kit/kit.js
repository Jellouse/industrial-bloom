// Add the tracking ID from Amazon PartnerNet here, for example: "example-21".
const AMAZON_TAG = "";

const products = [
  {
    maker: "Osprey",
    name: "Sportlite 25",
    image: "images/osprey-sportlite-25.jpg",
    asin: "B09JXPBSB5",
    description: "A light day pack with just enough structure: 25 litres, a ventilated back panel and no surplus hardware. The useful middle ground between a city bag and expedition gear.",
    tags: ["Carry", "Field"],
  },
  {
    maker: "Samsung",
    name: "T7 Shield, 2 TB",
    image: "images/samsung-t7-shield.jpg",
    asin: "B09S9N4T6K",
    description: "Fast solid-state storage inside a compact rubber shell. IP65 resistance and a restrained form make it a dependable working archive for travel, studio and field use.",
    tags: ["Store", "Tech"],
  },
  {
    maker: "Audio-Technica",
    name: "Sound Burger AT-SB727",
    image: "images/audio-technica-sound-burger.jpg",
    asin: "B0C3VSFMWW",
    description: "The 1983 portable turntable returned with Bluetooth and USB-C. A precise piece of product character that turns listening into a deliberate, movable ritual.",
    tags: ["Listen", "Home"],
  },
  {
    maker: "Leatherman",
    name: "Signal",
    image: "images/leatherman-signal.jpg",
    asin: "B0777HG5ZB",
    description: "Nineteen useful tools folded into one legible object, including pliers, bit driver, saw and sharpener. More capable than a pocket knife without feeling like a toolbox.",
    tags: ["Repair", "Field"],
  },
  {
    maker: "Fisher",
    name: "Space Pen Bullet",
    image: "images/fisher-space-pen.jpg",
    asin: "B0002ZQB4M",
    description: "A sealed, pressurised cartridge that writes at awkward angles and in difficult conditions. Closed, it disappears into a pocket; posted, it becomes a full-size pen.",
    tags: ["Record", "Tool"],
  },
  {
    maker: "Twelve South",
    name: "AirFly Pro 2",
    image: "images/airfly-pro.jpg",
    asin: "B0F3QZYBM7",
    description: "A small Bluetooth bridge for old audio hardware: aeroplane screens, gym equipment, cars and home stereos. One clear adapter instead of replacing everything around it.",
    tags: ["Connect", "Travel"],
  },
  {
    maker: "Kai",
    name: "N5210 Scissors",
    image: "images/kai-scissors.jpg",
    asin: "B004MN72VG",
    description: "Japanese stainless blades with large, soft handles and a clean industrial profile. A daily cutting tool that feels accurate without becoming precious.",
    tags: ["Cut", "Studio"],
  },
];

function amazonUrl(asin) {
  const url = new URL(`https://www.amazon.de/dp/${asin}/ref=nosim`);
  if (AMAZON_TAG) url.searchParams.set("tag", AMAZON_TAG);
  return url.toString();
}

const grid = document.querySelector(".product-grid");

for (const product of products) {
  const article = document.createElement("article");
  article.className = "product";
  article.innerHTML = `
    <a class="product-link" href="${amazonUrl(product.asin)}" target="_blank" rel="sponsored noopener noreferrer">
      <div class="product-image">
        <img src="${product.image}" alt="${product.maker} ${product.name}" loading="lazy" decoding="async">
      </div>
      <div class="product-meta">
        <span class="maker">${product.maker}</span>
        <strong>${product.name}</strong>
        <span class="shop">Amazon ↗<small>Affiliate link</small></span>
      </div>
      <p class="description">${product.description}</p>
      <div class="tags">
        ${product.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        <span class="tag">Shop ↗</span>
      </div>
    </a>
  `;
  grid.append(article);
}
