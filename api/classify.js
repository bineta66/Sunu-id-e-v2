export default async function handler(req, res) {

  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const { titre, description, categories } = req.body || {};

    if (!titre || !description) {
      res.status(400).json({ error: "Missing titre or description" });
      return;
    }

    const CATS_VALIDES = categories?.length
      ? categories
      : ["Pédagogie", "Événement", "Vie de campus", "Technique"];

    const prompt = `Catégorise cette idée. Réponds avec UN SEUL mot ou groupe parmi :\n${CATS_VALIDES.join("\n")}\n\n- Pédagogie : cours, examens, notes, profs, formation\n- Événement : fête, sortie, tournoi, cérémonie, journée culturelle, repas collectif\n- Vie de campus : cafétéria, logement, sport, santé, association, transport, nourriture\n- Technique : site, application, code, wifi, matériel, déploiement, serveur\n\nTitre: "${titre}"\nDescription: "${description}"\n\nCatégorie:`;

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10,
        temperature: 0
      })
    }).catch((e) => {
      throw e;
    });

    clearTimeout(timeout);

    if (!response.ok) {
      res.status(502).json({ error: "OpenRouter error", status: response.status });
      return;
    }

    const data = await response.json();
    const brut = data?.choices?.[0]?.message?.content?.trim() || "";

    const normalize = (s) => s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    const found = CATS_VALIDES.find(cat => normalize(brut).includes(normalize(cat)));

    const category = found || "Technique"; // fallback si IA indisponible

    res.status(200).json({ category });
  } catch (err) {
    // Fallback sécurité
    res.status(200).json({ category: "Technique" });
  }
}

