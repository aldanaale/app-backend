require("dotenv").config();
const knex = require("knex")({
  client: "pg",
  connection: process.env.DATABASE_URL,
});

async function run() {
  try {
    const idxRes = await knex.raw(`
      SELECT
        to_regclass('public.idx_quotes_user_id') AS idx_quotes_user_id,
        to_regclass('public.idx_loads_quote_id') AS idx_loads_quote_id,
        to_regclass('public.idx_trucks_type') AS idx_trucks_type
    `);
    const row = idxRes.rows?.[0] || {};
    console.log("Índices:", row);

    const consRes = await knex.raw(`
      SELECT conname
      FROM pg_constraint
      WHERE conname = 'quotes_status_chk'
    `);
    console.log(
      "Constraint quotes_status_chk presente:",
      consRes.rows.length > 0,
    );
  } catch (e) {
    console.error("Error comprobando metadatos:", e.message || String(e));
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

run();
