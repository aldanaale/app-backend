require("dotenv").config();
const knex = require("knex")({
  client: "pg",
  connection: process.env.DATABASE_URL,
});
const fetchFn = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function run() {
  let ok = true;
  const email = `rb_${Date.now()}@example.com`;
  const password = "Aa123456!";
  try {
    await fetchFn("http://localhost:3000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "RBACUser" }),
    });
    const loginUser = await fetchFn("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const ju = await loginUser.json();
    const tokenUser = ju.token;
    const createDenied = await fetchFn("http://localhost:3000/trucks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUser}`,
      },
      body: JSON.stringify({ name: "NoAdmin", type: "X", capacity: 10 }),
    });
    if (createDenied.status !== 403) ok = false;

    await knex("users").where({ email }).update({ role: "admin" });

    const loginAdmin = await fetchFn("http://localhost:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const ja = await loginAdmin.json();
    const tokenAdmin = ja.token;
    const createOk = await fetchFn("http://localhost:3000/trucks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ name: "AdminTruck", type: "ADM", capacity: 70 }),
    });
    if (createOk.status !== 201) ok = false;
  } catch {
    ok = false;
  } finally {
    await knex.destroy();
  }

  if (!ok) {
    console.log("RBAC integration test: FAIL");
    process.exit(1);
  } else {
    console.log("RBAC integration test: OK");
  }
}

run();
