require('dotenv').config();
const { Client } = require('pg');

async function createDbIfMissing() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL no está definido en .env');
    process.exit(1);
  }
  const u = new URL(dbUrl);
  const targetDb = u.pathname.replace('/', '');
  u.pathname = '/postgres';

  const client = new Client({ connectionString: u.toString() });
  try {
    await client.connect();
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Base de datos "${targetDb}" creada.`);
    } else {
      console.log(`Base de datos "${targetDb}" ya existe.`);
    }
  } catch (e) {
    console.error('Error creando base de datos:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDbIfMissing();
