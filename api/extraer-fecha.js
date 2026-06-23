import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { texto } = req.body;
  if (!texto) return res.status(400).json({ error: 'Texto vacío' });

  const hoy = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{
      role: 'user',
      content: `Hoy es ${hoy}.

Extraé la fecha y hora del siguiente texto de evento. Respondé SOLO con JSON, sin explicación ni markdown.

Formato requerido:
{"fechaISO":"2026-06-25T19:00:00","nombre":"Cena con Ana"}

- fechaISO: fecha y hora en formato ISO 8601 local (sin Z ni offset)
- nombre: nombre corto del evento (máximo 5 palabras)
- Si no hay hora explícita, usá 09:00
- Si no podés determinar la fecha, respondé: {"error":"sin fecha"}

Texto: "${texto.slice(0, 400)}"`
    }]
  });

  try {
    const raw = message.content[0].text.trim();
    const json = JSON.parse(raw);
    res.status(200).json(json);
  } catch {
    res.status(200).json({ error: 'sin fecha' });
  }
}
