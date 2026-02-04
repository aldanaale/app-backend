require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const trucksRoutes = require('./routes/trucksRoutes');
const quotesRoutes = require('./routes/quotesRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const { ensureSchema } = require('./initDb');

const whitelist = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1) return callback(null, true);
    const dev = process.env.NODE_ENV !== 'production';
    if (dev) {
      const o = origin || '';
      if (
        o.startsWith('http://localhost:') ||
        o.startsWith('http://127.0.0.1:') ||
        o.startsWith('http://192.168.') ||
        o.endsWith('.trycloudflare.com')
      ) {
        return callback(null, true);
      }
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/trucks', trucksRoutes);
app.use('/quotes', quotesRoutes);
app.use('/ai', aiRoutes);
app.use('/uploads', uploadRoutes);
app.use('/admin', adminRoutes);

// Root endpoint for health check
app.get('/', (req, res) => {
  res.send('API de Mudanza App funcionando.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

app.listen(PORT, async () => {
  try {
    await ensureSchema();
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  } catch (e) {
    console.error('Error inicializando esquema:', e);
  }
});
