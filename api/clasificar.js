import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { texto, subcategorias } = req.body;
  if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
    return res.status(400).json({ error: 'Texto vacío' });
  }

  const subcats = Array.isArray(subcategorias) && subcategorias.length
    ? subcategorias.join(', ')
    : 'Comestibles, Frutas y Verduras, Perfumería, Limpieza, Ferretería, Farmacia';

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 60,
    messages: [{
      role: 'user',
      content: `Clasificá este texto. Respondé SOLO con JSON, sin explicación ni markdown.

Categorías:
- Salud: síntomas, medicamentos, turnos médicos, bienestar físico o mental
- Pendientes: tareas, recordatorios, cosas por hacer
- Eventos: fechas, citas, reuniones, planes futuros con fecha/hora
- Compras: ítems para comprar, lista del súper, productos, ingredientes
- Diario: pensamientos, sentimientos, reflexiones, lo que pasó hoy

Si es Compras, incluí la subcategoría más apropiada entre: ${subcats}.

Formato Compras: {"categoria":"Compras","subcategoria":"Comestibles"}
Formato resto:   {"categoria":"Salud"}

Texto: "${texto.slice(0, 500)}"`
    }]
  });

  try {
    const json = JSON.parse(message.content[0].text.trim());
    const validas = ['Salud', 'Pendientes', 'Eventos', 'Diario', 'Compras'];
    if (!validas.includes(json.categoria)) json.categoria = 'Diario';
    return res.status(200).json(json);
  } catch {
    return res.status(200).json({ categoria: 'Diario' });
  }
}
