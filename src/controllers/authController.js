const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const register = async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
  }

  try {
    // Check if user exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db('users')
      .insert({
        email,
        password: hashedPassword,
        name
      })
      .returning(['id', 'email', 'name']);

    res.status(201).json({ message: 'Usuario registrado exitosamente.', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
  }

  try {
    const user = await db('users').where({ email }).first();

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login exitoso.', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).select('id', 'email', 'name').first();
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener perfil.' });
  }
};

module.exports = {
  register,
  login,
  getProfile
};
