const db = require("../db");

// Helper to recommend truck
const getRecommendedTruckType = (totalBlocks) => {
  if (totalBlocks <= 36) return "S";
  if (totalBlocks <= 64) return "M";
  if (totalBlocks <= 100) return "L";
  if (totalBlocks <= 144) return "XL";
  return "Requires Multiple Trucks"; // Or handle as error
};

const createQuote = async (req, res) => {
  const { customer_name, truck_id, loads, origin, destination, distance } =
    req.body; // loads is optional array of {description, blocks}

  const trx = await db.transaction();

  try {
    let totalBlocks = 0;
    if (loads && Array.isArray(loads)) {
      totalBlocks = loads.reduce((sum, load) => sum + (load.blocks || 0), 0);
    }

    // Validation: If truck assigned, check capacity
    if (truck_id) {
      const truck = await trx("trucks").where({ id: truck_id }).first();
      if (!truck) {
        throw new Error("Camión no encontrado.");
      }
      if (totalBlocks > truck.capacity) {
        throw new Error(
          `La carga excede la capacidad del camión (${truck.capacity} UC).`,
        );
      }
    }

    const [newQuote] = await trx("quotes")
      .insert({
        user_id: req.user.id,
        customer_name,
        truck_id,
        origin,
        destination,
        distance,
        total_blocks: totalBlocks,
        status: "Reservado",
      })
      .returning("*");

    if (loads && Array.isArray(loads)) {
      const loadsToInsert = loads.map((l) => ({
        quote_id: newQuote.id,
        description: l.description,
        blocks: l.blocks,
      }));
      if (loadsToInsert.length > 0) {
        await trx("loads").insert(loadsToInsert);
      }
    }

    await trx.commit();
    res
      .status(201)
      .json({ ...newQuote, message: "Cotización creada exitosamente." });
  } catch (error) {
    await trx.rollback();
    console.error(error);
    res
      .status(400)
      .json({ error: error.message || "Error al crear cotización." });
  }
};

const getQuote = async (req, res) => {
  const { id } = req.params;
  try {
    const quote = await db("quotes").where({ id }).first();
    if (!quote) {
      return res.status(404).json({ error: "Cotización no encontrada." });
    }

    const loads = await db("loads").where({ quote_id: id });
    const totalBlocks = loads.reduce((sum, l) => sum + l.blocks, 0);
    const recommended = getRecommendedTruckType(totalBlocks);

    // Get assigned truck details if any
    let truck = null;
    if (quote.truck_id) {
      truck = await db("trucks").where({ id: quote.truck_id }).first();
    }

    res.json({
      ...quote,
      loads,
      total_blocks: totalBlocks,
      recommended_truck: recommended,
      assigned_truck: truck,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener cotización." });
  }
};

const updateQuote = async (req, res) => {
  const { id } = req.params;
  const { customer_name, truck_id, origin, destination, distance, status } =
    req.body;

  try {
    // If updating truck_id, validate capacity against existing loads
    if (truck_id) {
      const truck = await db("trucks").where({ id: truck_id }).first();
      if (!truck)
        return res.status(404).json({ error: "Camión no encontrado." });

      const loads = await db("loads").where({ quote_id: id });
      const totalBlocks = loads.reduce((sum, l) => sum + l.blocks, 0);

      if (totalBlocks > truck.capacity) {
        return res
          .status(400)
          .json({
            error: `La carga actual (${totalBlocks} UC) excede la capacidad del nuevo camión (${truck.capacity} UC).`,
          });
      }
    }

    const [updatedQuote] = await db("quotes")
      .where({ id })
      .update({
        customer_name,
        truck_id,
        origin,
        destination,
        distance,
        status,
      })
      .returning("*");

    if (!updatedQuote)
      return res.status(404).json({ error: "Cotización no encontrada." });

    res.json(updatedQuote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar cotización." });
  }
};

const deleteQuote = async (req, res) => {
  const { id } = req.params;
  try {
    // Cascade delete loads first (if no FK cascade)
    await db("loads").where({ quote_id: id }).del();
    const count = await db("quotes").where({ id }).del();

    if (count === 0)
      return res.status(404).json({ error: "Cotización no encontrada." });

    res.json({ message: "Cotización eliminada correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar cotización." });
  }
};

const addLoad = async (req, res) => {
  const { quoteId } = req.params;
  const { description, blocks } = req.body;

  const trx = await db.transaction();

  try {
    const quote = await trx("quotes").where({ id: quoteId }).first();
    if (!quote) throw new Error("Cotización no encontrada.");

    // Calculate current total
    const currentLoads = await trx("loads").where({ quote_id: quoteId });
    const currentTotal = currentLoads.reduce((sum, l) => sum + l.blocks, 0);
    const newTotal = currentTotal + blocks;

    // Check truck capacity if assigned
    if (quote.truck_id) {
      const truck = await trx("trucks").where({ id: quote.truck_id }).first();
      if (truck && newTotal > truck.capacity) {
        throw new Error(
          `No se puede agregar la carga. Excede la capacidad del camión (${truck.capacity} UC). Total actual: ${currentTotal}, Nuevo: ${newTotal}`,
        );
      }
    }

    const [newLoad] = await trx("loads")
      .insert({ quote_id: quoteId, description, blocks })
      .returning("*");

    await trx.commit();
    res.status(201).json(newLoad);
  } catch (error) {
    await trx.rollback();
    res.status(400).json({ error: error.message });
  }
};

const deleteLoad = async (req, res) => {
  const { quoteId, loadId } = req.params;
  try {
    const count = await db("loads")
      .where({ id: loadId, quote_id: quoteId })
      .del();
    if (count === 0)
      return res.status(404).json({ error: "Carga no encontrada." });
    res.json({ message: "Carga eliminada correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar carga." });
  }
};

const listForUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autenticado" });
    const { page, pageSize, status } = req.query;
    const hasPaging = page !== undefined || pageSize !== undefined;
    const p = hasPaging ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const ps = hasPaging
      ? Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
      : 1000;
    let q = db("quotes").where({ user_id: userId });
    if (status) q = q.andWhere({ status });
    q = q.orderBy("created_at", "desc");
    const items = await q.limit(ps).offset((p - 1) * ps);
    if (hasPaging) {
      res.json({ items, page: p, pageSize: ps });
    } else {
      res.json(items);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar cotizaciones." });
  }
};

module.exports = {
  createQuote,
  getQuote,
  updateQuote,
  deleteQuote,
  addLoad,
  deleteLoad,
  listForUser,
};
