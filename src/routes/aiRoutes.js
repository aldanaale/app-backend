const express = require("express");
const router = express.Router();

const fetchFn = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Simple fallback generator when AI credits are unavailable or key is missing
function generateFallback(role, project_description, existing_assets) {
  const r = role === "cliente" ? "Cliente" : "Usuario";
  const assets = Array.isArray(existing_assets) ? existing_assets : [];
  return {
    pasos: [
      "1) Reúne inventario: lista con nombre del mueble y cantidad.",
      "2) Sube imágenes claras (frente/lateral) de los muebles voluminosos.",
      "3) Indica origen y destino (comuna) y distancia estimada.",
      "4) Confirma fecha y rango horario de la mudanza.",
      "5) Adjunta restricciones del edificio (horarios, ascensor, estacionamiento).",
    ],
    requisitos: [
      "Inventario en CSV o Excel (nombre,cantidad).",
      "Fotos en JPG/PNG (máx 5MB por archivo).",
      "Direcciones completas y comunas.",
      "Contacto telefónico.",
    ],
    validaciones: [
      "El CSV debe tener encabezados y cantidades numéricas.",
      "Cada imagen debe ser nítida y menor a 5MB.",
      "Origen y destino no deben ser iguales.",
      "La distancia debe ser un número mayor o igual a 0.",
    ],
    mensajes: [
      `Rol: ${r}`,
      `Contexto: ${project_description || "Sin descripción."}`,
      `Recursos actuales: ${assets.length ? assets.join(", ") : "Ninguno."}`,
    ],
  };
}

// GET raíz para verificación rápida
router.get("/", (req, res) => {
  res.json({
    info: "AI API lista. Usa GET /ai/assist para instrucciones, o POST /ai/assist.",
  });
});

// Optional GET to clarify usage when opened in browser
router.get("/assist", (req, res) => {
  res.json({
    info: "Usa POST /ai/assist con JSON { role, project_description, existing_assets }. Si no hay créditos o clave, se entrega respuesta de fallback.",
  });
});

router.post("/assist", async (req, res) => {
  const { role, project_description, existing_assets } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const mock = generateFallback(role, project_description, existing_assets);
    return res.status(200).json({ content: mock, source: "fallback_no_key" });
  }
  const r = role === "cliente" ? "Cliente" : "Usuario";
  const assets = Array.isArray(existing_assets)
    ? existing_assets.join(", ")
    : "";
  const system =
    "Eres un asistente experto en onboarding y recolección de insumos para un proyecto de mudanza digital. Genera una lista clara y accionable de lo que debe subir el usuario, con pasos numerados y validaciones básicas.";
  const userPrompt =
    `Rol: ${r}. Contexto: ${project_description || "Sin descripción."}. Recursos actuales: ${assets || "Ninguno."}. ` +
    `Indica exactamente qué archivos, datos e imágenes debe subir para continuar y cómo validarlos antes de enviar. ` +
    `Devuelve JSON con claves: "pasos", "requisitos", "validaciones", "mensajes". Idioma: español.`;
  try {
    const response = await fetchFn(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "MudanzaApp",
          "X-Title": "MudanzaApp Backend",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
      },
    );
    if (!response.ok) {
      const mock = generateFallback(role, project_description, existing_assets);
      return res
        .status(200)
        .json({
          content: mock,
          source: `fallback_http_${response.status}`,
          detail: response.statusText,
        });
    }
    const data = await response.json();
    if (data?.error?.code === 402) {
      const mock = generateFallback(role, project_description, existing_assets);
      return res
        .status(200)
        .json({
          content: mock,
          source: "fallback_insufficient_credits",
          raw: data,
        });
    }
    if (data?.error) {
      const mock = generateFallback(role, project_description, existing_assets);
      return res
        .status(200)
        .json({ content: mock, source: "fallback_error_payload", raw: data });
    }
    const content = data?.choices?.[0]?.message?.content || "";
    if (!content) {
      const mock = generateFallback(role, project_description, existing_assets);
      return res
        .status(200)
        .json({ content: mock, source: "fallback_no_content", raw: data });
    }
    res.json({ content, raw: data });
  } catch (e) {
    const mock = generateFallback(role, project_description, existing_assets);
    res
      .status(200)
      .json({ content: mock, source: "fallback_error", detail: String(e) });
  }
});

module.exports = router;
