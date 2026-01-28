exports.seed = async function (knex) {
  const row = await knex("trucks").count("* as c").first();
  const count = Number(row && row.c ? row.c : 0);
  if (count === 0) {
    await knex("trucks").insert([
      { name: "Camión S", type: "S", capacity: 36 },
      { name: "Camión M", type: "M", capacity: 64 },
      { name: "Camión L", type: "L", capacity: 100 },
      { name: "Camión XL", type: "XL", capacity: 144 },
    ]);
  }
};
