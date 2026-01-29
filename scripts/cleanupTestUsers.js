require("dotenv").config();
const db = require("../src/db");

async function cleanup() {
  try {
    const patterns = [
      "adm_%@example.com",
      "rb_%@example.com",
      "utest_%@example.com",
      "itest_%@example.com",
      "usr_%@example.com",
    ];
    const ids = [];
    for (const p of patterns) {
      const rows = await db("users").select("id").where("email", "like", p);
      ids.push(...rows.map((r) => r.id));
    }
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) {
      console.log("No se encontraron usuarios de pruebas para limpiar.");
      return;
    }
    await db("refresh_tokens").whereIn("user_id", uniqueIds).del();
    await db("users").whereIn("id", uniqueIds).del();
    console.log(`Eliminados ${uniqueIds.length} usuarios de pruebas (incluye posibles admins).`);
  } catch (e) {
    console.error("Error limpiando usuarios de pruebas:", e && e.message ? e.message : String(e));
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

cleanup();
