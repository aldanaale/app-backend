const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const crypto = require("crypto");
const JWT_SECRET = process.env.JWT_SECRET || "dev_temp_secret_change_me";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "dev_temp_refresh_secret_change_me";
const JWT_SECRET_PREV = process.env.JWT_SECRET_PREV;
const JWT_REFRESH_SECRET_PREV = process.env.JWT_REFRESH_SECRET_PREV;

const register = async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email y contraseña son obligatorios." });
  }
  const isComplex =
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  if (!isComplex) {
    return res
      .status(400)
      .json({
        error:
          "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.",
      });
  }

  try {
    // Check if user exists
    const existingUser = await db("users").where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db("users")
      .insert({
        email,
        password: hashedPassword,
        name,
      })
      .returning(["id", "email", "name"]);

    res
      .status(201)
      .json({ message: "Usuario registrado exitosamente.", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar usuario." });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email y contraseña son obligatorios." });
  }

  try {
    const user = await db("users").where({ email }).first();

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" },
    );
    const jti = crypto.randomUUID();
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d", jwtid: jti },
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db("refresh_tokens").insert({
      user_id: user.id,
      jti,
      expires_at: expiresAt,
    });

    console.log("AUTH LOGIN HANDLER WITH REFRESH");
    res.json({ message: "Login exitoso.", token, refreshToken });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: "Error al iniciar sesión.",
        detail: error && error.message ? error.message : String(error),
      });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await db("users")
      .where({ id: req.user.id })
      .select("id", "email", "name", "role")
      .first();
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener perfil." });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  refresh: async (req, res) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token requerido." });
    }
    try {
      let payload = null;
      const secrets = [JWT_REFRESH_SECRET, JWT_REFRESH_SECRET_PREV].filter(
        Boolean,
      );
      for (const s of secrets) {
        try {
          payload = jwt.verify(refreshToken, s);
          break;
        } catch {}
      }
      if (!payload) {
        return res
          .status(401)
          .json({ error: "Refresh token inválido o expirado." });
      }
      const rec = await db("refresh_tokens")
        .where({ jti: payload.jti, user_id: payload.id })
        .first();
      if (!rec || rec.revoked) {
        return res
          .status(401)
          .json({ error: "Refresh token revocado o inexistente." });
      }
      // Rotación: revocar token actual y emitir uno nuevo
      await db("refresh_tokens")
        .where({ id: rec.id })
        .update({ revoked: true });
      const newJti = crypto.randomUUID();
      const newRefresh = jwt.sign(
        { id: payload.id, email: payload.email, role: payload.role },
        JWT_REFRESH_SECRET,
        { expiresIn: "7d", jwtid: newJti },
      );
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db("refresh_tokens").insert({
        user_id: payload.id,
        jti: newJti,
        expires_at: expiresAt,
      });
      const newToken = jwt.sign(
        { id: payload.id, email: payload.email, role: payload.role },
        JWT_SECRET,
        { expiresIn: "1h" },
      );
      res.json({ token: newToken, refreshToken: newRefresh });
    } catch (e) {
      res.status(401).json({ error: "Refresh token inválido o expirado." });
    }
  },
  logout: async (req, res) => {
    const { refreshToken, all } = req.body || {};
    try {
      if (all) {
        await db("refresh_tokens")
          .where({ user_id: req.user.id, revoked: false })
          .update({ revoked: true });
        return res.json({ message: "Sesiones cerradas." });
      }
      if (!refreshToken) {
        return res
          .status(400)
          .json({ error: "Refresh token requerido para logout." });
      }
      let payload = null;
      try {
        payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      } catch {
        return res.status(400).json({ error: "Refresh token inválido." });
      }
      await db("refresh_tokens")
        .where({ jti: payload.jti, user_id: payload.id, revoked: false })
        .update({ revoked: true });
      res.json({ message: "Sesión cerrada." });
    } catch (e) {
      res.status(500).json({ error: "Error en logout." });
    }
  },
};
