const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const name = `${base}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    const userId = req.body.user_id ? Number(req.body.user_id) : null;
    const saved = [];
    for (const f of req.files || []) {
      const [row] = await db('uploads')
        .insert({
          user_id: userId,
          filename: f.originalname,
          stored_name: f.filename,
          path: f.path,
          mime: f.mimetype,
          size: f.size
        })
        .returning('*');
      saved.push(row);
    }
    res.status(201).json({ files: saved });
  } catch (e) {
    res.status(500).json({ error: 'Error al guardar archivos', detail: String(e) });
  }
});

router.get('/', async (req, res) => {
  try {
    const rows = await db('uploads').select('*').orderBy('created_at', 'desc');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error al listar archivos' });
  }
});

module.exports = router;
