const adminMiddleware = (req, res, next) => {
  const role = req.user && req.user.role;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores' });
  }
  next();
};

module.exports = adminMiddleware;
