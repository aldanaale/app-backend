const db = require("../db");

const getAllTrucks = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    let q = db("trucks").select("*");
    if (type) q = q.where({ type });
    const items = await q.limit(ps).offset((p - 1) * ps);
    res.json({ items, page: p, pageSize: ps });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener camiones." });
  }
};

const createTruck = async (req, res) => {
  const { name, type, capacity } = req.body;
  // If type is provided, we could auto-set capacity, but let's trust the input or validation middleware.

  try {
    const [newTruck] = await db("trucks")
      .insert({ name, type, capacity })
      .returning("*");
    res.status(201).json(newTruck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear camión." });
  }
};

const updateTruck = async (req, res) => {
  const { id } = req.params;
  const { name, type, capacity } = req.body;

  try {
    const [updatedTruck] = await db("trucks")
      .where({ id })
      .update({ name, type, capacity })
      .returning("*");

    if (!updatedTruck) {
      return res.status(404).json({ error: "Camión no encontrado." });
    }
    res.json(updatedTruck);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar camión." });
  }
};

const deleteTruck = async (req, res) => {
  const { id } = req.params;
  try {
    const count = await db("trucks").where({ id }).del();
    if (count === 0) {
      return res.status(404).json({ error: "Camión no encontrado." });
    }
    res.json({ message: "Camión eliminado correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar camión." });
  }
};

module.exports = {
  getAllTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
};
