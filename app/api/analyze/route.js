import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractJson(text) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No JSON found.");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const images = formData.getAll("images");

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "Missing API key." }, { status: 500 });
    }

    if (!images.length) {
      return Response.json({ error: "No photos uploaded." }, { status: 400 });
    }

    const imageInputs = [];

    for (const image of images) {
      const arrayBuffer = await image.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      imageInputs.push({
        type: "input_image",
        image_url: `data:${image.type || "image/jpeg"};base64,${base64}`,
      });
    }

    const result = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Analyze these photos as one combined kitchen inventory.

Return ONLY valid JSON.

Find confirmed ingredients, possible ingredients, and 5 realistic meal ideas.

Avoid weird combinations. Make meals normal and useful.

JSON format:
{
  "ingredients": ["item"],
  "possibleIngredients": ["item"],
  "meals": [
    {
      "name": "Meal name",
      "description": "Short description",
      "cookTime": "15 min",
      "difficulty": "Easy",
      "matchScore": 90,
      "ingredientsUsed": ["item"],
      "missingOptional": ["item"],
      "steps": ["step 1", "step 2", "step 3"]
    }
  ]
}
              `,
            },
            ...imageInputs,
          ],
        },
      ],
    });

    const data = extractJson(result.output_text);

    return Response.json({
      ingredients: data.ingredients || [],
      possibleIngredients: data.possibleIngredients || [],
      meals: data.meals || [],
    });
  } catch (error) {
    console.error("Analyze error:", error);

    return Response.json(
      {
        error: "Scan failed. Try 1–3 clear photos with good lighting.",
      },
      { status: 500 }
    );
  }
}