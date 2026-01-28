exports.up = async function (knex) {
  const hasUsers = await knex.schema.hasTable("users");
  if (!hasUsers) {
    await knex.schema.createTable("users", (t) => {
      t.increments("id").primary();
      t.string("email").notNullable().unique();
      t.string("password").notNullable();
      t.string("name");
      t.string("role").defaultTo("usuario");
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }

  const hasTrucks = await knex.schema.hasTable("trucks");
  if (!hasTrucks) {
    await knex.schema.createTable("trucks", (t) => {
      t.increments("id").primary();
      t.string("name").notNullable();
      t.string("type").notNullable();
      t.integer("capacity").notNullable();
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }

  const hasQuotes = await knex.schema.hasTable("quotes");
  if (!hasQuotes) {
    await knex.schema.createTable("quotes", (t) => {
      t.increments("id").primary();
      t.integer("user_id")
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.string("customer_name").notNullable();
      t.integer("truck_id")
        .references("id")
        .inTable("trucks")
        .onDelete("SET NULL");
      t.string("origin");
      t.string("destination");
      t.integer("distance");
      t.integer("total_blocks");
      t.string("status").defaultTo("Reservado");
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }

  const hasLoads = await knex.schema.hasTable("loads");
  if (!hasLoads) {
    await knex.schema.createTable("loads", (t) => {
      t.increments("id").primary();
      t.integer("quote_id")
        .references("id")
        .inTable("quotes")
        .onDelete("CASCADE");
      t.string("description").notNullable();
      t.integer("blocks").notNullable();
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  // No se eliminan en down por seguridad; si se requiere:
  // await knex.schema.dropTableIfExists('loads');
  // await knex.schema.dropTableIfExists('quotes');
  // await knex.schema.dropTableIfExists('trucks');
  // await knex.schema.dropTableIfExists('users');
};
