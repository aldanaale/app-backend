const express = require('express');
const router = express.Router();

const fetchFn = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

router.post('/assist', async (req, res) => {
  const { role, project_description, existing_assets } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'Falta OPENROUTER_API_KEY' });
  }
  const r = role === 'cliente' ? 'Cliente' : 'Usuario';
  const assets = Array.isArray(existing_assets) ? existing_assets.join(', ') : '';
  const system = 'Eres un asistente experto en onboarding y recolección de insumos para un proyecto de mudanza digital. Genera una lista clara y accionable de lo que debe subir el usuario, con pasos numerados y validaciones básicas.';
  const userPrompt =
    `Rol: ${r}. Contexto: ${project_description || 'Sin descripción.'}. Recursos actuales: ${assets || 'Ninguno.'}. ` +
    `Indica exactamente qué archivos, datos e imágenes debe subir para continuar y cómo validarlos antes de enviar. ` +
    `Devuelve JSON con claves: "pasos", "requisitos", "validaciones", "mensajes". Idioma: español.`;
  try {
    const response = await fetchFn('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'MudanzaApp',
        'X-Title': 'MudanzaApp Backend'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    res.json({ content, raw: data });
  } catch (e) {
    res.status(500).json({ error: 'Error consultando OpenRouter', detail: String(e) });
  }
});

module.exports = router;
