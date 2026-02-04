const bcrypt = require('bcrypt');
const db = require('../src/db');

async function run() {
  const email = process.env.ADMIN_EMAIL || 'admin@ejemplo.com';
  const name = process.env.ADMIN_NAME || 'Administrador';
  const password = process.env.ADMIN_PASSWORD || 'Adm1n!Secure';

  const isComplex =
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  if (!isComplex) {
    console.error('Password no cumple complejidad: 8+, mayúscula, minúscula, número y símbolo.');
    process.exit(1);
  }

  try {
    const existing = await db('users').where({ email }).first();
    if (existing) {
      if (existing.role !== 'admin') {
        await db('users').where({ id: existing.id }).update({ role: 'admin' });
        console.log(`Usuario existente promovido a admin: ${email}`);
      } else {
        console.log(`Usuario ya es admin: ${email}`);
      }
      process.exit(0);
    }
    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db('users')
      .insert({ email, password: hashed, name, role: 'admin' })
      .returning(['id', 'email', 'name', 'role']);
    console.log('Admin creado:', user);
    process.exit(0);
  } catch (e) {
    console.error('Error creando admin:', e && e.message ? e.message : String(e));
    process.exit(1);
  }
}

run();
