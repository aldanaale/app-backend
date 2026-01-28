const fetchFn = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function run() {
  try {
    // login first
    const loginRes = await fetchFn("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ok@ejemplo.com", password: "123456" }),
    });
    const login = await loginRes.json();
    const token = login.token;
    if (!token)
      throw new Error("No token. Crea usuario ok@ejemplo.com primero.");

    const payload = {
      customer_name: "Ok",
      origin: "Santiago Centro",
      destination: "Ñuñoa",
      distance: 12,
      truck_id: null,
      loads: [
        { description: "Caja", blocks: 1 },
        { description: "Sofá", blocks: 6 },
      ],
    };

    const res = await fetchFn("http://localhost:3000/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Quote:", data);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

run();
