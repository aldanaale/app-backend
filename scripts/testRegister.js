const fetchFn = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function run() {
  try {
    const res = await fetchFn("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "ok@ejemplo.com",
        password: "123456",
        name: "Ok",
      }),
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

run();
