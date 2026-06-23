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
- Salud: CUALQUIER dato corporal o médico — pulsaciones, presión arterial, glucosa, peso, temperatura, oxígeno, frecuencia cardíaca, síntomas (dolor, mareo, cansancio, fiebre, etc.), medicamentos, dosis, tratamientos, turnos médicos, análisis, resultados de laboratorio, bienestar físico o mental. Si hay un número que parece una medición corporal, es Salud.
- Pendientes: tareas, recordatorios, cosas por hacer, llamadas a hacer, trámites
- Eventos: fechas concretas, citas, reuniones, cumpleaños, planes futuros con fecha u hora
- Compras: ítems para comprar, lista del súper, productos, ingredientes, marcas
- Diario: pensamientos, sentimientos, reflexiones personales, lo que pasó hoy (solo si no encaja en ninguna categoría anterior)

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
