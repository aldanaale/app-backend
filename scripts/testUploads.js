const fetchFn = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const FormData = require("form-data");

async function run() {
  const base = "http://localhost:3000";
  const email = `utest_${Date.now()}@example.com`;
  const password = "Aa123456!";
  try {
    await fetchFn(`${base}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "UploadTest" }),
    });
    const login = await fetchFn(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (login.status !== 200) {
      console.error("Login failed:", login.status);
      process.exit(1);
    }
    const j = await login.json();
    const token = j.token;
    const fd = new FormData();
    const csv = "nombre,cantidad\nSofa,2\nCaja,10\nTv,1\n";
    fd.append("files", Buffer.from(csv, "utf8"), {
      filename: "inventario.csv",
      contentType: "text/csv",
    });
    fd.append("title", "Inventario de prueba");
    fd.append("note", "Subida automática para validar heurísticas");
    const up = await fetchFn(`${base}/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const upJson = await up.json();
    if (up.status !== 201) {
      console.error("Upload failed:", up.status, upJson);
      process.exit(1);
    }
    const id = upJson[0]?.id;
    const list = await fetchFn(`${base}/uploads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const items = await list.json();
    const found = items.find((it) => it.id === id);
    console.log("Uploaded item:", found);
    const insights = await fetchFn(`${base}/uploads/${id}/insights`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ins = await insights.json();
    console.log("Insights:", ins);
    if (
      ins?.ai_status !== "done" ||
      !Array.isArray(ins?.ai_tags) ||
      ins.ai_tags.indexOf("inventario") === -1
    ) {
      console.error("Insights not as expected");
      process.exit(1);
    }
    console.log("Upload integration test: OK");
  } catch (e) {
    console.error("Test error:", e && e.message ? e.message : String(e));
    process.exit(1);
  }
}

run();
