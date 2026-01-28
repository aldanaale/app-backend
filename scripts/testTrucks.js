require("dotenv").config();
const knex = require("knex")({
  client: "pg",
  connection: process.env.DATABASE_URL,
});
const fetchFn = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function run() {
  const email = `truck_${Date.now()}@example.com`;
  const password = "Aa123456!";
  let ok = true;
  try {
    await fetchFn("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "TruckUser" }),
    });
    await knex("users").where({ email }).update({ role: "admin" });
    const login = await fetchFn("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await login.json();
    const token = j.token;
    if (!token) ok = false;

    const list = await fetchFn("http://localhost:3000/trucks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (list.status !== 200) ok = false;

    const created = await fetchFn("http://localhost:3000/trucks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "Temporal", type: "TMP", capacity: 50 }),
    });
    if (created.status !== 201) ok = false;
    const cj = await created.json();

    const updated = await fetchFn(`http://localhost:3000/trucks/${cj.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "Temporal 2", type: "TMP", capacity: 55 }),
    });
    if (updated.status !== 200) ok = false;

    const deleted = await fetchFn(`http://localhost:3000/trucks/${cj.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (deleted.status !== 200) ok = false;
  } catch {
    ok = false;
  } finally {
    await knex.destroy();
  }

  if (!ok) {
    console.log("Trucks integration test: FAIL");
    process.exit(1);
  } else {
    console.log("Trucks integration test: OK");
  }
}

run();
