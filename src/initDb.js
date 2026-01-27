const db = require('./db');

async function ensureSchema() {
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('email').notNullable().unique();
      t.string('password').notNullable();
      t.string('name');
      t.string('role').defaultTo('usuario');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  const hasTrucks = await db.schema.hasTable('trucks');
  if (!hasTrucks) {
    await db.schema.createTable('trucks', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.string('type').notNullable();
      t.integer('capacity').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  const hasQuotes = await db.schema.hasTable('quotes');
  if (!hasQuotes) {
    await db.schema.createTable('quotes', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('customer_name').notNullable();
      t.integer('truck_id').references('id').inTable('trucks').onDelete('SET NULL');
      t.string('origin');
      t.string('destination');
      t.integer('distance');
      t.integer('total_blocks');
      t.string('status').defaultTo('Reservado');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }
  // Ensure columns exist if table already created
  const quoteCols = [
    { name: 'user_id', type: (t) => t.integer('user_id').references('id').inTable('users').onDelete('CASCADE') },
    { name: 'origin', type: (t) => t.string('origin') },
    { name: 'destination', type: (t) => t.string('destination') },
    { name: 'distance', type: (t) => t.integer('distance') },
    { name: 'total_blocks', type: (t) => t.integer('total_blocks') },
    { name: 'status', type: (t) => t.string('status').defaultTo('Reservado') },
  ];
  for (const col of quoteCols) {
    const hasCol = await db.schema.hasColumn('quotes', col.name);
    if (!hasCol) {
      await db.schema.alterTable('quotes', (t) => {
        col.type(t);
      });
    }
  }

  const hasLoads = await db.schema.hasTable('loads');
  if (!hasLoads) {
    await db.schema.createTable('loads', (t) => {
      t.increments('id').primary();
      t.integer('quote_id').references('id').inTable('quotes').onDelete('CASCADE');
      t.string('description').notNullable();
      t.integer('blocks').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  const hasUploads = await db.schema.hasTable('uploads');
  if (!hasUploads) {
    await db.schema.createTable('uploads', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
      t.string('filename').notNullable();
      t.string('stored_name').notNullable();
      t.string('path').notNullable();
      t.string('mime').notNullable();
      t.integer('size').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }
}

module.exports = { ensureSchema };
