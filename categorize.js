exports.handler = async (event) => {
  try {
    // Sécurité : Vérifier si le corps de la requête existe
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Corps de la requête manquant" }),
      };
    }

    const { titre, description } = JSON.parse(event.body);

    const prompt = `
Classifie cette idée dans UNE seule catégorie parmi :

- Pédagogie
- Événement
- Vie de campus
- Amélioration technique

Titre : ${titre}

Description : ${description}

Réponds uniquement avec le nom exact de la catégorie.
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct:free",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0,
        }),
      }
    );

    const data = await response.json();

    let categorie =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Amélioration technique";

    // Nettoyage (Fallback robuste)
    const catLower = categorie.toLowerCase();
    
    if (catLower.includes("pédagog") || catLower.includes("pedagog")) {
      categorie = "Pédagogie";
    } else if (catLower.includes("événement") || catLower.includes("evenement")) {
      categorie = "Événement";
    } else if (catLower.includes("campus")) {
      categorie = "Vie de campus";
    } else if (catLower.includes("tech")) {
      categorie = "Amélioration technique";
    } else {
      categorie = "Amélioration technique";
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        categorie,
      }),
    };
  } catch (error) {
    console.error("Erreur Function:", error);

    return {
      statusCode: 200, // On retourne 200 pour que le fallback client fonctionne
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        categorie: "Amélioration technique",
        error: error.message
      }),
    };
  }
};