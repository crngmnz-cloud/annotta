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
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Analizá este texto y separalo en ítems individuales. Cada ítem puede ser de una categoría distinta. Respondé SOLO con JSON, sin explicación ni markdown.

Categorías:
- Salud: mediciones corporales (pulsaciones, presión, glucosa, peso, temperatura), síntomas físicos o mentales, turnos médicos, resultados de análisis. NO incluye medicamentos si el contexto es comprarlos.
- Pendientes: tareas, recordatorios, trámites, cosas por hacer
- Eventos: fechas concretas, citas, reuniones, planes futuros con fecha u hora
- Compras: productos para comprar — alimentos, ingredientes, materiales, herramientas, Y TAMBIÉN medicamentos cuando el contexto es comprarlos (subcategoría "Farmacia")
- Diario: pensamientos, sentimientos, reflexiones (solo si no encaja en ninguna otra)

Subcategorías para Compras: ${subcats}

REGLAS:
- Separar el texto en todos sus ítems individuales aunque sean de categorías distintas
- Medicamentos en contexto de compra → Compras / Farmacia. Medicamentos en contexto de haberlos tomado o prescriptos → Salud
- Si el texto es una sola idea unificada (no una lista), devolver un solo ítem

Formato siempre: {"items":[{"texto":"manzanas","categoria":"Compras","subcategoria":"Frutas y Verduras"},{"texto":"seretide diskus","categoria":"Salud","subcategoria":"Medicamentos"}]}

Texto: "${texto.slice(0, 500)}"`
    }]
  });

  try {
    const json = JSON.parse(message.content[0].text.trim());
    const validas = ['Salud', 'Pendientes', 'Eventos', 'Diario', 'Compras'];
    if (!Array.isArray(json.items) || !json.items.length) throw new Error();
    json.items.forEach(it => { if (!validas.includes(it.categoria)) it.categoria = 'Diario'; });
    return res.status(200).json(json);
  } catch {
    return res.status(200).json({ items: [{ texto, categoria: 'Diario' }] });
  }
}
