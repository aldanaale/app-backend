exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable("refresh_tokens");
  if (!hasTable) {
    await knex.schema.createTable("refresh_tokens", (t) => {
      t.increments("id").primary();
      t.integer("user_id")
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.string("jti").notNullable().unique();
      t.boolean("revoked").defaultTo(false);
      t.timestamp("expires_at").notNullable();
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("refresh_tokens");
};
