const requireRole = (role) => (req, res, next) => {
  const userRole = req.user && req.user.role;
  if (!userRole) {
    return res.status(403).json({ error: "Rol no presente en token." });
  }
  if (userRole !== role) {
    return res.status(403).json({ error: "Permisos insuficientes." });
  }
  next();
};

module.exports = { requireRole };
