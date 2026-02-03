  const path = require('path');
  const fs = require('fs');
  const multer = require('multer');
const db = require('../db');
const XLSX = require("xlsx");

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

  function basicAnalyze(row) {
    const ext = path.extname(row.original_name || "").toLowerCase();
    const mime = (row.mimetype || "").toLowerCase();
    const size = Number(row.size || 0);
    const tags = [];
    const flags = {};
    let summary = "";
    if (mime.startsWith("image/")) {
      tags.push("imagen");
      if (size > 5 * 1024 * 1024) flags.oversize = true;
      if (ext === ".png") tags.push("png");
      if (ext === ".jpg" || ext === ".jpeg") tags.push("jpg");
      summary = `Imagen (${ext || "desconocido"}) de ${size} bytes.`;
    } else if (mime === "text/csv" || ext === ".csv") {
      tags.push("inventario", "csv");
      summary = `CSV de ${size} bytes. Intento de lectura básica.`;
      try {
        const filePath = path.join(__dirname, "..", "..", "uploads", row.stored_name);
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split(/\r?\n/).filter((l) => l.trim().length);
        const items = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(",").map((p) => p.trim());
          if (parts.length >= 2) {
            const qty = Number(parts[1]);
            if (!isNaN(qty)) {
              items.push({ name: parts[0], quantity: qty });
            }
          }
        }
        if (items.length) {
          tags.push("inventario_valido");
          summary = `Inventario con ${items.length} ítems detectados.`;
          flags.inventory_items = items;
        } else {
          flags.inventory_items = [];
        }
      } catch {
        flags.csv_read_error = true;
      }
    } else if (mime === "application/pdf" || ext === ".pdf") {
      tags.push("documento", "pdf");
      summary = `PDF de ${size} bytes. Resumen no disponible sin librerías.`;
    } else if (
      mime === "application/vnd.ms-excel" ||
      mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      ext === ".xlsx" ||
      ext === ".xls"
    ) {
      tags.push("inventario_excel");
    summary = `Excel de ${size} bytes.`;
    try {
      const filePath = path.join(__dirname, "..", "..", "uploads", row.stored_name);
      const wb = XLSX.readFile(filePath);
      const shName = wb.SheetNames[0];
      const sheet = wb.Sheets[shName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const items = [];
      let route = { origin: null, destination: null, distance: null };
      for (const r of rows) {
        const name = r.nombre || r.name || r.item || r.producto || "";
        const qty = Number(r.cantidad ?? r.quantity ?? r.qty ?? r.unidades ?? r.cant ?? r["cant."]);
        if (name && !isNaN(qty)) items.push({ name: String(name), quantity: qty });
        const o = r.origen ?? r.origin ?? r.desde ?? r.from ?? "";
        const d = r.destino ?? r.destination ?? r.hasta ?? r.to ?? "";
        const distRaw = r.distancia ?? r.distance ?? r.km ?? r.kilometros ?? r.kilometers ?? null;
        const distNum = distRaw !== null ? Number(distRaw) : null;
        if ((typeof o === "string" && o.trim()) || (typeof d === "string" && d.trim()) || (distNum !== null && !Number.isNaN(distNum))) {
          if (typeof o === "string" && o.trim()) route.origin = String(o).trim();
          if (typeof d === "string" && d.trim()) route.destination = String(d).trim();
          if (distNum !== null && !Number.isNaN(distNum)) route.distance = distNum;
        }
      }
      if (items.length) {
        tags.push("inventario_valido");
        summary = `Inventario Excel con ${items.length} ítems detectados.`;
        flags.inventory_items = items;
        if (route.origin || route.destination || route.distance !== null) {
          flags.route = route;
        }
      } else {
        flags.inventory_items = [];
      }
    } catch {
      flags.excel_read_error = true;
    }
    } else if (mime.startsWith("text/") || ext === ".txt") {
      tags.push("texto");
      summary = `Texto plano de ${size} bytes.`;
    } else {
      tags.push("archivo");
      summary = `Archivo (${mime || "desconocido"}) de ${size} bytes.`;
    }
    return { tags, flags, summary };
  }

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
          Promise.resolve()
            .then(async () => {
              const insights = basicAnalyze(row);
              await db("uploads")
                .where({ id: row.id })
                .update({
                  ai_status: "done",
                  ai_tags: JSON.stringify(insights.tags),
                  ai_summary: insights.summary,
                  ai_flags: JSON.stringify(insights.flags),
                });
            })
            .catch((err) => {
              console.error("ANALYZE ERROR:", err && err.message ? err.message : String(err));
            db("uploads").where({ id: row.id }).update({ ai_status: "error" }).catch(() => {});
            });
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

  const insights = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const row = await db("uploads").where({ id }).first();
      if (!row || row.user_id !== userId) {
        return res.status(404).json({ error: "Archivo no encontrado." });
      }
    const parseMaybeJson = (val, fallback) => {
      if (!val && val !== 0) return fallback;
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return fallback;
        }
      }
      return val;
    };
    res.json({
      ai_status: row.ai_status || "none",
      ai_tags: parseMaybeJson(row.ai_tags, []),
      ai_summary: row.ai_summary || "",
      ai_flags: parseMaybeJson(row.ai_flags, {}),
    });
    } catch {
      res.status(500).json({ error: "Error al obtener insights." });
    }
  };

  const reanalyze = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const row = await db("uploads").where({ id }).first();
      if (!row || row.user_id !== userId) {
        return res.status(404).json({ error: "Archivo no encontrado." });
      }
      const insightsData = basicAnalyze(row);
      await db("uploads")
        .where({ id })
        .update({
          ai_status: "done",
          ai_tags: JSON.stringify(insightsData.tags),
          ai_summary: insightsData.summary,
          ai_flags: JSON.stringify(insightsData.flags),
        });
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Error al reanalizar." });
    }
  };

  const createQuoteFromUpload = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const row = await db("uploads").where({ id }).first();
      if (!row || row.user_id !== userId) {
        return res.status(404).json({ error: "Archivo no encontrado." });
      }
      const bodyOrigin = (req.body && typeof req.body.origin === "string" && req.body.origin.trim()) ? req.body.origin.trim() : null;
      const bodyDestination = (req.body && typeof req.body.destination === "string" && req.body.destination.trim()) ? req.body.destination.trim() : null;
      let bodyDistance = null;
      if (req.body && (typeof req.body.distance === "number" || typeof req.body.distance === "string")) {
        const d = Number(req.body.distance);
        if (!Number.isNaN(d) && d >= 0) bodyDistance = d;
      }
      const estimateDistance = (o, d) => {
        if (!o || !d) return null;
        if (o === d) return 0;
        const seed = o.length + d.length;
        return 5 + ((seed * 7) % 40);
      };
      const parseMaybeJson = (val, fallback) => {
        if (!val && val !== 0) return fallback;
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return fallback;
          }
        }
        return val;
      };
      let flags = parseMaybeJson(row.ai_flags, {});
      if (!flags || typeof flags !== "object") flags = {};
      let items = Array.isArray(flags.inventory_items)
        ? flags.inventory_items
        : [];
      if (!items.length) {
        const i2 = basicAnalyze(row);
        flags = i2.flags || {};
        items = Array.isArray(flags.inventory_items)
          ? flags.inventory_items
          : [];
      }
      if (!items.length) {
        return res.status(400).json({ error: "No se detectó inventario en el archivo." });
      }
      const loads = items
        .filter((it) => it && typeof it.name === "string")
        .map((it) => ({
          description: String(it.name),
          blocks: Math.max(1, Number(it.quantity || 1)),
        }));
      const totalBlocks = loads.reduce((s, l) => s + l.blocks, 0);
      const recommend = (tb) => {
        if (tb <= 36) return "S";
        if (tb <= 64) return "M";
        if (tb <= 100) return "L";
        if (tb <= 144) return "XL";
        return null;
      };
      const recommendedType = recommend(totalBlocks);
      let truckId = null;
      if (recommendedType) {
        const t = await db("trucks")
          .where({ type: recommendedType })
          .andWhere("capacity", ">=", totalBlocks)
          .orderBy("capacity", "asc")
          .first();
        if (t) truckId = t.id;
      }
      const suggestedRoute = flags && flags.route ? flags.route : null;
      const useOrigin = bodyOrigin ?? (suggestedRoute && typeof suggestedRoute.origin === "string" ? suggestedRoute.origin : null);
      const useDestination = bodyDestination ?? (suggestedRoute && typeof suggestedRoute.destination === "string" ? suggestedRoute.destination : null);
      const useDistance = bodyDistance !== null && bodyDistance !== undefined
        ? bodyDistance
        : (suggestedRoute && typeof suggestedRoute.distance === "number" ? suggestedRoute.distance : estimateDistance(useOrigin, useDestination));
      const [quote] = await db("quotes")
        .insert({
          user_id: userId,
          customer_name: row.title || "Inventario",
          truck_id: truckId || null,
          origin: useOrigin,
          destination: useDestination,
          distance: useDistance,
          total_blocks: totalBlocks,
          status: "En Proceso",
        })
        .returning("*");
      for (const l of loads) {
        await db("loads").insert({
          quote_id: quote.id,
          description: l.description,
          blocks: l.blocks,
        });
      }
      res.status(201).json({
        quote_id: quote.id,
        recommended_truck_type: recommendedType,
        assigned_truck_id: truckId,
        total_blocks: totalBlocks,
      });
    } catch (e) {
      res.status(500).json({ error: "Error creando cotización desde upload." });
    }
  };
 
  module.exports = { create, list, download, insights, reanalyze, createQuoteFromUpload };
