const validateTruck = (req, res, next) => {
  const { name, capacity } = req.body;
  if (!name || !capacity) {
    return res.status(400).json({ error: 'Nombre y capacidad son obligatorios.' });
  }
  if (typeof capacity !== 'number' || capacity <= 0) {
    return res.status(400).json({ error: 'La capacidad debe ser un número positivo.' });
  }
  next();
};

const validateQuote = (req, res, next) => {
  // Add specific validations for quotes if needed
  // For creation, maybe just customer info?
  // UC validation happens when adding loads usually, or if quote creation includes loads.
  next();
};

const validateLoad = (req, res, next) => {
  const { description, blocks } = req.body;
  if (!description || !blocks) {
    return res.status(400).json({ error: 'Descripción y bloques son obligatorios.' });
  }
  if (typeof blocks !== 'number' || blocks <= 0) {
    return res.status(400).json({ error: 'Los bloques deben ser un número positivo.' });
  }
  next();
};

module.exports = {
  validateTruck,
  validateQuote,
  validateLoad
};
