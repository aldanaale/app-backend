require("dotenv").config();
const knex = require("knex")({
  client: "pg",
  connection: process.env.DATABASE_URL,
});
const fetchFn = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function run() {
  let ok = true;
  const emailAdmin = `adm_${Date.now()}@example.com`;
  const emailUser = `usr_${Date.now()}@example.com`;
  const password = "Aa123456!";
  try {
    await fetchFn("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailAdmin, password, name: "Admin" }),
    });
    await knex("users").where({ email: emailAdmin }).update({ role: "admin" });
    const la = await fetchFn("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailAdmin, password }),
    });
    const ja = await la.json();
    const tokenAdmin = ja.token;
    await fetchFn("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailUser, password, name: "User" }),
    });
    const userRow = await knex("users").where({ email: emailUser }).first();
    const resp = await fetchFn(
      `http://localhost:3000/admin/users/${userRow.id}/role`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenAdmin}`,
        },
        body: JSON.stringify({ role: "admin" }),
      },
    );
    if (resp.status !== 200) ok = false;
    const jr = await resp.json();
    if (jr.role !== "admin") ok = false;
  } catch {
    ok = false;
  } finally {
    await knex.destroy();
  }
  if (!ok) {
    console.log("Admin endpoint test: FAIL");
    process.exit(1);
  } else {
    console.log("Admin endpoint test: OK");
  }
}

run();
