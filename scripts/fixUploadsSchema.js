const db = require("../src/db");

async function run() {
  let changed = false;
  const hasTable = await db.schema.hasTable("uploads");
  if (!hasTable) {
    console.log("uploads table not found");
    process.exit(0);
  }
  const hasFilename = await db.schema.hasColumn("uploads", "filename");
  const hasStored = await db.schema.hasColumn("uploads", "stored_name");
  if (hasFilename && !hasStored) {
    await db.schema.alterTable("uploads", (t) => {
      t.renameColumn("filename", "stored_name");
    });
    changed = true;
  } else if (hasFilename && hasStored) {
    try {
      await db.schema.alterTable("uploads", (t) => {
        t.dropColumn("filename");
      });
      changed = true;
    } catch {}
  }
  const hasPath = await db.schema.hasColumn("uploads", "path");
  if (hasPath && !hasStored) {
    await db.schema.alterTable("uploads", (t) => {
      t.renameColumn("path", "stored_name");
    });
    changed = true;
  } else if (hasPath && hasStored) {
    try {
      await db.schema.alterTable("uploads", (t) => {
        t.dropColumn("path");
      });
      changed = true;
    } catch {}
  }
  const hasMime = await db.schema.hasColumn("uploads", "mime");
  const hasMimetype = await db.schema.hasColumn("uploads", "mimetype");
  if (hasMime && !hasMimetype) {
    await db.schema.alterTable("uploads", (t) => {
      t.renameColumn("mime", "mimetype");
    });
    changed = true;
  } else if (hasMime && hasMimetype) {
    try {
      await db.schema.alterTable("uploads", (t) => {
        t.dropColumn("mime");
      });
      changed = true;
    } catch {}
  }
  const ensureCols = [
    { name: "original_name", type: (t) => t.string("original_name") },
    { name: "mimetype", type: (t) => t.string("mimetype") },
    { name: "size", type: (t) => t.integer("size") },
    { name: "title", type: (t) => t.string("title") },
    { name: "note", type: (t) => t.text("note") },
    {
      name: "user_id",
      type: (t) =>
        t.integer("user_id").references("id").inTable("users").onDelete("CASCADE"),
    },
    {
      name: "created_at",
      type: (t) => t.timestamp("created_at").defaultTo(db.fn.now()),
    },
  ];
  for (const col of ensureCols) {
    const hasCol = await db.schema.hasColumn("uploads", col.name);
    if (!hasCol) {
      await db.schema.alterTable("uploads", (t) => {
        col.type(t);
      });
      changed = true;
    }
  }
  console.log(changed ? "uploads schema fixed" : "uploads schema already OK");
  await db.destroy();
  process.exit(0);
}

run();
