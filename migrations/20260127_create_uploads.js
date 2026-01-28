exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('uploads');
  if (!hasTable) {
    await knex.schema.createTable('uploads', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('title');
      t.text('note');
      t.string('original_name').notNullable();
      t.string('stored_name').notNullable();
      t.string('mimetype').notNullable();
      t.integer('size').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('uploads');
};
