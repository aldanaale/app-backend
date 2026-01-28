exports.up = async function (knex) {
  // Índices
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);`,
  );
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS idx_loads_quote_id ON loads(quote_id);`,
  );
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_trucks_type ON trucks(type);`);

  // Constraint de estado enumerado para quotes
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'quotes_status_chk'
      ) THEN
        ALTER TABLE quotes
        ADD CONSTRAINT quotes_status_chk
        CHECK (status IN ('Reservado','En Proceso','Completado','Cancelado'));
      END IF;
    END
    $$;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`DROP INDEX IF EXISTS idx_quotes_user_id;`);
  await knex.raw(`DROP INDEX IF EXISTS idx_loads_quote_id;`);
  await knex.raw(`DROP INDEX IF EXISTS idx_trucks_type;`);
  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'quotes_status_chk'
      ) THEN
        ALTER TABLE quotes
        DROP CONSTRAINT quotes_status_chk;
      END IF;
    END
    $$;
  `);
};
