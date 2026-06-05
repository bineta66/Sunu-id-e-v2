export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { titre = "", description = "", categories = [] } = req.body;

    const categoriesDisponibles =
      categories.length > 0
        ? categories
        : [
            "Amélioration technique",
            "Pédagogie",
            "Événement",
            "Vie de campus",
            "Ressources",
            "Collaboration",
            "autres",
          ];

    const prompt = `Tu es un assistant qui classe des idées soumises par des étudiants dans une plateforme communautaire.

Voici l'idée à classer :
- Titre : "${titre}"
- Description : "${description}"

Catégories disponibles :
${categoriesDisponibles.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Réponds UNIQUEMENT avec le nom exact de la catégorie la plus appropriée, sans explication, sans ponctuation supplémentaire.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://votre-site.vercel.app",
        "X-Title": "Idées Communauté",
      },
      body: JSON.stringify({
        model: "google/gemma-4-31b-it:freem",
        max_tokens: 50,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim() || "";

    console.log("Réponse brute IA:", responseText);

    const normalize = (str) =>
      str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const categorieTrouvee = categoriesDisponibles.find(
      (c) => normalize(c) === normalize(responseText)
    );

    const categorie = categorieTrouvee || categoriesDisponibles[0];

    return res.status(200).json({ categorie });

  } catch (e) {
    console.error("Erreur:", e);
    return res.status(200).json({
      categorie: "Amélioration technique",
      fallback: true,
      error: e.message,
    });
  }
}

