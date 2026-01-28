const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const name = unique + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, name);
  },
});
const upload = multer({ storage });

const create = [
  upload.array('files', 10),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, note } = req.body || {};
      const files = req.files || [];
      const hasFilenameCol = await db.schema
        .hasColumn("uploads", "filename")
        .catch(() => false);
      const hasPathCol = await db.schema
        .hasColumn("uploads", "path")
        .catch(() => false);
      const hasMimeCol = await db.schema
        .hasColumn("uploads", "mime")
        .catch(() => false);
      if (!files.length) {
        return res.status(400).json({ error: 'No se enviaron archivos.' });
      }
      const rows = [];
      for (const f of files) {
        const payload = {
          user_id: userId,
          title,
          note,
          original_name: f.originalname,
          stored_name: f.filename,
          mimetype: f.mimetype,
          size: f.size,
        };
        if (hasFilenameCol) {
          payload.filename = f.filename;
        }
        if (hasPathCol) {
          payload.path = f.filename;
        }
        if (hasMimeCol) {
          payload.mime = f.mimetype;
        }
        const [row] = await db('uploads').insert(payload).returning('*');
        rows.push(row);
      }
      res.status(201).json(rows);
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      console.error('UPLOAD ERROR:', msg);
      res.status(500).json({ error: 'Error al subir archivos.', detail: msg });
    }
  },
];

const list = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await db('uploads')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Error al listar uploads.' });
  }
};

const download = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const row = await db('uploads').where({ id }).first();
    if (!row || row.user_id !== userId) {
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
    res.status(500).json({ error: 'Error al descargar archivo.' });
  }
};

module.exports = { create, list, download };
