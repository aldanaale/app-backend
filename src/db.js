require('dotenv').config({ override: true });
const knex = require('knex');

function buildPgConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const u = new URL(url);
    const cfg = {
      host: u.hostname,
      port: u.port ? Number(u.port) : 5432,
      user: u.username,
      password: String(u.password || ''),
      database: (u.pathname || '/').replace('/', ''),
    };
    return cfg;
  } catch {
    return url;
  }
}

const db = knex({
  client: 'pg',
  connection: buildPgConnection() || process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
});

module.exports = db;
