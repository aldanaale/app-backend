require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const trucksRoutes = require('./routes/trucksRoutes');
const quotesRoutes = require('./routes/quotesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/trucks', trucksRoutes);
app.use('/quotes', quotesRoutes);

// Root endpoint for health check
app.get('/', (req, res) => {
  res.send('API de Mudanza App funcionando.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
