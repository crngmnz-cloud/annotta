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
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Clasificá este texto. Respondé SOLO con JSON, sin explicación ni markdown.

Categorías principales:
- Salud: datos corporales o médicos — pulsaciones, presión, glucosa, peso, temperatura, síntomas, medicamentos, turnos médicos, análisis. Si hay una medición corporal, es Salud.
- Pendientes: tareas, recordatorios, trámites, cosas por hacer
- Eventos: fechas concretas, citas, reuniones, planes futuros con fecha u hora
- Compras: productos para comprar, lista del súper, ingredientes, materiales
- Diario: pensamientos, sentimientos, reflexiones (solo si no encaja en ninguna otra)

Subcategorías disponibles para Compras: ${subcats}

REGLAS:
1. Si el texto menciona UN solo ítem de compra → {"categoria":"Compras","items":[{"texto":"manzanas","subcategoria":"Frutas y Verduras"}]}
2. Si el texto menciona MÚLTIPLES ítems de compra → lista todos: {"categoria":"Compras","items":[{"texto":"manzanas","subcategoria":"Frutas y Verduras"},{"texto":"tornillos","subcategoria":"Ferretería"}]}
3. Si la subcategoría sugerida no está en la lista disponible, inventá la más lógica.
4. Para cualquier otra categoría → {"categoria":"Salud"}

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
