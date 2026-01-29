require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("../src/db");

async function run() {
  const email = process.argv[2];
  const newPass = process.argv[3];
  if (!email || !newPass) {
    console.error("Uso: node scripts/changePassword.js <email> <nueva_contraseña>");
    process.exit(1);
  }
  // Simple complexity check to evitar contraseñas débiles por accidente
  const isComplex =
    typeof newPass === "string" &&
    newPass.length >= 8 &&
    /[A-Z]/.test(newPass) &&
    /[a-z]/.test(newPass) &&
    /[0-9]/.test(newPass) &&
    /[^A-Za-z0-9]/.test(newPass);
  if (!isComplex) {
    console.error("La nueva contraseña no cumple complejidad mínima (8+, mayúscula, minúscula, número y símbolo).");
    process.exit(1);
  }
  try {
    const u = await db("users").where({ email }).first();
    if (!u) {
      console.error("Usuario no encontrado:", email);
      process.exit(1);
    }
    const hashed = await bcrypt.hash(newPass, 10);
    await db("users").where({ id: u.id }).update({ password: hashed });
    console.log("Contraseña actualizada para:", email);
  } catch (e) {
    console.error("Error cambiando contraseña:", e && e.message ? e.message : String(e));
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();
