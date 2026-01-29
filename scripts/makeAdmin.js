require("dotenv").config();
const db = require("../src/db");

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: node scripts/makeAdmin.js <email>");
    process.exit(1);
  }
  try {
    const u = await db("users").where({ email }).first();
    if (!u) {
      console.error("Usuario no encontrado:", email);
      process.exit(1);
    }
    await db("users").where({ id: u.id }).update({ role: "admin" });
    const updated = await db("users")
      .where({ id: u.id })
      .select("id", "email", "name", "role")
      .first();
    console.log("Usuario promovido a admin:", updated);
  } catch (e) {
    console.error("Error promoviendo usuario:", e && e.message ? e.message : String(e));
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();
