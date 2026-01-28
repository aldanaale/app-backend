const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

router.use(authMiddleware, requireRole("admin"));

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
    const users = await db("users")
      .select("id", "email", "name", "role")
      .orderBy("id", "asc");
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: "Error listando usuarios." });
  }
});

module.exports = router;
