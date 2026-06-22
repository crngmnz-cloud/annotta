import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { texto } = req.body;

  if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
    return res.status(400).json({ error: 'Texto vacío' });
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 20,
    messages: [
      {
        role: 'user',
        content: `Clasifica este texto en UNA sola categoría. Responde ÚNICAMENTE con la palabra exacta, sin explicación ni puntuación.

Categorías posibles:
- Salud (síntomas, medicamentos, citas médicas, bienestar físico o mental)
- Pendientes (tareas, cosas por hacer, recordatorios, compras)
- Eventos (fechas, citas, reuniones, planes futuros)
- Diario (pensamientos, sentimientos, reflexiones, lo que pasó hoy)

Texto: "${texto.slice(0, 500)}"`
      }
    ]
  });

  const categoria = message.content[0].text.trim();
  const validas = ['Salud', 'Pendientes', 'Eventos', 'Diario'];
  const resultado = validas.find(v => categoria.includes(v)) || 'Diario';

  res.status(200).json({ categoria: resultado });
}
