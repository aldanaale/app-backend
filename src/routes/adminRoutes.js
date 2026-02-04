const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

router.use(authMiddleware, adminMiddleware);

router.get('/users', async (req, res) => {
  try {
    const { q, page = 1, pageSize = 20 } = req.query;
    const pg = Math.max(1, parseInt(page, 10));
    const ps = Math.max(1, Math.min(100, parseInt(pageSize, 10)));
    let base = db('users');
    if (q && String(q).trim()) {
      const term = String(q).trim();
      base = base.where((b) => {
        b.whereILike('email', `%${term}%`).orWhereILike('name', `%${term}%`);
      });
    }
    const totalRow = await base.clone().clearSelect().clearOrder().count({ count: '*' }).first();
    const total = Number(totalRow?.count || 0);
    const items = await base
      .clone()
      .select('id', 'email', 'name', 'role')
      .orderBy('created_at', 'desc')
      .offset((pg - 1) * ps)
      .limit(ps);
    res.json({ items, page: pg, pageSize: ps, total });
  } catch (e) {
    console.error('ADMIN /users error:', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Error al listar usuarios.' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    if (!role) return res.status(400).json({ error: 'Rol requerido' });
    const [row] = await db('users').where({ id }).update({ role }).returning(['id', 'email', 'name', 'role']);
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar rol.' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario.' });
    }
    const count = await db('users').where({ id }).del();
    if (count === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado.' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
});

router.get('/quotes', async (req, res) => {
  try {
    const { q, status, user_id, page = 1, pageSize = 20 } = req.query;
    const pg = Math.max(1, parseInt(page, 10));
    const ps = Math.max(1, Math.min(100, parseInt(pageSize, 10)));
    let base = db('quotes').leftJoin('users', 'quotes.user_id', 'users.id');
    if (q && String(q).trim()) {
      const term = String(q).trim();
      base = base.where((b) => {
        b.whereILike('quotes.customer_name', `%${term}%`)
          .orWhereILike('users.email', `%${term}%`)
          .orWhereILike('users.name', `%${term}%`);
      });
    }
    if (status && String(status).trim()) {
      base = base.where('quotes.status', String(status).trim());
    }
    if (user_id && String(user_id).trim()) {
      base = base.where('quotes.user_id', String(user_id).trim());
    }
    const totalRow = await base.clone().clearSelect().clearOrder().count({ count: '*' }).first();
    const total = Number(totalRow?.count || 0);
    const rows = await base
      .clone()
      .select(
        'quotes.id',
        'quotes.customer_name',
        'quotes.origin',
        'quotes.destination',
        'quotes.distance',
        'quotes.total_blocks',
        'quotes.status',
        'quotes.created_at',
        db.raw('users.name as user_name'),
        db.raw('users.email as user_email')
      )
      .orderBy('quotes.created_at', 'desc')
      .offset((pg - 1) * ps)
      .limit(ps);
    res.json({ items: rows, page: pg, pageSize: ps, total });
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.error('ADMIN /quotes error:', msg);
    res.status(500).json({ error: 'Error al listar cotizaciones.', detail: msg });
  }
});

router.get('/uploads', async (req, res) => {
  try {
    const { user_id, page = 1, pageSize = 20 } = req.query;
    const pg = Math.max(1, parseInt(page, 10));
    const ps = Math.max(1, Math.min(100, parseInt(pageSize, 10)));
    let query = db('uploads').select('*').orderBy('created_at', 'desc');
    if (user_id && String(user_id).trim()) {
      query = query.where('user_id', String(user_id).trim());
    }
    const totalRow = await query.clone().count({ count: '*' }).first();
    const total = Number(totalRow?.count || 0);
    const items = await query.offset((pg - 1) * ps).limit(ps);
    res.json({ items, page: pg, pageSize: ps, total });
  } catch (e) {
    console.error('ADMIN /uploads error:', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Error al listar uploads.' });
  }
});

router.get('/uploads/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await db('uploads').where({ id }).first();
    if (!row) {
      return res.status(404).json({ error: 'Archivo no encontrado.' });
    }
    const filePath = path.join(uploadDir, row.stored_name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no disponible.' });
    }
    res.setHeader('Content-Type', row.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${row.original_name}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    console.error('ADMIN /uploads/:id/download error:', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Error al descargar archivo.' });
  }
});

module.exports = router;
