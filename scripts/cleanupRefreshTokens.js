require('dotenv').config();
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

async function run() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expired = await knex('refresh_tokens')
      .where('expires_at', '<', now)
      .del();
    const oldRevoked = await knex('refresh_tokens')
      .where({ revoked: true })
      .andWhere('created_at', '<', sevenDaysAgo)
      .del();
    console.log(JSON.stringify({ removed_expired: expired, removed_old_revoked: oldRevoked }));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

run();
