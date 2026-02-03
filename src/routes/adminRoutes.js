const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

router.use(authMiddleware, requireRole("admin"));

// Listar todas las cotizaciones (admin)
router.get("/quotes", async (req, res) => {
  try {
    const { page, pageSize, status, user_id, q } = req.query;
    const hasPaging = page !== undefined || pageSize !== undefined;
    const p = hasPaging ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const ps = hasPaging
      ? Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
      : 1000;
    let qb = db("quotes").select("*").orderBy("created_at", "desc");
    if (status) qb = qb.where({ status });
    if (user_id) qb = qb.andWhere({ user_id });
    if (q) {
      const like = `%${q}%`;
      qb = qb.andWhere((w) =>
        w
          .where("customer_name", "ilike", like)
          .orWhere("origin", "ilike", like)
          .orWhere("destination", "ilike", like),
      );
    }
    const items = await qb.limit(ps).offset((p - 1) * ps);
    if (hasPaging) {
      let countQ = db("quotes");
      if (status) countQ = countQ.where({ status });
      if (user_id) countQ = countQ.andWhere({ user_id });
      if (q) {
        const like = `%${q}%`;
        countQ = countQ.andWhere((w) =>
          w
            .where("customer_name", "ilike", like)
            .orWhere("origin", "ilike", like)
            .orWhere("destination", "ilike", like),
        );
      }
      const totalRow = await countQ.count({ count: "id" }).first();
      const total =
        totalRow && (totalRow.count || totalRow["count"]) !== undefined
          ? parseInt(String(totalRow.count || totalRow["count"]), 10)
          : items.length;
      res.json({ items, page: p, pageSize: ps, total });
    } else {
      res.json(items);
    }
  } catch (e) {
    res.status(500).json({ error: "Error listando cotizaciones." });
  }
});

 

router.put("/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  if (!role) return res.status(400).json({ error: "Rol requerido." });
  try {
    const [u] = await db("users")
      .where({ id })
      .update({ role })
      .returning(["id", "email", "name", "role"]);
    if (!u) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: "Error actualizando rol." });
  }
});

router.get("/users", async (req, res) => {
  try {
    const { page, pageSize, q } = req.query;
    const hasPaging = page !== undefined || pageSize !== undefined;
    const p = hasPaging ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const ps = hasPaging
      ? Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
      : 1000;
    let qb = db("users").select("id", "email", "name", "role").orderBy("id", "asc");
    if (q) {
      const like = `%${q}%`;
      qb = qb.where((w) =>
        w.where("email", "ilike", like).orWhere("name", "ilike", like),
      );
    }
    const items = await qb.limit(ps).offset((p - 1) * ps);
    if (hasPaging) {
      let countQ = db("users");
      if (q) {
        const like = `%${q}%`;
        countQ = countQ.where((w) =>
          w.where("email", "ilike", like).orWhere("name", "ilike", like),
        );
      }
      const totalRow = await countQ.count({ count: "id" }).first();
      const total =
        totalRow && (totalRow.count || totalRow["count"]) !== undefined
          ? parseInt(String(totalRow.count || totalRow["count"]), 10)
          : items.length;
      res.json({ items, page: p, pageSize: ps, total });
    } else {
      res.json(items);
    }
  } catch (e) {
    res.status(500).json({ error: "Error listando usuarios." });
  }
});

router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [u] = await db("users").where({ id }).del().returning(["id"]);
    if (!u) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json({ ok: true, id: u.id });
  } catch (e) {
    res.status(500).json({ error: "Error eliminando usuario." });
  }
});

module.exports = router;
