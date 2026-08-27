const token = localStorage.getItem("shop-admin-token");
const loading = document.querySelector(".loading");
const handbook = document.querySelector(".handbook");
const error = document.querySelector(".error");

function money(cents, currency) {
  return new Intl.NumberFormat("en-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function renderProducts(products) {
  const list = document.querySelector(".product-snapshot");
  for (const product of products) {
    const row = document.createElement("article");
    const serials = product.serialNumbers.length ? product.serialNumbers.join(", ") : "Sold out";
    const values = [
      ["strong", product.name],
      ["span", money(product.priceCents, product.currency)],
      ["span", `${product.inventory} available`],
      ["span", `Serials: ${serials}`],
      ["span", product.active ? "Active" : "Hidden"],
    ];
    for (const [tag, value] of values) {
      const item = document.createElement(tag);
      item.textContent = value;
      row.append(item);
    }
    list.append(row);
  }
}

async function loadDocumentation() {
  if (!token) {
    window.location.replace("../");
    return;
  }

  try {
    const response = await fetch("/api/shop/admin/docs", {
      headers: { "X-Shop-Admin-Token": token },
    });
    if (response.status === 401) {
      localStorage.removeItem("shop-admin-token");
      window.location.replace("../");
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load documentation.");

    renderProducts(result.products);
    document.querySelector(".documentation").innerHTML = result.html;
    loading.hidden = true;
    handbook.hidden = false;
  } catch (problem) {
    loading.hidden = true;
    error.textContent = problem.message;
  }
}

loadDocumentation();
