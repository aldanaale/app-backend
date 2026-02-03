require("dotenv").config();

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

module.exports = {
  client: "pg",
  connection: buildPgConnection() || process.env.DATABASE_URL,
  migrations: {
    directory: "./migrations",
    tableName: "knex_migrations",
  },
  pool: { min: 2, max: 10 },
};
