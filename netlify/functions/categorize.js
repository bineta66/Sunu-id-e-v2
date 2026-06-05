exports.handler = async (event) => {
  try {
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

    // Nettoyage (Fallback)

    if (
      categorie.toLowerCase().includes("pédagog") ||
      categorie.toLowerCase().includes("pedagog")
    ) {
      categorie = "Pédagogie";
    } else if (
      categorie.toLowerCase().includes("événement") ||
      categorie.toLowerCase().includes("evenement")
    ) {
      categorie = "Événement";
    } else if (
      categorie.toLowerCase().includes("campus")
    ) {
      categorie = "Vie de campus";
    } else if (
      categorie.toLowerCase().includes("tech")
    ) {
      categorie = "Amélioration technique";
    } else {
      categorie = "Amélioration technique";
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        categorie,
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 200,
      body: JSON.stringify({
        categorie: "Amélioration technique",
      }),
    };
  }
};