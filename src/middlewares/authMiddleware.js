const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev_temp_secret_change_me";
const JWT_SECRET_PREV = process.env.JWT_SECRET_PREV;

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ error: "Acceso denegado. Token no proporcionado." });
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(401)
      .json({ error: "Acceso denegado. Formato de token inválido." });
  }

  try {
    let decoded = null;
    const secrets = [JWT_SECRET, JWT_SECRET_PREV].filter(Boolean);
    for (const s of secrets) {
      try {
        decoded = jwt.verify(token, s);
        break;
      } catch {}
    }
    if (!decoded) {
      return res.status(401).json({ error: "Token inválido o expirado." });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

module.exports = authMiddleware;
