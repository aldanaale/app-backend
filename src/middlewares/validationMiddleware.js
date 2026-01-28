const validateTruck = (req, res, next) => {
  const { name, capacity } = req.body;
  if (!name || !capacity) {
    return res
      .status(400)
      .json({ error: "Nombre y capacidad son obligatorios." });
  }
  if (typeof capacity !== "number" || capacity <= 0) {
    return res
      .status(400)
      .json({ error: "La capacidad debe ser un número positivo." });
  }
  next();
};

const validateQuote = (req, res, next) => {
  const { customer_name, origin, destination, distance, loads } = req.body;
  if (!customer_name || typeof customer_name !== "string") {
    return res
      .status(400)
      .json({ error: "El nombre del cliente es obligatorio." });
  }
  if (typeof customer_name === "string" && customer_name.length > 100) {
    return res
      .status(400)
      .json({ error: "El nombre del cliente es demasiado largo." });
  }
  if (origin && typeof origin !== "string") {
    return res.status(400).json({ error: "El origen debe ser texto." });
  }
  if (destination && typeof destination !== "string") {
    return res.status(400).json({ error: "El destino debe ser texto." });
  }
  if (origin && typeof origin === "string" && origin.length > 100) {
    return res.status(400).json({ error: "El origen es demasiado largo." });
  }
  if (destination && typeof destination === "string" && destination.length > 100) {
    return res.status(400).json({ error: "El destino es demasiado largo." });
  }
  if (origin && destination && origin === destination) {
    return res
      .status(400)
      .json({ error: "El origen y destino no pueden ser iguales." });
  }
  if (distance !== undefined) {
    if (typeof distance !== "number" || distance < 0) {
      return res
        .status(400)
        .json({ error: "La distancia debe ser un número mayor o igual a 0." });
    }
  }
  if (loads !== undefined) {
    if (!Array.isArray(loads)) {
      return res
        .status(400)
        .json({ error: "Las cargas deben ser un arreglo." });
    }
    if (loads.length > 200) {
      return res
        .status(400)
        .json({ error: "Demasiadas cargas en una sola cotización." });
    }
    for (const l of loads) {
      if (
        !l ||
        typeof l.description !== "string" ||
        typeof l.blocks !== "number" ||
        l.blocks <= 0
      ) {
        return res
          .status(400)
          .json({
            error: "Cada carga debe tener descripción y bloques positivos.",
          });
      }
      if (l.description.length > 200) {
        return res.status(400).json({ error: "La descripción de la carga es demasiado larga." });
      }
      if (!Number.isInteger(l.blocks) || l.blocks > 1000) {
        return res.status(400).json({ error: "Los bloques deben ser un entero entre 1 y 1000." });
      }
    }
  }
  next();
};

const validateLoad = (req, res, next) => {
  const { description, blocks } = req.body;
  if (!description || !blocks) {
    return res
      .status(400)
      .json({ error: "Descripción y bloques son obligatorios." });
  }
  if (typeof blocks !== "number" || blocks <= 0) {
    return res
      .status(400)
      .json({ error: "Los bloques deben ser un número positivo." });
  }
  if (typeof description === "string" && description.length > 200) {
    return res.status(400).json({ error: "La descripción es demasiado larga." });
  }
  if (!Number.isInteger(blocks) || blocks > 1000) {
    return res.status(400).json({ error: "Los bloques deben ser un entero entre 1 y 1000." });
  }
  next();
};

module.exports = {
  validateTruck,
  validateQuote,
  validateLoad,
};
