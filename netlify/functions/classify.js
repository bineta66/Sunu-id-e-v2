import process from "node:process";

const CATS_VALIDES = ["Pédagogie", "Événement", "Vie de campus", "Technique"];

const normalize = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export async function handler(event) {
  try {
    if (event?.httpMethod !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" }
      });
    }

    const body = event?.body ? JSON.parse(event.body) : {};
    const { titre, description, categories } = body;

    if (!titre || !description) {
      return new Response(
        JSON.stringify({ error: "Missing titre or description" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const cats = categories?.length ? categories : CATS_VALIDES;

    const prompt = `Catégorise cette idée. Réponds avec UN SEUL mot ou groupe parmi :\n${cats.join(
      "\\n"
    )}\n\n- Pédagogie : cours, examens, notes, profs, formation\n- Événement : fête, sortie, tournoi, cérémonie, journée culturelle, repas collectif\n- Vie de campus : cafétéria, logement, sport, santé, association, transport, nourriture\n- Technique : site, application, code, wifi, matériel, déploiement, serveur\n\nTitre: "${titre}"\nDescription: "${description}"\n\nCatégorie:`;

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
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
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "OpenRouter error", status: response.status }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    const data = await response.json();
    const brut = data?.choices?.[0]?.message?.content?.trim() || "";

    const found = cats.find((cat) => normalize(brut).includes(normalize(cat)));
    const category = found || "Technique";

    return new Response(JSON.stringify({ category }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (err) {
    // Fallback sécurité
    return new Response(JSON.stringify({ category: "Technique" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
}

