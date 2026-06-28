const BREVO_URL = "https://api.brevo.com/v3/contacts";

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const email = String(request.body?.email || "").trim().toLowerCase();
  if (!isEmail(email)) {
    return response.status(400).json({ error: "Enter a valid email." });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);

  if (!apiKey) {
    return response.status(500).json({ error: "Missing BREVO_API_KEY" });
  }

  if (!Number.isInteger(listId)) {
    return response.status(500).json({ error: "Missing BREVO_LIST_ID" });
  }

  const brevoResponse = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
    }),
  });

  if (!brevoResponse.ok) {
    const details = await brevoResponse.text();
    return response.status(502).json({ error: "Could not subscribe.", details });
  }

  return response.status(200).json({ ok: true });
};
